"""
楽曲データキュー管理モジュール
データベースベースのFIFOキューでTrackオブジェクトを管理する
"""

import logging
import random
import os
from typing import List, Optional, Dict, Any, Union
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from ..models.track import Track
from .models import TrackDB
from .connection import get_database_connection

logger = logging.getLogger(__name__)


def get_max_capacity() -> int:
    """キューの最大容量を取得"""
    value = os.getenv("QUEUE_MAX_CAPACITY", "1000")
    try:
        return max(1, int(value))
    except ValueError:
        return 1000


def get_low_watermark() -> int:
    """キューの補充トリガ閾値を取得"""
    value = os.getenv("QUEUE_LOW_WATERMARK", "100")
    try:
        return max(0, int(value))
    except ValueError:
        return 100


def get_dequeue_default_n() -> int:
    """dequeueのデフォルト取得件数を取得"""
    value = os.getenv("QUEUE_DEQUEUE_DEFAULT_N", "10")
    try:
        return max(1, int(value))
    except ValueError:
        return 10


class QueueManager:
    """楽曲データのキューマネージャー

    データベースベースのFIFOキューでTrackオブジェクトを管理し、
    容量制御と基本的な統計情報を提供する
    """

    def __init__(self, max_capacity: Optional[int] = None, low_watermark: Optional[int] = None):
        """QueueManagerを初期化

        Args:
            max_capacity: キューの最大容量（None時は設定から取得）
            low_watermark: 低水位マーク（None時は設定から取得）
        """
        self._max_capacity = max_capacity or get_max_capacity()
        self._low_watermark = low_watermark or get_low_watermark()

        # 統計情報
        self._enqueue_count = 0
        self._dequeue_count = 0
        self._dropped_count = 0

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

        with get_database_connection().get_session() as session:
            try:
                # 容量超過時のドロップ処理
                current_size = session.query(TrackDB).count()
                total_after_add = current_size + len(valid_items)
                drop_count = max(0, total_after_add - self._max_capacity)

                if drop_count > 0:
                    # 古いデータから削除
                    oldest_tracks = session.query(TrackDB).order_by(
                        TrackDB.id).limit(drop_count).all()
                    for track in oldest_tracks:
                        session.delete(track)
                    self._dropped_count += len(oldest_tracks)
                    logger.debug(
                        f"Dropped {len(oldest_tracks)} old items due to capacity limit")

                # 新しいアイテムを追加
                for item in valid_items:
                    # 重複チェック
                    existing = session.query(TrackDB).filter(
                        TrackDB.id == str(item.id)).first()
                    if existing:
                        continue

                    track_db = TrackDB.from_pydantic(item)
                    session.add(track_db)

                session.commit()
                self._enqueue_count += len(valid_items)
                current_size = session.query(TrackDB).count()

            except Exception as e:
                session.rollback()
                logger.error(f"Error during enqueue: {e}")
                return 0

        logger.debug(
            f"Enqueued {len(valid_items)} items, "
            f"current size: {current_size}, "
            f"dropped: {drop_count}"
        )

        return len(valid_items)

    def dequeue(self, n: Optional[int] = None) -> List[Track]:
        """キューから指定件数のTrackを取り出し

        Args:
            n: 取り出す件数（None時はデフォルト値を使用）

        Returns:
            List[Track]: 取り出されたTrackのリスト
        """
        if n is None:
            n = get_dequeue_default_n()

        if n <= 0:
            return []

        with get_database_connection().get_session() as session:
            try:
                # 取り出すアイテムを取得
                tracks_db = session.query(TrackDB).order_by(
                    TrackDB.id).limit(n).all()

                result = []
                for track_db in tracks_db:
                    result.append(track_db.to_pydantic())
                    session.delete(track_db)

                session.commit()
                self._dequeue_count += len(result)

            except Exception as e:
                session.rollback()
                logger.error(f"Error during dequeue: {e}")
                return []

        logger.debug(
            f"Dequeued {len(result)} items (requested: {n})"
        )

        return result

    def dequeue_random(self, n: Optional[int] = None) -> List[Track]:
        """キューから指定件数のTrackをランダムに取り出し

        Args:
            n: 取り出す件数（None時はデフォルト値を使用）

        Returns:
            List[Track]: 取り出されたTrackのリスト
        """
        if n is None:
            n = get_dequeue_default_n()

        if n <= 0:
            return []

        with get_database_connection().get_session() as session:
            try:
                # ランダムに取り出す
                tracks_db = session.query(TrackDB).order_by(
                    text('RANDOM()')).limit(n).all()

                result = []
                for track_db in tracks_db:
                    result.append(track_db.to_pydantic())
                    session.delete(track_db)

                session.commit()
                self._dequeue_count += len(result)

            except Exception as e:
                session.rollback()
                logger.error(f"Error during random dequeue: {e}")
                return []

        logger.debug(
            f"Randomly dequeued {len(result)} items (requested: {n})"
        )

        return result

    def bulk_dequeue(self, count: int) -> List[Track]:
        """指定された数の楽曲をキューから一括取得（ランダム）

        Args:
            count: 取得したい楽曲数

        Returns:
            List[Track]: 取得された楽曲リスト
        """
        return self.dequeue_random(count)

    def contains(self, track_id: Union[str, int]) -> bool:
        """指定されたIDの楽曲がキューに含まれているかチェック

        Args:
            track_id: チェックしたい楽曲ID

        Returns:
            bool: 楽曲がキューに含まれる場合True
        """
        track_id_str = str(track_id)

        with get_database_connection().get_session() as session:
            try:
                count = session.query(TrackDB).filter(
                    TrackDB.id == track_id_str).count()
                return count > 0
            except Exception as e:
                logger.error(f"Error during contains check: {e}")
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
        with get_database_connection().get_session() as session:
            try:
                return session.query(TrackDB).count()
            except Exception as e:
                logger.error(f"Error getting size: {e}")
                return 0

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
        with get_database_connection().get_session() as session:
            try:
                previous_size = session.query(TrackDB).count()
                session.query(TrackDB).delete()
                session.commit()
                return previous_size
            except Exception as e:
                session.rollback()
                logger.error(f"Error during clear: {e}")
                return 0

    def stats(self) -> Dict[str, Any]:
        """キューの統計情報を取得

        Returns:
            dict: 統計情報の辞書
        """
        current_size = self.size()

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
            preview_url="https://example.com/preview.mp3",
            album=None,
            duration_ms=None,
            genre=None
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
