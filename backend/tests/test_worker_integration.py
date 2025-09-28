"""ワーカー統合テスト.

モックデータを使用してワーカーの動作を検証
"""

from unittest.mock import AsyncMock, patch

import pytest

from app.core.queue import QueueManager
from app.services.worker import QueueReplenishmentWorker


@pytest.fixture(autouse=True)
def _set_gemini_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    """Gemini戦略がロードされるためダミーのAPIキーを設定する。"""
    monkeypatch.setenv("GEMINI_API_KEY", "dummy-key")


class TestWorkerIntegration:
    """ワーカー統合テストクラス"""

    @pytest.mark.asyncio
    async def test_worker_refill_with_mock_data(self):
        """モックデータを使用したワーカー補充テスト"""
        # 小さなキューを作成（テスト用）
        queue_manager = QueueManager(max_capacity=100, low_watermark=10)
        worker = QueueReplenishmentWorker(queue_manager)

        # iTunes APIクライアントをモック
        mock_itunes_data = [
            {
                "trackId": 1001,
                "trackName": "Mock Song 1",
                "artistName": "Mock Artist 1",
                "previewUrl": "https://example.com/preview1.m4a",
                "artworkUrl100": "https://example.com/artwork1_100x100.jpg",
                "collectionName": "Mock Album 1",
                "trackTimeMillis": 240000,
                "primaryGenreName": "Pop"
            },
            {
                "trackId": 1002,
                "trackName": "Mock Song 2",
                "artistName": "Mock Artist 2",
                "previewUrl": "https://example.com/preview2.m4a",
                "artworkUrl100": "https://example.com/artwork2_100x100.jpg",
                "collectionName": "Mock Album 2",
                "trackTimeMillis": 210000,
                "primaryGenreName": "Rock"
            }
        ]

        # iTunes API searchをモック
        with patch.object(
            worker.itunes_client, "search_tracks", new_callable=AsyncMock
        ) as mock_search:
            mock_search.return_value = mock_itunes_data

            # 初期状態確認
            assert queue_manager.size() == 0

            # 補充実行
            success = await worker.trigger_refill()

            # 結果確認
            assert success is True
            assert queue_manager.size() == 2  # 2曲追加された

            # 追加されたトラックの内容確認
            tracks = queue_manager.dequeue(2)
            assert len(tracks) == 2
            assert tracks[0].id == "1001"
            assert tracks[0].title == "Mock Song 1"
            assert tracks[0].artist == "Mock Artist 1"
            assert tracks[0].artwork_url is not None
            assert "600x600" in tracks[0].artwork_url  # 高解像度化確認

            assert tracks[1].id == "1002"
            assert tracks[1].title == "Mock Song 2"

    @pytest.mark.asyncio
    async def test_worker_duplicate_handling(self):
        """重複トラック処理のテスト"""
        queue_manager = QueueManager(max_capacity=100, low_watermark=10)
        worker = QueueReplenishmentWorker(queue_manager)

        # 同じIDのトラックを含むモックデータ
        mock_itunes_data = [
            {
                "trackId": 1001,
                "trackName": "Mock Song 1",
                "artistName": "Mock Artist 1",
                "previewUrl": "https://example.com/preview1.m4a",
                "artworkUrl100": "https://example.com/artwork1.jpg"
            },
            {
                "trackId": 1001,  # 重複ID
                "trackName": "Mock Song 1 Duplicate",
                "artistName": "Mock Artist 1",
                "previewUrl": "https://example.com/preview1_dup.m4a",
                "artworkUrl100": "https://example.com/artwork1_dup.jpg"
            }
        ]

        with patch.object(
            worker.itunes_client, "search_tracks", new_callable=AsyncMock
        ) as mock_search:
            mock_search.return_value = mock_itunes_data

            # 1回目の補充
            success = await worker.trigger_refill()
            assert success is True
            assert queue_manager.size() == 1  # 重複除去により1曲のみ

            # 同じデータで2回目の補充（全て重複のはず）
            success2 = await worker.trigger_refill()
            assert success2 is False  # 新しいトラックが追加されないため失敗
            assert queue_manager.size() == 1  # サイズ変わらず

    @pytest.mark.asyncio
    async def test_worker_error_handling(self):
        """エラーハンドリングのテスト"""
        queue_manager = QueueManager(max_capacity=100, low_watermark=10)
        worker = QueueReplenishmentWorker(queue_manager)

        # iTunes API呼び出しで例外発生をモック
        with patch.object(
            worker.itunes_client, "search_tracks", new_callable=AsyncMock
        ) as mock_search:
            mock_search.side_effect = Exception("Network error")

            # 補充実行
            success = await worker.trigger_refill()

            # エラーにより失敗するが、例外は発生しない
            assert success is False
            assert queue_manager.size() == 0  # トラック追加されず

    def test_worker_stats(self):
        """ワーカー統計情報のテスト"""
        queue_manager = QueueManager()
        worker = QueueReplenishmentWorker(queue_manager)

        stats = worker.stats

        # 必要なキーが含まれているかチェック
        expected_keys = {
            "running",
            "consecutive_failures",
            "max_failures",
            "refill_in_progress",
            "poll_interval_ms",
            "min_threshold",
            "batch_size",
            "max_cap",
            "current_search_strategy",
            "keyword_queue_size",
            "keyword_refill_threshold",
            "strategy_failure_info",
        }
        assert set(stats.keys()) == expected_keys

        # 初期値確認
        assert stats["running"] is False
        assert stats["consecutive_failures"] == 0
        assert stats["refill_in_progress"] is False
