"""
レート制限機能モジュール
短時間での過剰なAPIアクセスを制御する
"""

import time
import threading
from collections import deque
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """時間ベースのレート制限器

    スライディングウィンドウ方式で指定期間内のリクエスト数を制限
    """

    def __init__(self, max_requests: int = 20, window_seconds: int = 1):
        """レート制限器を初期化

        Args:
            max_requests: 制限期間内の最大リクエスト数
            window_seconds: 制限期間（秒）
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: deque = deque()
        self._lock = threading.Lock()

        logger.info(
            f"RateLimiter initialized: {max_requests} requests "
            f"per {window_seconds} seconds"
        )

    def is_allowed(self) -> bool:
        """リクエストが許可されるかチェック

        Returns:
            bool: リクエストが許可される場合True
        """
        current_time = time.time()

        with self._lock:
            # 古いリクエストタイムスタンプを削除
            cutoff_time = current_time - self.window_seconds
            while self._requests and self._requests[0] < cutoff_time:
                self._requests.popleft()

            # 制限チェック
            if len(self._requests) >= self.max_requests:
                logger.warning(
                    f"Rate limit exceeded: {len(self._requests)} requests "
                    f"in {self.window_seconds} seconds"
                )
                return False

            # 新しいリクエストを記録
            self._requests.append(current_time)
            return True

    def get_retry_after(self) -> float:
        """リトライまでの推奨待機時間を取得

        Returns:
            float: 待機時間（秒）
        """
        current_time = time.time()

        with self._lock:
            if not self._requests:
                return 0.0

            # 最も古いリクエストから制限期間が経過するまでの時間
            oldest_request = self._requests[0]
            wait_time = (oldest_request + self.window_seconds) - current_time
            return max(0.0, wait_time)

    def get_current_count(self) -> int:
        """現在の期間内リクエスト数を取得

        Returns:
            int: 現在のリクエスト数
        """
        current_time = time.time()

        with self._lock:
            # 古いリクエストタイムスタンプを削除
            cutoff_time = current_time - self.window_seconds
            while self._requests and self._requests[0] < cutoff_time:
                self._requests.popleft()

            return len(self._requests)

    def reset(self) -> None:
        """レート制限をリセット（テスト用）"""
        with self._lock:
            self._requests.clear()

        logger.debug("Rate limiter reset")


class GlobalRateLimiter:
    """グローバルレート制限器

    アプリケーション全体で共有される単一インスタンス
    """

    _instance: Optional['GlobalRateLimiter'] = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if not hasattr(self, '_initialized'):
            # デフォルト設定は環境変数から取得（後で設定される）
            self._limiter: Optional[RateLimiter] = None
            self._initialized = True

    def initialize(self, max_requests: int, window_seconds: int = 1):
        """レート制限器を初期化

        Args:
            max_requests: 制限期間内の最大リクエスト数
            window_seconds: 制限期間（秒）
        """
        self._limiter = RateLimiter(max_requests, window_seconds)
        logger.info(f"Global rate limiter initialized")

    def check_rate_limit(self) -> tuple[bool, float]:
        """レート制限をチェック

        Returns:
            tuple[bool, float]: (許可されるか, リトライ待機時間)
        """
        if self._limiter is None:
            return True, 0.0

        if self._limiter.is_allowed():
            return True, 0.0
        else:
            retry_after = self._limiter.get_retry_after()
            return False, retry_after

    def get_stats(self) -> Dict[str, any]:
        """レート制限統計を取得

        Returns:
            Dict[str, any]: 統計情報
        """
        if self._limiter is None:
            return {
                "initialized": False,
                "current_requests": 0,
                "max_requests": 0,
                "window_seconds": 0
            }

        return {
            "initialized": True,
            "current_requests": self._limiter.get_current_count(),
            "max_requests": self._limiter.max_requests,
            "window_seconds": self._limiter.window_seconds
        }

    def reset(self) -> None:
        """レート制限をリセット（テスト用）"""
        if self._limiter:
            self._limiter.reset()


# グローバルインスタンス
global_rate_limiter = GlobalRateLimiter()
