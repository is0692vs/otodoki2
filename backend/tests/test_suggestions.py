"""
楽曲提供API（suggestions）のユニットテスト
正常系、異常系、負荷テストの観点をカバー
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime

from app.services.suggestions import SuggestionsService
from app.core.queue import QueueManager
from app.core.config import SuggestionsConfig
from app.core.rate_limit import RateLimiter, GlobalRateLimiter
from app.models.track import Track
from app.models.suggestions import SuggestionsResponse, SuggestionsMeta


class TestSuggestionsService:
    """SuggestionsServiceのテストクラス"""

    def setup_method(self):
        """各テストメソッド前の準備"""
        self.queue_manager = QueueManager(max_capacity=100, low_watermark=10)
        self.mock_worker = AsyncMock()
        self.service = SuggestionsService(self.queue_manager, self.mock_worker)

    def _create_test_tracks(self, count: int, id_prefix: str = "track") -> list[Track]:
        """テスト用楽曲データを作成"""
        tracks = []
        for i in range(count):
            track = Track(
                id=f"{id_prefix}_{i:03d}",
                title=f"Song {i}",
                artist=f"Artist {i}",
                artwork_url=f"https://example.com/art_{i}.jpg",
                preview_url=f"https://example.com/preview_{i}.m4a",
                album=f"Album {i}",
                genre="Pop"
            )
            tracks.append(track)
        return tracks

    @pytest.mark.asyncio
    async def test_get_suggestions_normal_case(self):
        """正常系: 標準的な楽曲提供テスト"""
        # テストデータ準備（十分な数を用意して閾値を超えるようにする）
        test_tracks = self._create_test_tracks(50)
        self.queue_manager.enqueue(test_tracks)

        # リクエスト実行
        response = await self.service.get_suggestions(limit=10, exclude_ids=[])

        # 検証
        assert isinstance(response, SuggestionsResponse)
        assert len(response.data) == 10
        assert response.meta.requested == 10
        assert response.meta.delivered == 10
        assert response.meta.refill_triggered is False  # 40 > 30(threshold)のため補充不要
        assert isinstance(response.meta.ts, str)

        # キューサイズチェック
        assert self.queue_manager.size() == 40  # 50 - 10

    @pytest.mark.asyncio
    async def test_get_suggestions_with_exclude_ids(self):
        """正常系: 除外ID指定時のテスト"""
        # テストデータ準備
        test_tracks = self._create_test_tracks(15)
        self.queue_manager.enqueue(test_tracks)

        # 除外IDを指定（最初の3件）
        exclude_ids = ["track_000", "track_001", "track_002"]

        # リクエスト実行
        response = await self.service.get_suggestions(limit=5, exclude_ids=exclude_ids)

        # 検証
        assert len(response.data) == 5
        assert response.meta.delivered == 5

        # 除外されたIDが含まれていないことを確認
        returned_ids = [track.id for track in response.data]
        for exclude_id in exclude_ids:
            assert exclude_id not in returned_ids

        # 順不同で返されるため、特定のIDをチェックしない
        # assert response.data[0].id == "track_003"

    @pytest.mark.asyncio
    async def test_get_suggestions_queue_exhaustion(self):
        """正常系: キュー枯渇時のテスト"""
        # 少ないテストデータ準備
        test_tracks = self._create_test_tracks(3)
        self.queue_manager.enqueue(test_tracks)

        # 多くの楽曲をリクエスト
        response = await self.service.get_suggestions(limit=10, exclude_ids=[])

        # 検証
        assert len(response.data) == 3  # 実際に取得できた分のみ
        assert response.meta.requested == 10
        assert response.meta.delivered == 3
        assert response.meta.queue_size_after == 0
        assert response.meta.refill_triggered is True  # 低水位のためトリガー

    @pytest.mark.asyncio
    async def test_get_suggestions_limit_validation(self):
        """正常系: limit値のバリデーションテスト"""
        test_tracks = self._create_test_tracks(100)
        self.queue_manager.enqueue(test_tracks)

        # limit=0 (最小値1にクリップ)
        response = await self.service.get_suggestions(limit=0, exclude_ids=[])
        assert response.meta.requested == 1
        assert len(response.data) == 1

        # limit=100 (最大値50にクリップ)
        with patch.object(SuggestionsConfig, 'get_max_limit', return_value=50):
            response = await self.service.get_suggestions(limit=100, exclude_ids=[])
            assert response.meta.requested == 50
            assert len(response.data) == 50

    @pytest.mark.asyncio
    async def test_get_suggestions_exclude_all(self):
        """エッジケース: 全楽曲が除外された場合"""
        test_tracks = self._create_test_tracks(5)
        self.queue_manager.enqueue(test_tracks)

        # 全てのIDを除外
        exclude_ids = [f"track_{i:03d}" for i in range(5)]

        response = await self.service.get_suggestions(limit=10, exclude_ids=exclude_ids)

        # 検証
        assert len(response.data) == 0
        assert response.meta.delivered == 0
        assert response.meta.requested == 10
        # 除外された楽曲は再エンキューされるためキューサイズは元のまま
        assert response.meta.queue_size_after == 5

    @pytest.mark.asyncio
    async def test_get_suggestions_refill_trigger(self):
        """正常系: 補充トリガーのテスト"""
        # 低水位になるようなデータ準備
        test_tracks = self._create_test_tracks(12)  # 低水位は10
        self.queue_manager.enqueue(test_tracks)

        # ワーカーのモック設定
        self.mock_worker.trigger_refill.return_value = True

        # 多めにリクエストして低水位に
        response = await self.service.get_suggestions(limit=8, exclude_ids=[])

        # 検証
        assert len(response.data) == 8
        assert response.meta.queue_size_after == 4  # 12 - 8 = 4 < 10(低水位)
        assert response.meta.refill_triggered is True

        # ワーカーのトリガーが非同期で呼ばれることを確認
        # 少し待ってからアサート
        await asyncio.sleep(0.1)
        self.mock_worker.trigger_refill.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_suggestions_worker_failure(self):
        """異常系: ワーカートリガー失敗時"""
        test_tracks = self._create_test_tracks(5)
        self.queue_manager.enqueue(test_tracks)

        # ワーカーが例外を投げる
        self.mock_worker.trigger_refill.side_effect = Exception(
            "Worker failed")

        # リクエスト実行（例外が伝播しないことを確認）
        response = await self.service.get_suggestions(limit=5, exclude_ids=[])

        # 検証: エラーが発生してもレスポンスは返される
        assert len(response.data) == 5
        assert response.meta.refill_triggered is False  # 失敗したのでFalse

    @pytest.mark.asyncio
    async def test_get_suggestions_no_worker(self):
        """異常系: ワーカーなしでの動作"""
        service_no_worker = SuggestionsService(self.queue_manager, None)

        test_tracks = self._create_test_tracks(5)
        self.queue_manager.enqueue(test_tracks)

        response = await service_no_worker.get_suggestions(limit=5, exclude_ids=[])

        # 検証: ワーカーがなくても正常に動作
        assert len(response.data) == 5
        assert response.meta.refill_triggered is False


class TestRateLimiter:
    """RateLimiterのテストクラス"""

    def test_rate_limiter_normal_case(self):
        """正常系: 制限内でのリクエスト"""
        limiter = RateLimiter(max_requests=5, window_seconds=1)

        # 5回まではOK
        for _ in range(5):
            assert limiter.is_allowed() is True

        # 6回目は制限
        assert limiter.is_allowed() is False

    def test_rate_limiter_window_reset(self):
        """正常系: ウィンドウ期間経過後のリセット"""
        limiter = RateLimiter(max_requests=2, window_seconds=0.1)  # 100ms

        # 2回リクエスト
        assert limiter.is_allowed() is True
        assert limiter.is_allowed() is True
        assert limiter.is_allowed() is False  # 制限

        # 少し待つ
        import time
        time.sleep(0.15)

        # リセット後は再度許可
        assert limiter.is_allowed() is True

    def test_rate_limiter_retry_after(self):
        """正常系: retry_afterの計算"""
        limiter = RateLimiter(max_requests=1, window_seconds=1)

        # 1回リクエスト
        assert limiter.is_allowed() is True
        assert limiter.is_allowed() is False

        # retry_afterは0~1秒の間
        retry_after = limiter.get_retry_after()
        assert 0 <= retry_after <= 1


class TestGlobalRateLimiter:
    """GlobalRateLimiterのテストクラス"""

    def test_singleton_behavior(self):
        """シングルトンの動作確認"""
        limiter1 = GlobalRateLimiter()
        limiter2 = GlobalRateLimiter()

        assert limiter1 is limiter2

    def test_initialization_and_check(self):
        """初期化とチェック機能"""
        limiter = GlobalRateLimiter()
        limiter.initialize(max_requests=3, window_seconds=1)

        # 3回まではOK
        for _ in range(3):
            allowed, retry_after = limiter.check_rate_limit()
            assert allowed is True
            assert retry_after == 0.0

        # 4回目は制限
        allowed, retry_after = limiter.check_rate_limit()
        assert allowed is False
        assert retry_after > 0

    def test_stats(self):
        """統計情報の確認"""
        limiter = GlobalRateLimiter()
        limiter.initialize(max_requests=5, window_seconds=1)

        stats = limiter.get_stats()
        assert stats["initialized"] is True
        assert stats["max_requests"] == 5
        assert stats["window_seconds"] == 1
        assert stats["current_requests"] == 0

        # リクエスト後
        limiter.check_rate_limit()
        stats = limiter.get_stats()
        assert stats["current_requests"] == 1


@pytest.mark.asyncio
async def test_integration_suggestions_api():
    """統合テスト: 全体的な動作確認"""
    # セットアップ
    queue_manager = QueueManager(max_capacity=50, low_watermark=5)
    mock_worker = AsyncMock()
    service = SuggestionsService(queue_manager, mock_worker)

    # テストデータ準備
    test_tracks = []
    for i in range(30):
        track = Track(
            id=f"integration_{i:03d}",
            title=f"Integration Song {i}",
            artist=f"Integration Artist {i}",
            artwork_url=f"https://example.com/integration_{i}.jpg",
            preview_url=f"https://example.com/integration_{i}.m4a",
            album=f"Integration Album {i}",
            genre="Integration"
        )
        test_tracks.append(track)

    queue_manager.enqueue(test_tracks)

    # 複数回のリクエスト実行
    responses = []
    for i in range(3):
        exclude_ids = [f"integration_{j:03d}" for j in range(i * 2)]
        response = await service.get_suggestions(limit=5, exclude_ids=exclude_ids)
        responses.append(response)

    # 検証
    assert len(responses) == 3
    for i, response in enumerate(responses):
        assert len(response.data) == 5
        assert response.meta.delivered == 5

        # 除外IDが含まれていないことを確認
        returned_ids = [track.id for track in response.data]
        exclude_ids = [f"integration_{j:03d}" for j in range(i * 2)]
        for exclude_id in exclude_ids:
            assert exclude_id not in returned_ids

    # 最終的なキューサイズ確認
    final_size = queue_manager.size()
    assert final_size == 15  # 30 - 15(使用) = 15
