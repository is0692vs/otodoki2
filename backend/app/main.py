from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import os
import logging
from datetime import datetime
from contextlib import asynccontextmanager
from typing import Optional

from .dependencies import (
    get_queue_manager,
    get_worker,
    initialize_dependencies,
    cleanup_dependencies,
    start_background_tasks,
    stop_background_tasks
)
from .core.queue import QueueManager
from .core.rate_limit import global_rate_limiter
from .services.worker import QueueReplenishmentWorker
from .services.suggestions import SuggestionsService, check_rate_limit
from .models.suggestions import SuggestionsResponse, ErrorResponse

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """アプリケーションのライフサイクル管理"""
    # 起動時
    logger.info("Starting otodoki2 API application")

    # DB初期化
    logger.info("Initializing database...")
    try:
        import sys
        import os
        # backendディレクトリからの実行を考慮してパスを追加
        backend_dir = os.path.dirname(
            os.path.dirname(os.path.abspath(__file__)))
        if backend_dir not in sys.path:
            sys.path.insert(0, backend_dir)

        from app.db.connection import get_database_connection
        db_connection = get_database_connection()
        db_connection.create_tables()
        logger.info("✅ Database tables created successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize database: {e}")
        raise

    initialize_dependencies()

    # レート制限器を初期化
    from .core.config import SuggestionsConfig
    config = SuggestionsConfig()
    global_rate_limiter.initialize(config.get_rate_limit_per_sec(), 1)

    await start_background_tasks()
    yield
    # 終了時
    logger.info("Shutting down otodoki2 API application")
    await stop_background_tasks()
    cleanup_dependencies()


app = FastAPI(
    title="otodoki2 API",
    version="1.0.0",
    lifespan=lifespan
)


@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time

    if request.url.path == "/health" and response.status_code == 200:
        return response

    logger.info(
        f'{request.client.host}:{request.client.port} - "{request.method} {request.url.path}" {response.status_code} [{process_time:.2f}s]'
    )
    return response

# CORS設定（開発環境用）
origins = os.getenv("ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,  # 当面はCookieを使わない前提
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "*"],
)

# アプリケーション開始時刻を記録
start_time = time.time()


@app.get("/")
def read_root():
    return {"message": "Hello from backend", "service": "otodoki2-api"}


@app.get("/health")
def read_health():
    current_time = time.time()
    uptime = current_time - start_time
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "uptime_seconds": round(uptime, 2),
        "service": "otodoki2-api"
    }


@app.get("/queue/stats")
def get_queue_stats(queue_manager: QueueManager = Depends(get_queue_manager)):
    """キューの統計情報を取得"""
    return queue_manager.stats()


@app.get("/queue/health")
def get_queue_health(queue_manager: QueueManager = Depends(get_queue_manager)):
    """キューの健全性チェック"""
    stats = queue_manager.stats()
    return {
        "status": "healthy" if stats["current_size"] > 0 else "low",
        "size": stats["current_size"],
        "capacity": stats["max_capacity"],
        "utilization_percent": stats["utilization"],
        "is_low_watermark": stats["is_low"]
    }


@app.get("/worker/stats")
def get_worker_stats():
    """ワーカーの統計情報を取得"""
    worker = get_worker()
    if worker is None:
        return {"error": "Worker not initialized"}
    return worker.stats


@app.post("/worker/trigger-refill")
async def trigger_refill():
    """ワンショットでキューの補充を実行"""
    worker = get_worker()
    if worker is None:
        return {"error": "Worker not initialized", "success": False}

    success = await worker.trigger_refill()
    return {
        "success": success,
        "message": "Refill completed" if success else "Refill failed or already in progress"
    }


@app.get("/api/v1/tracks/suggestions", response_model=SuggestionsResponse)
async def get_track_suggestions(
    limit: Optional[int] = Query(
        None, ge=1, le=50, description="返却する楽曲数（1-50）"),
    excludeIds: Optional[str] = Query(None, description="除外する楽曲IDのカンマ区切り文字列"),
    queue_manager: QueueManager = Depends(get_queue_manager)
) -> SuggestionsResponse:
    """楽曲提供APIエンドポイント

    キューから指定された数の楽曲を取得し、excludeIdsで指定された楽曲を除外して返す。
    必要に応じて補充ワーカーをトリガーする。
    """
    # レート制限チェック
    is_allowed, retry_after = check_rate_limit()
    if not is_allowed:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded",
            headers={"Retry-After": str(int(retry_after) + 1)}
        )

    try:
        # パラメータバリデーション
        from .core.config import SuggestionsConfig
        config = SuggestionsConfig()

        validated_limit = limit if limit is not None else config.get_default_limit()
        validated_limit = max(1, min(validated_limit, config.get_max_limit()))

        # excludeIdsをリストに変換
        exclude_ids = []
        if excludeIds:
            try:
                exclude_ids = [id_str.strip()
                               for id_str in excludeIds.split(',') if id_str.strip()]
            except Exception:
                exclude_ids = []

        # SuggestionsServiceでリクエスト処理
        worker = get_worker()
        suggestions_service = SuggestionsService(queue_manager, worker)
        response = await suggestions_service.get_suggestions(validated_limit, exclude_ids)

        return response

    except Exception as e:
        logger.error(f"Error in get_track_suggestions: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )


@app.get("/api/v1/tracks/suggestions/stats")
async def get_suggestions_stats():
    """楽曲提供APIの統計情報"""
    rate_limit_stats = global_rate_limiter.get_stats()
    return {
        "rate_limit": rate_limit_stats
    }


@app.post("/api/v1/tracks/{track_id}/like")
async def like_track(track_id: str):
    """楽曲をlikeする"""
    try:
        # DB接続を取得
        from .db.connection import get_session
        from .db.models import TrackDB

        with get_session() as session:
            # 楽曲を取得または作成
            track = session.query(TrackDB).filter(
                TrackDB.id == track_id).first()
            if not track:
                # 新しい楽曲の場合は作成（基本情報は後で更新される想定）
                track = TrackDB(
                    id=track_id,
                    title="Unknown",
                    artist="Unknown"
                )
                session.add(track)

            # like状態を更新
            track.liked = True
            track.disliked = False
            session.commit()

            logger.info(f"Track {track_id} liked")
            return {"success": True, "message": "Track liked successfully"}

    except Exception as e:
        logger.error(f"Error liking track {track_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to like track")


@app.post("/api/v1/tracks/{track_id}/dislike")
async def dislike_track(track_id: str):
    """楽曲をdislikeする"""
    try:
        # DB接続を取得
        from .db.connection import get_session
        from .db.models import TrackDB

        with get_session() as session:
            # 楽曲を取得または作成
            track = session.query(TrackDB).filter(
                TrackDB.id == track_id).first()
            if not track:
                # 新しい楽曲の場合は作成（基本情報は後で更新される想定）
                track = TrackDB(
                    id=track_id,
                    title="Unknown",
                    artist="Unknown"
                )
                session.add(track)

            # dislike状態を更新
            track.disliked = True
            track.liked = False
            session.commit()

            logger.info(f"Track {track_id} disliked")
            return {"success": True, "message": "Track disliked successfully"}

    except Exception as e:
        logger.error(f"Error disliking track {track_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to dislike track")


@app.get("/api/v1/tracks/disliked")
async def get_disliked_tracks():
    """dislikeした楽曲のIDリストを取得"""
    try:
        from .db.connection import get_session
        from .db.models import TrackDB

        with get_session() as session:
            tracks = session.query(TrackDB).filter(
                TrackDB.disliked == True).all()
            disliked_ids = [track.id for track in tracks]

            return {"disliked_ids": disliked_ids}

    except Exception as e:
        logger.error(f"Error getting disliked tracks: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to get disliked tracks")


@app.get("/api/v1/tracks/liked")
async def get_liked_tracks():
    """likeした楽曲のリストを取得"""
    try:
        from .db.connection import get_session
        from .db.models import TrackDB

        with get_session() as session:
            tracks = session.query(TrackDB).filter(TrackDB.liked == True).all()
            liked_tracks = [track.to_pydantic() for track in tracks]

            return {"tracks": liked_tracks}

    except Exception as e:
        logger.error(f"Error getting liked tracks: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to get liked tracks")
