"""
楽曲データキュー管理モジュール
スレッドセーフなFIFOキューでTrackオブジェクトを管理する
"""

import logging
import threading
import time
from collections import deque
from typing import List, Optional, Dict, Any, Union

from ..models.track import Track
from ..core.config import QueueConfig

logger = logging.getLogger(__name__)


class QueueManager:
    """楽曲データのキューマネージャー

    スレッドセーフなFIFOキューでTrackオブジェクトを管理し、
    容量制御と基本的な統計情報を提供する
    """

    def __init__(self, max_capacity: Optional[int] = None, low_watermark: Optional[int] = None):
        """QueueManagerを初期化

        Args:
            max_capacity: キューの最大容量（None時は設定から取得）
            low_watermark: 低水位マーク（None時は設定から取得）
        """
        self._max_capacity = max_capacity or QueueConfig.get_max_capacity()
        self._low_watermark = low_watermark or QueueConfig.get_low_watermark()

        # スレッドセーフなキューとロック
        self._queue: deque[Track] = deque()
        self._lock = threading.Lock()

        # 統計情報
        self._enqueue_count = 0
        self._dequeue_count = 0
        self._dropped_count = 0
        self._last_warning_time = 0

        logger.info(
            f"QueueManager initialized - "
            f"max_capacity: {self._max_capacity}, "
            f"low_watermark: {self._low_watermark}"
        )

    def enqueue(self, items: List[Track]) -> int:
        """複数のTrackアイテムをキューに追加

        Args:
            items: 追加するTrackのリスト

        Returns:
            int: 実際に追加された件数
        """
        if not items:
            return 0

        valid_items = []

        # 有効なTrackアイテムのみをフィルタリング
        for item in items:
            if item is None:
                continue
            if not isinstance(item, Track):
                logger.warning(f"Invalid item type: {type(item)}, skipping")
                continue
            if not item.id or not item.title or not item.artist:
                logger.warning(f"Invalid Track data: {item}, skipping")
                continue
            valid_items.append(item)

        if not valid_items:
            logger.debug("No valid items to enqueue")
            return 0

        with self._lock:
            # 容量超過時のドロップ処理
            total_after_add = len(self._queue) + len(valid_items)
            drop_count = max(0, total_after_add - self._max_capacity)

            if drop_count > 0:
                # 古いデータから削除
                dropped_items = []
                for _ in range(min(drop_count, len(self._queue))):
                    dropped_items.append(self._queue.popleft())

                self._dropped_count += len(dropped_items)
                logger.debug(
                    f"Dropped {len(dropped_items)} old items due to capacity limit")

            # 新しいアイテムを追加
            for item in valid_items:
                self._queue.append(item)

            self._enqueue_count += len(valid_items)
            current_size = len(self._queue)

        logger.debug(
            f"Enqueued {len(valid_items)} items, "
            f"current size: {current_size}, "
            f"dropped: {drop_count}"
        )

        # 低水位警告チェック（頻度制限あり）
        self._check_low_watermark()

        return len(valid_items)

    def dequeue(self, n: Optional[int] = None) -> List[Track]:
        """キューから指定件数のTrackを取り出し

        Args:
            n: 取り出す件数（None時はデフォルト値を使用）

        Returns:
            List[Track]: 取り出されたTrackのリスト
        """
        if n is None:
            n = QueueConfig.get_dequeue_default_n()

        if n <= 0:
            return []

        with self._lock:
            # 実際に取り出せる件数
            actual_count = min(n, len(self._queue))

            result = []
            for _ in range(actual_count):
                result.append(self._queue.popleft())

            self._dequeue_count += actual_count
            current_size = len(self._queue)

        logger.debug(
            f"Dequeued {actual_count} items (requested: {n}), "
            f"current size: {current_size}"
        )

        # 低水位警告チェック
        self._check_low_watermark()

        return result

    def bulk_dequeue(self, count: int) -> List[Track]:
        """指定された数の楽曲をキューから一括取得

        Args:
            count: 取得したい楽曲数

        Returns:
            List[Track]: 取得された楽曲リスト
        """
        return self.dequeue(count)

    def contains(self, track_id: Union[str, int]) -> bool:
        """指定されたIDの楽曲がキューに含まれているかチェック

        Args:
            track_id: チェックしたい楽曲ID

        Returns:
            bool: 楽曲がキューに含まれる場合True
        """
        track_id_str = str(track_id)

        with self._lock:
            for track in self._queue:
                if str(track.id) == track_id_str:
                    return True

        return False

    def re_enqueue(self, items: List[Track]) -> int:
        """楽曲を再度キューに戻す（末尾に追加）

        Args:
            items: 戻す楽曲のリスト

        Returns:
            int: 実際に戻された件数
        """
        return self.enqueue(items)

    def max_cap(self) -> int:
        """キューの最大容量を取得（別名）

        Returns:
            int: 最大容量
        """
        return self.capacity()

    def size(self) -> int:
        """現在のキューサイズを取得

        Returns:
            int: キューの現在の要素数
        """
        with self._lock:
            return len(self._queue)

    def capacity(self) -> int:
        """キューの最大容量を取得

        Returns:
            int: 設定された最大容量
        """
        return self._max_capacity

    def clear(self) -> int:
        """キューをクリア

        Returns:
            int: クリア前のサイズ
        """
        with self._lock:
            previous_size = len(self._queue)
            self._queue.clear()

        logger.info(f"Queue cleared, removed {previous_size} items")
        return previous_size

    def stats(self) -> Dict[str, Any]:
        """キューの統計情報を取得

        Returns:
            dict: 統計情報の辞書
        """
        with self._lock:
            current_size = len(self._queue)

        return {
            "current_size": current_size,
            "max_capacity": self._max_capacity,
            "low_watermark": self._low_watermark,
            "enqueue_count": self._enqueue_count,
            "dequeue_count": self._dequeue_count,
            "dropped_count": self._dropped_count,
            "is_low": current_size <= self._low_watermark,
            "utilization": round(current_size / self._max_capacity * 100, 2) if self._max_capacity > 0 else 0,
        }

    def _check_low_watermark(self) -> None:
        """低水位マークのチェックと警告出力

        警告の頻度制限（60秒間隔）を実装
        """
        current_size = len(self._queue)

        if current_size <= self._low_watermark:
            current_time = time.time()

            # 60秒間隔で警告
            if current_time - self._last_warning_time >= 60:
                logger.warning(
                    f"Queue size ({current_size}) is below low watermark ({self._low_watermark}). "
                    f"Consider triggering refill process."
                )
                self._last_warning_time = current_time


def queue_self_check(queue_manager: QueueManager) -> bool:
    """キューマネージャーのセルフチェック

    Args:
        queue_manager: チェック対象のQueueManager

    Returns:
        bool: チェック成功時True
    """
    try:
        logger.info("Starting queue self-check")

        # テスト用のTrackを作成
        test_track = Track(
            id="test_001",
            title="Test Song",
            artist="Test Artist",
            artwork_url="https://example.com/art.jpg",
            preview_url="https://example.com/preview.mp3"
        )

        # 初期状態確認
        initial_size = queue_manager.size()
        logger.debug(f"Initial queue size: {initial_size}")

        # enqueue テスト
        added_count = queue_manager.enqueue([test_track])
        if added_count != 1:
            raise Exception(f"Expected to add 1 item, but added {added_count}")

        # size確認
        if queue_manager.size() != initial_size + 1:
            raise Exception("Size mismatch after enqueue")

        # dequeue テスト
        dequeued_items = queue_manager.dequeue(1)
        if len(dequeued_items) != 1:
            raise Exception(
                f"Expected to dequeue 1 item, but got {len(dequeued_items)}")

        # 既存データがある場合は、テスト用Trackが最後に追加されるため、
        # 最初にdequeueされるのは既存Trackになる
        # テスト用Trackの追加と取り出しが確実に行われたかは
        # サイズの変化で確認する

        # 最終サイズ確認
        if queue_manager.size() != initial_size:
            raise Exception("Size mismatch after dequeue")

        # 統計情報確認
        stats = queue_manager.stats()
        logger.debug(f"Queue stats: {stats}")

        logger.info("Queue self-check completed successfully")
        return True

    except Exception as e:
        logger.error(f"Queue self-check failed: {e}")
        return False
