"""
データベースモデル定義
SQLAlchemyを使用したデータベーステーブル定義
"""

from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class TrackDB(Base):
    """SQLAlchemy Trackモデル

    データベースに保存される楽曲データ
    """

    __tablename__ = "tracks"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    artist = Column(String, nullable=False)
    artwork_url = Column(Text, nullable=True)
    preview_url = Column(Text, nullable=True)
    album = Column(String, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    genre = Column(String, nullable=True)

    # Like/Dislike状態
    liked = Column(Boolean, default=False, nullable=False)
    disliked = Column(Boolean, default=False, nullable=False)

    # タイムスタンプ
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow, nullable=False)

    def to_pydantic(self):
        """Pydanticモデルに変換"""
        from ..models.track import Track
        return Track(
            id=self.id,
            title=self.title,
            artist=self.artist,
            artwork_url=self.artwork_url,
            preview_url=self.preview_url,
            album=self.album,
            duration_ms=self.duration_ms,
            genre=self.genre,
            liked=self.liked,
            disliked=self.disliked,
        )

    @classmethod
    def from_pydantic(cls, track):
        """Pydanticモデルから変換"""
        return cls(
            id=track.id,
            title=track.title,
            artist=track.artist,
            artwork_url=track.artwork_url,
            preview_url=track.preview_url,
            album=track.album,
            duration_ms=track.duration_ms,
            genre=track.genre,
            liked=getattr(track, 'liked', False),
            disliked=getattr(track, 'disliked', False),
        )

    def __repr__(self):
        return f"<TrackDB(id='{self.id}', title='{self.title}', artist='{self.artist}', liked={self.liked}, disliked={self.disliked})>"
