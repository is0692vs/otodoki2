"""
iTunes API clientのテスト
"""

import pytest
from unittest.mock import AsyncMock, Mock, patch
import httpx

from app.services.itunes_api import iTunesApiClient
from app.models.track import Track


class TestiTunesApiClient:
    """iTunesApiClientクラスのテスト"""
    
    def test_initialization(self):
        """クライアント初期化のテスト"""
        client = iTunesApiClient()
        assert client.base_url == "https://itunes.apple.com/search"
        assert hasattr(client, 'config')
        assert hasattr(client, 'timeout')
    
    def test_pick_search_term(self):
        """検索キーワード選択のテスト"""
        client = iTunesApiClient()
        
        # クールダウンなしでの選択
        term = client.pick_search_term()
        assert term in ["rock", "pop", "jazz"]
        
        # 同じキーワードが選ばれた場合、クールダウンに追加されているか確認
        assert term in client._keyword_cooldown
    
    def test_optimize_artwork_url(self):
        """アートワークURL最適化のテスト"""
        client = iTunesApiClient()
        
        # 100x100を600x600に変換
        url_100 = "https://example.com/artwork100x100bb.jpg"
        optimized = client._optimize_artwork_url(url_100)
        assert "600x600" in optimized
        assert "100x100" not in optimized
        
        # 既に高解像度の場合はそのまま
        url_600 = "https://example.com/artwork600x600bb.jpg"
        assert client._optimize_artwork_url(url_600) == url_600
        
        # None の場合
        assert client._optimize_artwork_url(None) is None
    
    def test_clean_and_filter_tracks(self):
        """トラックデータ整形のテスト"""
        client = iTunesApiClient()
        
        # 有効なトラックデータ
        raw_tracks = [
            {
                "trackId": 12345,
                "trackName": "Test Song",
                "artistName": "Test Artist",
                "previewUrl": "https://example.com/preview.m4a",
                "artworkUrl100": "https://example.com/artwork100x100.jpg",
                "collectionName": "Test Album",
                "trackTimeMillis": 240000,
                "primaryGenreName": "Pop"
            },
            {
                # 必須フィールド欠損（previewUrlなし）
                "trackId": 12346,
                "trackName": "Invalid Song",
                "artistName": "Test Artist",
                "artworkUrl100": "https://example.com/artwork.jpg"
            }
        ]
        
        tracks = client.clean_and_filter_tracks(raw_tracks)
        
        # 有効なトラックのみが返される
        assert len(tracks) == 1
        assert tracks[0].id == "12345"
        assert tracks[0].title == "Test Song"
        assert tracks[0].artist == "Test Artist"
        assert "600x600" in tracks[0].artwork_url  # 高解像度化
    
    def test_clean_and_filter_tracks_duplicate_removal(self):
        """重複排除のテスト"""
        client = iTunesApiClient()
        
        # 同じIDのトラック
        raw_tracks = [
            {
                "trackId": 12345,
                "trackName": "Test Song 1",
                "artistName": "Test Artist",
                "previewUrl": "https://example.com/preview1.m4a",
                "artworkUrl100": "https://example.com/artwork1.jpg"
            },
            {
                "trackId": 12345,  # 同じID
                "trackName": "Test Song 2",
                "artistName": "Test Artist",
                "previewUrl": "https://example.com/preview2.m4a",
                "artworkUrl100": "https://example.com/artwork2.jpg"
            }
        ]
        
        tracks = client.clean_and_filter_tracks(raw_tracks)
        
        # 最初のトラックのみが返される
        assert len(tracks) == 1
        assert tracks[0].title == "Test Song 1"
        
        # 同じクライアントで再実行すると、既に記録済みなので0件
        tracks_second = client.clean_and_filter_tracks(raw_tracks)
        assert len(tracks_second) == 0
    
    @pytest.mark.asyncio
    async def test_search_tracks_success(self):
        """iTunes API検索成功のテスト"""
        client = iTunesApiClient()
        
        # モックレスポンス
        mock_response_data = {
            "results": [
                {
                    "trackId": 12345,
                    "trackName": "Test Song",
                    "artistName": "Test Artist"
                }
            ]
        }
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_response_data
            mock_response.raise_for_status.return_value = None
            
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)
            
            results = await client.search_tracks("test", limit=50)
            
            assert len(results) == 1
            assert results[0]["trackId"] == 12345
    
    @pytest.mark.asyncio
    async def test_search_tracks_4xx_error(self):
        """iTunes API 4xxエラーのテスト"""
        client = iTunesApiClient()
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = Mock()
            mock_response.status_code = 404
            
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)
            
            results = await client.search_tracks("test")
            
            # 4xxエラーの場合は空リストを返す
            assert results == []
    
    @pytest.mark.asyncio
    async def test_search_tracks_timeout_retry(self):
        """タイムアウト時のリトライテスト"""
        client = iTunesApiClient()
        
        with patch('httpx.AsyncClient') as mock_client:
            # 最初の2回はタイムアウト、3回目は成功
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                side_effect=[
                    httpx.TimeoutException("timeout"),
                    httpx.TimeoutException("timeout"),
                    Mock(
                        status_code=200,
                        json=lambda: {"results": [{"trackId": 123}]},
                        raise_for_status=lambda: None
                    )
                ]
            )
            
            with patch('asyncio.sleep') as mock_sleep:
                results = await client.search_tracks("test")
                
                # リトライが実行され、最終的に成功
                assert len(results) == 1
                assert results[0]["trackId"] == 123
                
                # sleep が呼ばれている（リトライの待機）
                assert mock_sleep.call_count == 2