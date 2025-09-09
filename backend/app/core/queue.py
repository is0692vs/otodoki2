"""
楽曲データキュー管理モジュール
データベースベースのFIFOキューでTrackオブジェクトを管理する

注意: このファイルは後方互換性のため残されています。
新しい実装は db.queue を使用してください。
"""

import logging
from typing import List, Optional, Dict, Any, Union

from ..db.queue import QueueManager as DBQueueManager

logger = logging.getLogger(__name__)


class QueueManager(DBQueueManager):
    """楽曲データのキューマネージャー

    db.queue.QueueManagerのラッパークラス
    後方互換性を維持するためのエイリアス
    """

    def __init__(self, max_capacity: Optional[int] = None, low_watermark: Optional[int] = None):
        """QueueManagerを初期化"""
        super().__init__(max_capacity, low_watermark)
        logger.info("Using DB-backed QueueManager from db.queue")


# 後方互換性のための関数
def queue_self_check(queue_manager: QueueManager) -> bool:
    """キューマネージャーのセルフチェック（後方互換性用）"""
    from ..db.queue import queue_self_check as db_queue_self_check
    return db_queue_self_check(queue_manager)
