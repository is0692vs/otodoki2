"""
iTunes API補充ワーカーモジュール
バックグラウンドでキューを監視し、必要に応じてiTunes APIから楽曲データを補充
"""

import asyncio
import logging
import time
from collections import deque
from typing import Optional, Deque, Dict, Any, List, Tuple

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
            # 初期戦略をロード（configで指定された戦略）
            initial_strategy_name = self.config.get_search_strategy()
            self.search_strategy: BaseSearchStrategy = get_strategy(
                initial_strategy_name)
            logger.info(f"初期検索戦略がロードされました: {initial_strategy_name}")
        except ImportError as e:
            logger.error(
                f"設定された戦略 '{self.config.get_search_strategy()}' のロードに失敗しました: {e}。'random_keyword' にフォールバックします。")
            self.search_strategy: BaseSearchStrategy = get_strategy(
                "random_keyword")

        # 利用可能なすべての戦略をロードし、現在の戦略のインデックスを保持
        self._available_strategies: List[BaseSearchStrategy] = []
        self._strategy_index: int = 0
        self._load_all_strategies()

        # 検索キーワードを保持するキュー
        self._keyword_queue: Deque[str] = deque()
        # キーワード補充の閾値
        self._keyword_refill_threshold: int = 3  # キーワードが3個以下になったら補充
        # キーワードキューの最大サイズ
        self._keyword_queue_max_size: int = 20

        # ワーカー制御
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._refill_lock = asyncio.Lock()

        # サーキットブレーカー機能
        self._consecutive_failures = 0
        self._max_failures = 5
        self._failure_backoff_multiplier = 2.0
        self._last_failure_time = 0
        # 戦略ごとの失敗回数と最終失敗時刻
        self._strategy_failure_info: Dict[str, Dict[str, Any]] = {
            s_name: {"failures": 0, "last_failure_time": 0}
            for s_name in self.config.get_available_search_strategies()
        }

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
                # 補充の閾値をワーカーの最大容量の70%に設定（キュー管理と一致させる）
                max_cap = self.config.get_max_cap()
                refill_threshold = int(max_cap * 0.7)

                if current_size < refill_threshold:
                    logger.info(
                        f"Queue size ({current_size}) below threshold ({refill_threshold}), attempting refill")

                    async with self._refill_lock:
                        success = await self._attempt_refill()
                        if success:
                            self._consecutive_failures = 0
                        else:
                            self._consecutive_failures += 1
                            self._last_failure_time = time.time()
                else:
                    logger.debug(
                        f"Queue size ({current_size}) above threshold ({refill_threshold}), no refill needed")

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
                logger.debug(
                    f"Queue is at capacity ({current_size}/{max_cap}), no refill needed")
                return True

            filled = 0
            attempts = 0
            max_attempts = 3

            while filled < need and attempts < max_attempts:
                current_keyword: Optional[str] = None
                try:
                    # キーワードキューが阾値以下の場合、検索戦略から新しいキーワードセットを補充
                    keyword_threshold = int(self._keyword_queue_max_size * 0.7)
                    if len(self._keyword_queue) <= keyword_threshold:
                        logger.info("キーワードキューが空です。検索戦略から新しいキーワードを生成します。")
                        success, generated_params = await self._generate_keywords_with_fallback()

                        if success:
                            if "terms" in generated_params and isinstance(generated_params["terms"], list):
                                for term in generated_params["terms"]:
                                    self._keyword_queue.append(term)
                                logger.info(
                                    f"キーワードキューに{len(generated_params['terms'])}個のキーワードを追加しました。")
                            elif "term" in generated_params and isinstance(generated_params["term"], str):
                                self._keyword_queue.append(
                                    generated_params["term"])
                                logger.info("キーワードキューに1個のキーワードを追加しました。")
                            else:
                                logger.warning(
                                    f"検索戦略からの予期しないフォーマットです: {generated_params}")
                                attempts += 1
                                continue
                        else:
                            logger.warning("キーワードの生成に失敗しました。")
                            attempts += 1
                            continue

                    if not self._keyword_queue:
                        logger.warning("キーワードキューが空のままです。")
                        attempts += 1
                        continue

                    current_keyword = self._keyword_queue.popleft()
                    logger.info(f"キューからキーワードを使用します: {current_keyword}")

                    raw_tracks = await self.itunes_client.search_tracks(custom_params={"term": current_keyword}, limit=500)
                    if not raw_tracks:
                        logger.info(
                            f"キーワード '{current_keyword}' でトラックが見つかりませんでした。短い遅延を追加します。")
                        await asyncio.sleep(1)
                        attempts += 1
                        continue

                    cleaned_tracks = self.itunes_client.clean_and_filter_tracks(
                        raw_tracks)
                    if not cleaned_tracks:
                        logger.info(
                            f"キーワード '{current_keyword}' で有効なトラックが見つかりませんでした。短い遅延を追加します。")
                        await asyncio.sleep(1)
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
                        f"Failed to fetch tracks with keyword {current_keyword}: {e}")

                attempts += 1

                # API連続呼び出しを避けるために2秒待機
                if filled < need and attempts < max_attempts:
                    logger.debug(
                        "Waiting for 2 seconds before next API call...")
                    await asyncio.sleep(2)

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

    async def _generate_keywords_with_fallback(self) -> Tuple[bool, Dict[str, Any]]:
        """
        利用可能な戦略を順番に試行し、キーワードを生成する。
        失敗した戦略は一時的にスキップし、一定時間後に再試行可能にする。
        """
        available_strategy_names = self.config.get_available_search_strategies()

        for _ in range(len(available_strategy_names)):  # 全戦略を最大1周試行
            current_strategy_name = available_strategy_names[self._strategy_index]
            current_strategy_info = self._strategy_failure_info[current_strategy_name]

            # 失敗している戦略の場合、バックオフ時間をチェック
            if current_strategy_info["failures"] > 0:
                backoff_time = (self._failure_backoff_multiplier **
                                min(current_strategy_info["failures"], 5)) * 60  # 失敗回数に応じてバックオフ
                if (time.time() - current_strategy_info["last_failure_time"]) < backoff_time:
                    logger.info(
                        f"戦略 '{current_strategy_name}' はクールダウン中です。スキップします。")
                    self._strategy_index = (
                        self._strategy_index + 1) % len(available_strategy_names)
                    continue

            try:
                # 現在の戦略をロード
                current_strategy: BaseSearchStrategy = get_strategy(
                    current_strategy_name)
                logger.info(f"キーワード生成に戦略 '{current_strategy_name}' を使用します。")
                generated_params = await current_strategy.generate_params()

                if not self._validate_generated_params(generated_params):
                    raise ValueError(
                        f"戦略 '{current_strategy_name}' が有効なキーワードを生成できませんでした。")

                # 成功した場合、失敗カウンタをリセット
                current_strategy_info["failures"] = 0
                return True, generated_params
            except Exception as e:
                error_message = str(e).lower()
                logger.warning(
                    f"戦略 '{current_strategy_name}' でキーワード生成に失敗しました: {e}")
                if "429" in error_message or "quota" in error_message:
                    # クォータエラーの場合、約5分クールダウン
                    # ~4分クールダウン
                    current_strategy_info["failures"] = 2
                    current_strategy_info["last_failure_time"] = time.time()
                    logger.info(
                        "クォータエラーが検出されました。戦略 '%s' を約5分間スキップします。",
                        current_strategy_name,
                    )
                else:
                    current_strategy_info["failures"] += 1
                    current_strategy_info["last_failure_time"] = time.time()

                # 次の戦略へ
                self._strategy_index = (
                    self._strategy_index + 1) % len(available_strategy_names)

        logger.error("利用可能なすべての戦略でキーワード生成に失敗しました。")
        return False, {}

    def _load_all_strategies(self):
        """利用可能なすべての戦略をロードし、初期化する"""
        self._available_strategies = []
        for strategy_name in self.config.get_available_search_strategies():
            try:
                strategy_instance = get_strategy(strategy_name)
                self._available_strategies.append(strategy_instance)
                logger.info(f"利用可能な戦略 '{strategy_name}' をロードしました。")
            except ImportError as e:
                logger.warning(
                    f"戦略 '{strategy_name}' のロードに失敗しました: {e}。スキップします。")

    @staticmethod
    def _validate_generated_params(params: Dict[str, Any]) -> bool:
        """生成されたパラメータが有効かを検証する"""
        if not params:
            return False

        if "terms" in params:
            terms = params.get("terms")
            if not isinstance(terms, list):
                return False

            normalized_terms = [
                term.strip()
                for term in terms
                if isinstance(term, str) and term.strip()
            ]
            if not normalized_terms:
                return False

            params["terms"] = normalized_terms
            return True

        if "term" in params:
            term = params.get("term")
            if isinstance(term, str) and term.strip():
                params["term"] = term.strip()
                return True
            return False

        return False

    @property
    def is_running(self) -> bool:
        """ワーカーの実行状態を取得"""
        return self._running

    @property
    def stats(self) -> dict:
        """ワーカーの統計情報を取得"""
        stats_data = {
            "running": getattr(self, "_running", False),
            "consecutive_failures": getattr(self, "_consecutive_failures", 0),
            "max_failures": getattr(self, "_max_failures", 0),
            "refill_in_progress": (
                getattr(self, "_refill_lock", None)
                and self._refill_lock.locked()
            ),
            "poll_interval_ms": self.config.get_poll_interval_ms(),
            "min_threshold": self.config.get_min_threshold(),
            "batch_size": self.config.get_batch_size(),
            "max_cap": self.config.get_max_cap(),
            "current_search_strategy": getattr(
                self,
                "search_strategy_name",
                self.config.get_search_strategy(),
            ),
            "keyword_queue_size": len(getattr(self, "_keyword_queue", [])),
            "keyword_refill_threshold": getattr(
                self,
                "_keyword_refill_threshold",
                0,
            ),
            "strategy_failure_info": getattr(
                self,
                "_strategy_failure_info",
                {},
            ),
        }
        return stats_data
