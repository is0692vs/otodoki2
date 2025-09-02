"""
Trackモデルのテスト
Trackクラスの基本機能とバリデーションを検証
"""

import pytest
from pydantic import ValidationError

from app.models.track import Track


class TestTrack:
    """Trackモデルのテストクラス"""
    
    def test_track_creation_with_required_fields(self):
        """必須フィールドのみでのTrack作成テスト"""
        track = Track(
            id="12345",
            title="Test Song",
            artist="Test Artist"
        )
        
        assert track.id == "12345"
        assert track.title == "Test Song"
        assert track.artist == "Test Artist"
        assert track.artwork_url is None
        assert track.preview_url is None
        assert track.album is None
        assert track.duration_ms is None
        assert track.genre is None
    
    def test_track_creation_with_all_fields(self):
        """全フィールドありでのTrack作成テスト"""
        track = Track(
            id=98765,  # 数値ID
            title="Complete Song",
            artist="Complete Artist",
            artwork_url="https://example.com/artwork.jpg",
            preview_url="https://example.com/preview.m4a",
            album="Complete Album",
            duration_ms=240000,
            genre="Pop"
        )
        
        assert track.id == 98765
        assert track.title == "Complete Song"
        assert track.artist == "Complete Artist"
        assert track.artwork_url == "https://example.com/artwork.jpg"
        assert track.preview_url == "https://example.com/preview.m4a"
        assert track.album == "Complete Album"
        assert track.duration_ms == 240000
        assert track.genre == "Pop"
    
    def test_track_missing_required_fields(self):
        """必須フィールド欠損時のバリデーションエラーテスト"""
        # id欠損
        with pytest.raises(ValidationError):
            Track(title="Test", artist="Test")
        
        # title欠損
        with pytest.raises(ValidationError):
            Track(id="123", artist="Test")
        
        # artist欠損
        with pytest.raises(ValidationError):
            Track(id="123", title="Test")
    
    def test_track_to_dict(self):
        """to_dict()メソッドのテスト"""
        track = Track(
            id="12345",
            title="Test Song",
            artist="Test Artist",
            artwork_url="https://example.com/art.jpg"
        )
        
        result = track.to_dict()
        
        expected = {
            "id": "12345",
            "title": "Test Song",
            "artist": "Test Artist",
            "artwork_url": "https://example.com/art.jpg",
            "preview_url": None,
            "album": None,
            "duration_ms": None,
            "genre": None,
        }
        
        assert result == expected
    
    def test_track_from_dict(self):
        """from_dict()クラスメソッドのテスト"""
        data = {
            "id": "54321",
            "title": "Dict Song",
            "artist": "Dict Artist",
            "preview_url": "https://example.com/preview.mp3",
        }
        
        track = Track.from_dict(data)
        
        assert track.id == "54321"
        assert track.title == "Dict Song"
        assert track.artist == "Dict Artist"
        assert track.preview_url == "https://example.com/preview.mp3"
        assert track.artwork_url is None
    
    def test_is_valid_for_playback(self):
        """is_valid_for_playback()メソッドのテスト"""
        # preview_url有り
        track_with_preview = Track(
            id="123",
            title="Playable",
            artist="Artist",
            preview_url="https://example.com/preview.mp3"
        )
        assert track_with_preview.is_valid_for_playback() is True
        
        # preview_url無し
        track_without_preview = Track(
            id="456",
            title="Not Playable",
            artist="Artist"
        )
        assert track_without_preview.is_valid_for_playback() is False
        
        # preview_url空文字
        track_empty_preview = Track(
            id="789",
            title="Empty Preview",
            artist="Artist",
            preview_url=""
        )
        assert track_empty_preview.is_valid_for_playback() is False
    
    def test_track_id_types(self):
        """ID型の多様性テスト（文字列・数値両対応）"""
        # 文字列ID
        track_str = Track(id="str123", title="String ID", artist="Artist")
        assert track_str.id == "str123"
        
        # 数値ID
        track_num = Track(id=456789, title="Numeric ID", artist="Artist")
        assert track_num.id == 456789
        
        # ゼロID
        track_zero = Track(id=0, title="Zero ID", artist="Artist")
        assert track_zero.id == 0
    
    def test_track_serialization_round_trip(self):
        """シリアライゼーション往復テスト"""
        original = Track(
            id="round_trip",
            title="Round Trip Song",
            artist="Round Trip Artist",
            artwork_url="https://example.com/art.jpg",
            preview_url="https://example.com/preview.mp3",
            album="Round Trip Album",
            duration_ms=180000,
            genre="Electronic"
        )
        
        # to_dict -> from_dict の往復
        data = original.to_dict()
        reconstructed = Track.from_dict(data)
        
        # 全フィールドが一致することを確認
        assert reconstructed.id == original.id
        assert reconstructed.title == original.title
        assert reconstructed.artist == original.artist
        assert reconstructed.artwork_url == original.artwork_url
        assert reconstructed.preview_url == original.preview_url
        assert reconstructed.album == original.album
        assert reconstructed.duration_ms == original.duration_ms
        assert reconstructed.genre == original.genre
    
    def test_track_empty_string_values(self):
        """空文字値のハンドリングテスト"""
        # 必須フィールドに空文字は通る（バリデーションエラーにならない）
        track = Track(id="", title="", artist="")
        assert track.id == ""
        assert track.title == ""
        assert track.artist == ""
        
        # オプションフィールドに空文字
        track_with_empty_optional = Track(
            id="123",
            title="Title",
            artist="Artist",
            artwork_url="",
            preview_url="",
            album="",
            genre=""
        )
        assert track_with_empty_optional.artwork_url == ""
        assert track_with_empty_optional.is_valid_for_playback() is False
