"""
楽曲データモデル定義
iTunes APIやキューシステムで使用する最小限のTrackモデル
"""

from typing import Optional, Union
from pydantic import BaseModel, Field


class Track(BaseModel):
    """楽曲データの最小限モデル
    
    iTunesのtrackIdを流用し、MVPで必要な表示・再生情報を保持
    """
    
    id: Union[str, int] = Field(..., description="楽曲の一意識別子（iTunesのtrackId等）")
    title: str = Field(..., description="楽曲名")
    artist: str = Field(..., description="アーティスト名")
    artwork_url: Optional[str] = Field(None, description="アートワーク画像URL")
    preview_url: Optional[str] = Field(None, description="プレビュー音源URL")
    
    # オプション項目（将来的に追加可能）
    album: Optional[str] = Field(None, description="アルバム名")
    duration_ms: Optional[int] = Field(None, description="楽曲時間（ミリ秒）")
    genre: Optional[str] = Field(None, description="ジャンル")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": "12345",
                    "title": "Sample Song",
                    "artist": "Sample Artist",
                    "artwork_url": "https://example.com/artwork.jpg",
                    "preview_url": "https://example.com/preview.m4a",
                    "album": "Sample Album",
                    "duration_ms": 240000,
                    "genre": "Pop"
                }
            ]
        }
    }
    
    def to_dict(self) -> dict:
        """辞書形式に変換
        
        Returns:
            dict: Track情報の辞書
        """
        return self.model_dump()
    
    @classmethod
    def from_dict(cls, data: dict) -> "Track":
        """辞書からTrackインスタンスを作成
        
        Args:
            data: Track情報の辞書
            
        Returns:
            Track: Trackインスタンス
        """
        return cls(**data)
    
    def is_valid_for_playback(self) -> bool:
        """再生可能かチェック
        
        Returns:
            bool: preview_urlが存在すれば True
        """
        return bool(self.preview_url)
