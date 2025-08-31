"""
楽曲提供サービスモジュール
キューから楽曲を取得し、フィルタリング、再エンキューを管理
"""

import asyncio
import logging
import uuid
from datetime import datetime
from typing import List, Tuple, Optional

from ..core.queue import QueueManager
from ..core.config import SuggestionsConfig, WorkerConfig
from ..core.rate_limit import global_rate_limiter
from ..models.track import Track
from ..models.suggestions import SuggestionsResponse, SuggestionsMeta
from ..services.worker import QueueReplenishmentWorker

logger = logging.getLogger(__name__)


class SuggestionsService:
    """楽曲提供サービス

    キューからの楽曲取得、フィルタリング、補充トリガーを管理
    """

    def __init__(self, queue_manager: QueueManager, worker: Optional[QueueReplenishmentWorker] = None):
        """サービスを初期化

        Args:
            queue_manager: キューマネージャー
            worker: 補充ワーカー（オプショナル）
        """
        self.queue_manager = queue_manager
        self.worker = worker
        self.config = SuggestionsConfig()
        self.worker_config = WorkerConfig()

        logger.info("SuggestionsService initialized")

    async def get_suggestions(self, limit: int, exclude_ids: List[str]) -> SuggestionsResponse:
        """楽曲提供メインロジック

        Args:
            limit: 返却する楽曲数
            exclude_ids: 除外する楽曲IDリスト

        Returns:
            SuggestionsResponse: 楽曲提供レスポンス
        """
        request_id = str(uuid.uuid4())[:8]

        logger.info(
            f"[{request_id}] Suggestions request: limit={limit}, "
            f"exclude_count={len(exclude_ids)}"
        )

        # 1. 入力バリデーション
        validated_limit = self._validate_limit(limit)
        validated_exclude_ids = self._validate_exclude_ids(exclude_ids)

        # 2. キューサイズ確認
        queue_size_before = self.queue_manager.size()
        logger.info(f"[{request_id}] Queue size before: {queue_size_before}")

        # 3. 楽曲供給ロジック
        delivered_tracks, unused_tracks = await self._supply_tracks(
            request_id, validated_limit, validated_exclude_ids
        )

        # 4. 未使用楽曲の再エンキュー
        if unused_tracks:
            await self._re_enqueue_unused_tracks(request_id, unused_tracks)

        # 5. 返却後のキューサイズと補充トリガー判定
        queue_size_after = self.queue_manager.size()
        refill_triggered = await self._check_and_trigger_refill(
            request_id, queue_size_after
        )

        # 6. レスポンス構築
        response = self._build_response(
            delivered_tracks, validated_limit, queue_size_after, refill_triggered
        )

        logger.info(
            f"[{request_id}] Request completed: delivered={len(delivered_tracks)}, "
            f"queue_size_after={queue_size_after}, refill_triggered={refill_triggered}"
        )

        return response

    def _validate_limit(self, limit: int) -> int:
        """limit値をバリデーションし正規化

        Args:
            limit: 入力されたlimit値

        Returns:
            int: 正規化されたlimit値
        """
        if limit is None:
            return self.config.get_default_limit()

        # 1〜最大値にクリップ
        max_limit = self.config.get_max_limit()
        validated = max(1, min(limit, max_limit))

        if validated != limit:
            logger.debug(f"Limit adjusted: {limit} -> {validated}")

        return validated

    def _validate_exclude_ids(self, exclude_ids: List[str]) -> List[str]:
        """exclude_idsをバリデーションし正規化

        Args:
            exclude_ids: 除外ID文字列リスト

        Returns:
            List[str]: 正規化された除外IDリスト
        """
        if not exclude_ids:
            return []

        # 有効なIDのみを抽出
        valid_ids = []
        for id_str in exclude_ids:
            if id_str and str(id_str).strip():
                valid_ids.append(str(id_str).strip())

        if len(valid_ids) != len(exclude_ids):
            logger.debug(
                f"Exclude IDs filtered: {len(exclude_ids)} -> {len(valid_ids)}")

        return valid_ids

    async def _supply_tracks(
        self, request_id: str, limit: int, exclude_ids: List[str]
    ) -> Tuple[List[Track], List[Track]]:
        """楽曲供給ロジック

        Args:
            request_id: リクエストID
            limit: 必要な楽曲数
            exclude_ids: 除外IDリスト

        Returns:
            Tuple[List[Track], List[Track]]: (返却用楽曲, 未使用楽曲)
        """
        delivered_tracks = []
        unused_tracks = []

        # 最大取り出し数（取りすぎ防止）
        max_dequeue = limit + 2 * limit  # limit + 2×limit
        total_dequeued = 0

        while len(delivered_tracks) < limit and total_dequeued < max_dequeue:
            # 残り必要数
            need = limit - len(delivered_tracks)
            # 今回取り出す数（バッファ含む）
            fetch_count = min(need + 5, max_dequeue - total_dequeued)

            if fetch_count <= 0:
                break

            # キューから取り出し
            tracks = self.queue_manager.bulk_dequeue(fetch_count)
            if not tracks:
                logger.warning(
                    f"[{request_id}] Queue exhausted, no more tracks available")
                break

            total_dequeued += len(tracks)

            # フィルタリング
            for track in tracks:
                if len(delivered_tracks) >= limit:
                    # 上限到達、残りは未使用
                    unused_tracks.append(track)
                elif str(track.id) in exclude_ids:
                    # 除外対象、未使用に追加
                    unused_tracks.append(track)
                    logger.debug(f"[{request_id}] Excluded track: {track.id}")
                else:
                    # 返却対象
                    delivered_tracks.append(track)

            logger.debug(
                f"[{request_id}] Batch processed: fetched={len(tracks)}, "
                f"delivered_so_far={len(delivered_tracks)}, "
                f"unused_so_far={len(unused_tracks)}"
            )

        logger.info(
            f"[{request_id}] Supply completed: delivered={len(delivered_tracks)}, "
            f"unused={len(unused_tracks)}, total_dequeued={total_dequeued}"
        )

        return delivered_tracks, unused_tracks

    async def _re_enqueue_unused_tracks(self, request_id: str, unused_tracks: List[Track]) -> None:
        """未使用楽曲を再エンキュー

        Args:
            request_id: リクエストID
            unused_tracks: 再エンキューする楽曲リスト
        """
        try:
            if unused_tracks:
                added_count = self.queue_manager.re_enqueue(unused_tracks)
                logger.info(
                    f"[{request_id}] Re-enqueued {added_count}/{len(unused_tracks)} unused tracks"
                )
        except Exception as e:
            logger.error(
                f"[{request_id}] Failed to re-enqueue unused tracks: {e}")
            # 再エンキュー失敗は致命的ではないため、継続

    async def _check_and_trigger_refill(self, request_id: str, queue_size_after: int) -> bool:
        """補充トリガーのチェックと実行

        Args:
            request_id: リクエストID
            queue_size_after: 返却後のキューサイズ

        Returns:
            bool: 補充トリガーを実行した場合True
        """
        min_threshold = self.worker_config.get_min_threshold()

        if queue_size_after < min_threshold:
            if self.worker:
                try:
                    # 非同期で補充トリガー実行
                    asyncio.create_task(self._trigger_refill_async(request_id))
                    return True
                except Exception as e:
                    logger.warning(
                        f"[{request_id}] Failed to trigger refill: {e}")
            else:
                logger.warning(
                    f"[{request_id}] Worker not available for refill trigger")

        return False

    async def _trigger_refill_async(self, request_id: str) -> None:
        """非同期補充トリガー実行

        Args:
            request_id: リクエストID
        """
        try:
            success = await self.worker.trigger_refill()
            if success:
                logger.info(f"[{request_id}] Refill triggered successfully")
            else:
                logger.info(f"[{request_id}] Refill already in progress")
        except Exception as e:
            logger.error(f"[{request_id}] Refill trigger failed: {e}")

    def _build_response(
        self, delivered_tracks: List[Track], requested: int,
        queue_size_after: int, refill_triggered: bool
    ) -> SuggestionsResponse:
        """レスポンスを構築

        Args:
            delivered_tracks: 返却する楽曲リスト
            requested: リクエストされた楽曲数
            queue_size_after: 返却後のキューサイズ
            refill_triggered: 補充トリガーが実行されたか

        Returns:
            SuggestionsResponse: 構築されたレスポンス
        """
        # Trackデータを仕様に合わせて整形
        formatted_tracks = []
        for track in delivered_tracks:
            # Issue #6の整形仕様に準拠した形式
            formatted_track = Track(
                id=track.id,
                title=track.title,
                artist=track.artist,
                artwork_url=track.artwork_url,  # artworkUrl100 or artworkUrl600
                preview_url=track.preview_url,
                album=track.album,  # collectionName
                genre=track.genre   # primaryGenreName
            )
            formatted_tracks.append(formatted_track)

        # メタデータ構築
        meta = SuggestionsMeta(
            requested=requested,
            delivered=len(formatted_tracks),
            queue_size_after=queue_size_after,
            refill_triggered=refill_triggered,
            ts=datetime.utcnow().isoformat() + "Z"
        )

        return SuggestionsResponse(data=formatted_tracks, meta=meta)


def check_rate_limit() -> Tuple[bool, float]:
    """グローバルレート制限をチェック

    Returns:
        Tuple[bool, float]: (許可されるか, リトライ待機時間)
    """
    return global_rate_limiter.check_rate_limit()
