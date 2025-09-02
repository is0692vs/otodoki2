"""
楽曲提供API用のデータモデル定義
GET /api/v1/tracks/suggestions エンドポイントのレスポンス構造
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from .track import Track


class SuggestionsMeta(BaseModel):
    """楽曲提供APIのメタデータ"""

    requested: int = Field(..., description="リクエストされた楽曲数")
    delivered: int = Field(..., description="実際に返却された楽曲数")
    queue_size_after: int = Field(..., description="返却後の推定キューサイズ")
    refill_triggered: bool = Field(..., description="このリクエストで補充トリガーを投げたか")
    ts: str = Field(..., description="サーバー時刻（ISO8601形式）")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "requested": 10,
                    "delivered": 10,
                    "queue_size_after": 245,
                    "refill_triggered": False,
                    "ts": "2025-08-31T12:34:56.789Z"
                }
            ]
        }
    }


class SuggestionsResponse(BaseModel):
    """楽曲提供APIのレスポンス"""

    data: List[Track] = Field(..., description="楽曲データの配列")
    meta: SuggestionsMeta = Field(..., description="メタデータ")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "data": [
                        {
                            "id": "12345",
                            "title": "Sample Song",
                            "artist": "Sample Artist",
                            "artwork_url": "https://example.com/artwork.jpg",
                            "preview_url": "https://example.com/preview.m4a",
                            "album": "Sample Album",
                            "genre": "Pop"
                        }
                    ],
                    "meta": {
                        "requested": 10,
                        "delivered": 1,
                        "queue_size_after": 245,
                        "refill_triggered": False,
                        "ts": "2025-08-31T12:34:56.789Z"
                    }
                }
            ]
        }
    }


class SuggestionsRequest(BaseModel):
    """楽曲提供APIのリクエストパラメータ"""

    limit: Optional[int] = Field(10, ge=1, le=50, description="返却する楽曲数（1-50）")
    exclude_ids: Optional[str] = Field(None, description="除外する楽曲IDのカンマ区切り文字列")

    def get_exclude_ids_list(self) -> List[str]:
        """除外IDリストを配列として取得

        Returns:
            List[str]: 除外する楽曲IDのリスト
        """
        if not self.exclude_ids:
            return []

        try:
            # カンマ区切りの文字列を分割し、空白を除去
            ids = [id_str.strip()
                   for id_str in self.exclude_ids.split(',') if id_str.strip()]
            return ids
        except Exception:
            return []

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "limit": 10,
                    "exclude_ids": "123,456,789"
                }
            ]
        }
    }


class ErrorResponse(BaseModel):
    """エラーレスポンス"""

    error: str = Field(..., description="エラーメッセージ")
    detail: Optional[str] = Field(None, description="詳細情報")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "error": "Invalid parameter",
                    "detail": "limit must be between 1 and 50"
                }
            ]
        }
    }
