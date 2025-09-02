"""
依存性注入の設定
アプリケーション全体で共有するシングルトンインスタンスを管理
"""

import logging
from functools import lru_cache
from typing import Optional

from .core.queue import QueueManager, queue_self_check
from .services.worker import QueueReplenishmentWorker

logger = logging.getLogger(__name__)

# グローバルインスタンス
_queue_manager: Optional[QueueManager] = None
_worker: Optional[QueueReplenishmentWorker] = None


@lru_cache()
def get_queue_manager() -> QueueManager:
    """QueueManagerのシングルトンインスタンスを取得
    
    Returns:
        QueueManager: キューマネージャーのインスタンス
    """
    global _queue_manager
    if _queue_manager is None:
        _queue_manager = QueueManager()
        logger.info("QueueManager singleton instance created")
        
        # セルフチェック実行
        if queue_self_check(_queue_manager):
            logger.info("QueueManager self-check passed")
        else:
            logger.error("QueueManager self-check failed")
    
    return _queue_manager


def get_worker() -> Optional[QueueReplenishmentWorker]:
    """ワーカーインスタンスを取得
    
    Returns:
        Optional[QueueReplenishmentWorker]: ワーカーインスタンス
    """
    return _worker


def initialize_dependencies() -> None:
    """依存関係の初期化
    
    アプリケーション起動時に呼び出して必要なインスタンスを作成
    """
    global _worker
    
    logger.info("Initializing application dependencies")
    
    # QueueManagerの初期化
    queue_manager = get_queue_manager()
    stats = queue_manager.stats()
    logger.info(f"QueueManager initialized with stats: {stats}")
    
    # ワーカーの初期化と開始
    _worker = QueueReplenishmentWorker(queue_manager)
    logger.info("QueueReplenishmentWorker created")


async def start_background_tasks() -> None:
    """バックグラウンドタスクを開始"""
    global _worker
    if _worker:
        await _worker.start()
        logger.info("Background worker started")


def cleanup_dependencies() -> None:
    """依存関係のクリーンアップ
    
    アプリケーション終了時にリソースをクリーンアップ
    """
    global _queue_manager, _worker
    
    if _queue_manager is not None:
        stats = _queue_manager.stats()
        logger.info(f"Cleaning up QueueManager - final stats: {stats}")
        _queue_manager = None
    
    if _worker is not None:
        logger.info("Cleaning up worker reference")
        _worker = None


async def stop_background_tasks() -> None:
    """バックグラウンドタスクを停止"""
    global _worker
    if _worker:
        await _worker.stop()
        logger.info("Background worker stopped")
