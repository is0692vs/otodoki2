from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import time
import os
import logging
from datetime import datetime
from contextlib import asynccontextmanager

from .dependencies import (
    get_queue_manager,
    get_worker,
    initialize_dependencies,
    cleanup_dependencies,
    start_background_tasks,
    stop_background_tasks
)
from .core.queue import QueueManager
from .services.worker import QueueReplenishmentWorker

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
    initialize_dependencies()
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
