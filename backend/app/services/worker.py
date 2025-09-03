"""
iTunes API補充ワーカーモジュール
バックグラウンドでキューを監視し、必要に応じてiTunes APIから楽曲データを補充
"""

import asyncio
import logging
import time
from typing import Optional

from ..core.queue import QueueManager
from ..core.config import WorkerConfig
from ..services.itunes_api import iTunesApiClient
from ..services.search_strategies import get_strategy, BaseSearchStrategy

logger = logging.getLogger(__name__)
# ロガーの設定


class QueueReplenishmentWorker:
    """キュー補充ワーカー

    バックグラウンドタスクとして動作し、キューサイズを監視して
    必要に応じてiTunes APIから楽曲データを取得・補充する
    """

    def __init__(self, queue_manager: QueueManager):
        """ワーカーを初期化

        Args:
            queue_manager: キューマネージャーインスタンス
        """
        self.queue_manager = queue_manager
        self.config = WorkerConfig()
        self.itunes_client = iTunesApiClient()

        # 検索戦略をロード
        try:
            strategy_name = self.config.get_search_strategy()
            self.search_strategy: BaseSearchStrategy = get_strategy(
                strategy_name)
            logger.info(f"Search strategy loaded: {strategy_name}")
        except ImportError as e:
            logger.error(
                f"Failed to load configured strategy '{self.config.get_search_strategy()}': {e}. Falling back to 'random_keyword'.")
            self.search_strategy: BaseSearchStrategy = get_strategy(
                "random_keyword")

        # ワーカー制御
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._refill_lock = asyncio.Lock()

        # サーキットブレーカー機能
        self._consecutive_failures = 0
        self._max_failures = 5
        self._failure_backoff_multiplier = 2.0
        self._last_failure_time = 0

        logger.info("Queue replenishment worker initialized")

    async def start(self) -> None:
        """ワーカーを開始"""
        if self._running:
            logger.warning("Worker is already running")
            return

        self._running = True
        self._task = asyncio.create_task(self._worker_loop())
        logger.info("Queue replenishment worker started")

    async def stop(self) -> None:
        """ワーカーを停止"""
        if not self._running:
            logger.info("Worker is not running")
            return

        self._running = False

        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                logger.info("Worker task cancelled successfully")

        logger.info("Queue replenishment worker stopped")

    async def trigger_refill(self) -> bool:
        """ワンショットでキューの補充を実行

        Returns:
            bool: 補充が実行された場合True
        """
        if self._refill_lock.locked():
            logger.info(
                "Refill already in progress, skipping one-shot trigger")
            return False

        async with self._refill_lock:
            logger.info("One-shot queue refill triggered")
            return await self._attempt_refill()

    async def _worker_loop(self) -> None:
        """メインワーカーループ"""
        logger.info("Worker loop started")

        while self._running:
            try:
                # サーキットブレーカーチェック
                if self._should_skip_due_to_failures():
                    await self._sleep_interval()
                    continue

                # キューサイズチェック
                current_size = self.queue_manager.size()
                min_threshold = self.config.get_min_threshold()

                if current_size < min_threshold:
                    logger.info(
                        f"Queue size ({current_size}) below threshold ({min_threshold}), attempting refill")

                    async with self._refill_lock:
                        success = await self._attempt_refill()
                        if success:
                            self._consecutive_failures = 0
                        else:
                            self._consecutive_failures += 1
                            self._last_failure_time = time.time()
                else:
                    logger.debug(
                        f"Queue size ({current_size}) above threshold ({min_threshold}), no refill needed")

                await self._sleep_interval()

            except asyncio.CancelledError:
                logger.info("Worker loop cancelled")
                break
            except Exception as e:
                logger.error(f"Unexpected error in worker loop: {e}")
                self._consecutive_failures += 1
                self._last_failure_time = time.time()
                await self._sleep_interval()

        logger.info("Worker loop ended")

    async def _attempt_refill(self) -> bool:
        """キューの補充を試行

        Returns:
            bool: 補充が成功した場合True
        """
        try:
            current_size = self.queue_manager.size()
            max_cap = self.config.get_max_cap()
            batch_size = self.config.get_batch_size()

            # 必要な補充数を計算
            need = min(batch_size, max_cap - current_size)
            if need <= 0:
                logger.info(
                    f"Queue is at capacity ({current_size}/{max_cap}), no refill needed")
                return True

            filled = 0
            attempts = 0
            max_attempts = 3

            while filled < need and attempts < max_attempts:
                search_params = {}
                try:
                    # パラメータ生成
                    search_params = self.search_strategy.generate_params()

                    # iTunes API検索
                    raw_tracks = await self.itunes_client.search_tracks(custom_params=search_params, limit=200)
                    if not raw_tracks:
                        attempts += 1
                        continue

                    # データ整形
                    cleaned_tracks = self.itunes_client.clean_and_filter_tracks(
                        raw_tracks)
                    if not cleaned_tracks:
                        attempts += 1
                        continue

                    # キューに追加（必要数まで）
                    tracks_to_add = cleaned_tracks[:need - filled]
                    added_count = self.queue_manager.enqueue(tracks_to_add)
                    filled += added_count

                    logger.info(
                        f"Added {added_count} tracks to queue (total filled: {filled}/{need})")

                    # 目標達成チェック
                    if filled >= need:
                        break

                except Exception as e:
                    logger.warning(
                        f"Failed to fetch tracks with params {search_params}: {e}")

                attempts += 1

            # 結果ログ
            final_size = self.queue_manager.size()
            if filled > 0:
                logger.info(
                    f"Refill completed: added {filled} tracks, queue size: {current_size} -> {final_size}")
                return True
            else:
                logger.warning(
                    f"Refill failed: no tracks added after {attempts} attempts")
                return False

        except Exception as e:
            logger.error(f"Error during queue refill: {e}")
            return False

    def _should_skip_due_to_failures(self) -> bool:
        """連続失敗によるスキップ判定

        Returns:
            bool: スキップすべき場合True
        """
        if self._consecutive_failures < self._max_failures:
            return False

        # バックオフ時間の計算
        backoff_time = (self._failure_backoff_multiplier **
                        min(self._consecutive_failures - self._max_failures, 5)) * 60
        time_since_failure = time.time() - self._last_failure_time

        if time_since_failure < backoff_time:
            logger.debug(
                f"Skipping refill due to consecutive failures (backoff: {backoff_time:.1f}s)")
            return True

        return False

    async def _sleep_interval(self) -> None:
        """ポーリング間隔の待機"""
        interval_ms = self.config.get_poll_interval_ms()

        # 連続失敗時は間隔を延長
        if self._consecutive_failures >= self._max_failures:
            interval_ms *= self._failure_backoff_multiplier

        await asyncio.sleep(interval_ms / 1000.0)

    @property
    def is_running(self) -> bool:
        """ワーカーの実行状態を取得"""
        return self._running

    @property
    def stats(self) -> dict:
        """ワーカーの統計情報を取得"""
        return {
            "running": self._running,
            "consecutive_failures": self._consecutive_failures,
            "max_failures": self._max_failures,
            "refill_in_progress": self._refill_lock.locked(),
            "poll_interval_ms": self.config.get_poll_interval_ms(),
            "min_threshold": self.config.get_min_threshold(),
            "batch_size": self.config.get_batch_size(),
            "max_cap": self.config.get_max_cap(),
            "search_strategy": self.config.get_search_strategy(),
        }
