#!/usr/bin/env python3
"""
キュー補充ワーカーのテストスクリプト
キューを空にして、ワーカーが自動的に補充するかをテスト
"""

import logging
from app.services.worker import QueueReplenishmentWorker
from app.core.queue import QueueManager
import asyncio
import sys
import os
import time

# プロジェクトルートをパスに追加（scriptsディレクトリから実行するため）
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))


# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


async def test_queue_worker():
    """キューワーカーのテスト"""
    print("=== Queue Worker Test ===")

    # 1. QueueManagerの初期化
    queue_manager = QueueManager()
    print(f"Queue initialized: {queue_manager.stats()}")

    # 2. Workerの初期化
    worker = QueueReplenishmentWorker(queue_manager)
    print(f"Worker initialized: {worker.stats}")

    # 3. ワーカーを開始
    await worker.start()
    print("Worker started")

    # 4. キューを空にする（現在のサイズを0にして閾値を下回らせる）
    current_size = queue_manager.size()
    print(f"Current queue size: {current_size}")

    if current_size > 0:
        # 既存のアイテムを全て削除
        items = queue_manager.dequeue(current_size)
        print(f"Removed {len(items)} items from queue")

    print(f"Queue after clearing: {queue_manager.stats()}")

    # 5. ワーカーが自動補充するのを待つ（30秒間）
    print("Waiting for worker to automatically refill queue...")

    for i in range(30):  # 30秒間監視
        await asyncio.sleep(1)
        stats = queue_manager.stats()
        worker_stats = worker.stats

        print(f"[{i+1:2d}s] Queue size: {stats['current_size']:3d}, Worker: {worker_stats['running']}, Failures: {worker_stats['consecutive_failures']}")

        # キューに何かが追加されたら成功
        if stats['current_size'] > 0:
            print(f"\n✅ SUCCESS: Worker automatically refilled queue!")
            print(f"Final queue stats: {stats}")
            break
    else:
        print(f"\n❌ TIMEOUT: Worker did not refill queue in 30 seconds")
        print(f"Final queue stats: {queue_manager.stats()}")
        print(f"Final worker stats: {worker.stats}")

    # 6. ワーカーを停止
    await worker.stop()
    print("Worker stopped")

    # 7. 最終状態の確認
    final_stats = queue_manager.stats()
    print(f"Final queue stats: {final_stats}")

if __name__ == "__main__":
    # 環境変数設定（テスト用に短い間隔に設定）
    os.environ["OTODOKI_POLL_INTERVAL_MS"] = "2000"  # 2秒間隔
    os.environ["OTODOKI_MIN_THRESHOLD"] = "5"        # 閾値を5に設定
    os.environ["OTODOKI_BATCH_SIZE"] = "10"          # バッチサイズを10に設定

    asyncio.run(test_queue_worker())
