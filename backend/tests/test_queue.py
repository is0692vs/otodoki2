"""
QueueManagerのユニットテスト
基本操作、容量制御、スレッドセーフ性を検証
"""

import threading
import time
from unittest.mock import patch

from app.core.queue import QueueManager, queue_self_check
from app.models.track import Track


class TestQueueManager:
    """QueueManagerのテストクラス"""
    
    def setup_method(self):
        """各テストメソッド前の準備"""
        self.queue_manager = QueueManager(max_capacity=100, low_watermark=10)
    
    def test_initialization(self):
        """初期化のテスト"""
        assert self.queue_manager.size() == 0
        assert self.queue_manager.capacity() == 100
        
        stats = self.queue_manager.stats()
        assert stats["current_size"] == 0
        assert stats["max_capacity"] == 100
        assert stats["low_watermark"] == 10
        assert stats["enqueue_count"] == 0
        assert stats["dequeue_count"] == 0
        assert stats["dropped_count"] == 0
    
    def test_basic_enqueue_dequeue(self):
        """基本的なenqueue/dequeueのテスト"""
        # テストデータの作成
        tracks = [
            Track(id="001", title="Song 1", artist="Artist 1"),
            Track(id="002", title="Song 2", artist="Artist 2"),
            Track(id="003", title="Song 3", artist="Artist 3"),
        ]
        
        # enqueue テスト
        added_count = self.queue_manager.enqueue(tracks)
        assert added_count == 3
        assert self.queue_manager.size() == 3
        
        # dequeue テスト
        dequeued = self.queue_manager.dequeue(2)
        assert len(dequeued) == 2
        assert dequeued[0].id == "001"  # FIFO順序確認
        assert dequeued[1].id == "002"
        assert self.queue_manager.size() == 1
        
        # 残りをdequeue
        remaining = self.queue_manager.dequeue(5)  # 多めに要求
        assert len(remaining) == 1
        assert remaining[0].id == "003"
        assert self.queue_manager.size() == 0
    
    def test_empty_dequeue(self):
        """空キューからのdequeueテスト"""
        result = self.queue_manager.dequeue(5)
        assert result == []
        assert self.queue_manager.size() == 0
    
    def test_invalid_enqueue_data(self):
        """無効なデータのenqueueテスト"""
        # None, 無効型、必須フィールド欠損を含むリスト
        invalid_data = [
            None,
            "invalid_string",
            Track(id="", title="", artist=""),  # 空文字
            Track(id="valid", title="Valid Song", artist="Valid Artist"),
        ]
        
        added_count = self.queue_manager.enqueue(invalid_data)
        assert added_count == 1  # 有効なTrackのみ追加
        assert self.queue_manager.size() == 1
        
        # 有効なTrackが正しく格納されているか確認
        result = self.queue_manager.dequeue(1)
        assert len(result) == 1
        assert result[0].id == "valid"
    
    def test_capacity_limit_and_dropping(self):
        """容量制限とドロップ処理のテスト"""
        # 小さい容量でテスト
        small_queue = QueueManager(max_capacity=3, low_watermark=1)
        
        # 容量いっぱいまで追加
        initial_tracks = [
            Track(id=f"00{i}", title=f"Song {i}", artist=f"Artist {i}")
            for i in range(1, 4)  # 3つ
        ]
        added = small_queue.enqueue(initial_tracks)
        assert added == 3
        assert small_queue.size() == 3
        
        # 容量超過する追加（古いデータがドロップされる）
        new_tracks = [
            Track(id="004", title="Song 4", artist="Artist 4"),
            Track(id="005", title="Song 5", artist="Artist 5"),
        ]
        added = small_queue.enqueue(new_tracks)
        assert added == 2
        assert small_queue.size() == 3  # 容量は維持
        
        # ドロップ統計の確認
        stats = small_queue.stats()
        assert stats["dropped_count"] == 2
        
        # 最新のデータが残っているか確認
        result = small_queue.dequeue(3)
        assert len(result) == 3
        assert result[0].id == "003"  # 最も古い残存データ
        assert result[1].id == "004"
        assert result[2].id == "005"
    
    def test_clear_operation(self):
        """clearオペレーションのテスト"""
        # データを追加
        tracks = [
            Track(id=f"00{i}", title=f"Song {i}", artist=f"Artist {i}")
            for i in range(1, 6)
        ]
        self.queue_manager.enqueue(tracks)
        assert self.queue_manager.size() == 5
        
        # クリア実行
        cleared_count = self.queue_manager.clear()
        assert cleared_count == 5
        assert self.queue_manager.size() == 0
    
    def test_thread_safety(self):
        """スレッドセーフ性のテスト"""
        num_threads = 5
        tracks_per_thread = 20
        
        def enqueue_worker(thread_id):
            tracks = [
                Track(
                    id=f"{thread_id:02d}{i:03d}",
                    title=f"Song {thread_id}-{i}",
                    artist=f"Artist {thread_id}"
                )
                for i in range(tracks_per_thread)
            ]
            self.queue_manager.enqueue(tracks)
        
        def dequeue_worker():
            time.sleep(0.1)  # enqueueが少し進むまで待機
            while self.queue_manager.size() > 0:
                self.queue_manager.dequeue(3)
                time.sleep(0.01)
        
        # スレッド作成と実行
        enqueue_threads = [
            threading.Thread(target=enqueue_worker, args=(i,))
            for i in range(num_threads)
        ]
        dequeue_threads = [
            threading.Thread(target=dequeue_worker)
            for _ in range(2)
        ]
        
        # 全スレッド開始
        all_threads = enqueue_threads + dequeue_threads
        for thread in all_threads:
            thread.start()
        
        # 全スレッド終了待機
        for thread in all_threads:
            thread.join()
        
        # データ破壊が起きていないことを確認
        stats = self.queue_manager.stats()
        total_enqueued = stats["enqueue_count"]
        total_dequeued = stats["dequeue_count"]
        current_size = stats["current_size"]
        
        assert total_enqueued == num_threads * tracks_per_thread
        assert total_enqueued == total_dequeued + current_size
    
    @patch('app.core.queue.logger')
    def test_low_watermark_warning(self, mock_logger):
        """低水位マーク警告のテスト"""
        # 低水位を下回る状態にする
        track = Track(id="001", title="Test", artist="Test")
        self.queue_manager.enqueue([track])
        
        # 低水位以下までdequeue
        self.queue_manager.dequeue(1)
        assert self.queue_manager.size() == 0
        
        # さらにdequeueして警告をトリガー
        self.queue_manager.dequeue(1)
        
        # 警告ログが出力されたことを確認
        mock_logger.warning.assert_called()
        warning_call = mock_logger.warning.call_args[0][0]
        assert "below low watermark" in warning_call
    
    def test_default_parameters(self):
        """デフォルトパラメータでの動作テスト"""
        default_queue = QueueManager()
        
        # デフォルト値が設定から取得されることを確認
        assert default_queue.capacity() > 0
        assert default_queue.size() == 0
    
    def test_stats_calculation(self):
        """統計情報の計算テスト"""
        # 一部データを追加
        tracks = [
            Track(id=f"00{i}", title=f"Song {i}", artist=f"Artist {i}")
            for i in range(1, 31)  # 30個
        ]
        self.queue_manager.enqueue(tracks)
        
        stats = self.queue_manager.stats()
        assert stats["current_size"] == 30
        assert stats["utilization"] == 30.0  # 30/100 * 100
        assert stats["enqueue_count"] == 30
        assert stats["dequeue_count"] == 0
        assert not stats["is_low"]  # 30 > 10 (low_watermark)
        
        # 一部dequeue
        self.queue_manager.dequeue(25)
        
        stats = self.queue_manager.stats()
        assert stats["current_size"] == 5
        assert stats["utilization"] == 5.0
        assert stats["dequeue_count"] == 25
        assert stats["is_low"]  # 5 <= 10 (low_watermark)


class TestQueueSelfCheck:
    """queue_self_check関数のテスト"""
    
    def test_self_check_success(self):
        """セルフチェック成功のテスト"""
        queue_manager = QueueManager(max_capacity=100, low_watermark=10)
        
        with patch('app.core.queue.logger') as mock_logger:
            result = queue_self_check(queue_manager)
            
            assert result is True
            mock_logger.info.assert_called()
            
            # ログメッセージを確認
            log_calls = [call[0][0] for call in mock_logger.info.call_args_list]
            assert any("Starting queue self-check" in msg for msg in log_calls)
            assert any("completed successfully" in msg for msg in log_calls)
    
    def test_self_check_with_existing_data(self):
        """既存データがある状態でのセルフチェック"""
        queue_manager = QueueManager(max_capacity=100, low_watermark=10)
        
        # 既存データを追加
        existing_track = Track(id="existing", title="Existing", artist="Existing")
        queue_manager.enqueue([existing_track])
        
        result = queue_self_check(queue_manager)
        assert result is True
        
        # セルフチェック後のサイズが元と同じことを確認
        assert queue_manager.size() == 1
        # 残っているデータは、セルフチェックでテスト用Trackが追加され、
        # 既存Trackがdequeueされた結果、テスト用Trackになる
        dequeued = queue_manager.dequeue(1)
        assert dequeued[0].id == "test_001"
