"""SQLModel table declarations for core entities."""
from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, get_type_hints

from sqlalchemy import Column, DateTime, UniqueConstraint, func
from sqlalchemy.orm import Mapped, relationship
from sqlmodel import Field, Relationship, SQLModel


class EvaluationStatus(str, Enum):
    LIKE = "like"
    DISLIKE = "dislike"
    SKIP = "skip"


class User(SQLModel, table=True):
    __tablename__ = "users"  # type: ignore[assignment]

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    email: str = Field(
        sa_column_kwargs={"unique": True},
        index=True,
        nullable=False,
        max_length=320,
    )
    hashed_password: str = Field(nullable=False, max_length=255)
    display_name: str | None = Field(default=None, max_length=120)
    created_at: datetime | None = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            nullable=False,
        ),
    )
    updated_at: datetime | None = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False,
        ),
    )

    evaluations: Mapped[list["Evaluation"]] = Relationship(
        sa_relationship=relationship(
            "Evaluation",
            back_populates="user",
            cascade="all, delete-orphan",
        ),
    )
    playback_setting: Mapped["PlaybackSetting | None"] = Relationship(
        sa_relationship=relationship(
            "PlaybackSetting",
            back_populates="user",
            uselist=False,
            cascade="all, delete-orphan",
        ),
    )


class TrackCache(SQLModel, table=True):
    __tablename__ = "track_cache"  # type: ignore[assignment]
    __table_args__ = (
        UniqueConstraint("external_id", name="uq_track_cache_external_id"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    external_id: str = Field(nullable=False, index=True, max_length=100)
    source: str | None = Field(default=None, max_length=50)
    title: str | None = Field(default=None, max_length=255)
    artist: str | None = Field(default=None, max_length=255)
    album: str | None = Field(default=None, max_length=255)
    artwork_url: str | None = Field(default=None, max_length=500)
    preview_url: str | None = Field(default=None, max_length=500)
    primary_genre: str | None = Field(default=None, max_length=150)
    duration_ms: int | None = Field(default=None, ge=0)
    created_at: datetime | None = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            nullable=False,
        ),
    )
    updated_at: datetime | None = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False,
        ),
    )

    evaluations: Mapped[list["Evaluation"]] = Relationship(
        sa_relationship=relationship(
            "Evaluation",
            back_populates="track",
        ),
    )


class Evaluation(SQLModel, table=True):
    __tablename__ = "evaluations"  # type: ignore[assignment]
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "external_track_id",
            name="uq_user_track_latest",
        ),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    user_id: uuid.UUID = Field(
        foreign_key="users.id",
        nullable=False,
        index=True,
    )
    track_id: int | None = Field(
        default=None,
        foreign_key="track_cache.id",
        index=True,
    )
    external_track_id: str = Field(nullable=False, index=True, max_length=100)
    status: EvaluationStatus = Field(nullable=False, index=True)
    note: str | None = Field(default=None, max_length=500)
    source: str | None = Field(default=None, max_length=50)
    created_at: datetime | None = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            nullable=False,
        ),
    )
    updated_at: datetime | None = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False,
        ),
    )

    user: Mapped["User"] = Relationship(
        sa_relationship=relationship(
            "User",
            back_populates="evaluations",
        ),
    )
    track: Mapped["TrackCache | None"] = Relationship(
        sa_relationship=relationship(
            "TrackCache",
            back_populates="evaluations",
        ),
    )


class PlaybackSetting(SQLModel, table=True):
    __tablename__ = "playback_settings"  # type: ignore[assignment]

    user_id: uuid.UUID = Field(
        foreign_key="users.id",
        primary_key=True,
        nullable=False,
    )
    playback_rate: float = Field(
        default=1.0,
        ge=0.5,
        le=3.0,
        nullable=False,
    )
    muted: bool = Field(default=False, nullable=False)
    created_at: datetime | None = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            nullable=False,
        ),
    )
    updated_at: datetime | None = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False,
        ),
    )

    user: Mapped["User"] = Relationship(
        sa_relationship=relationship(
            "User",
            back_populates="playback_setting",
        ),
    )


__all__ = [
    "Evaluation",
    "EvaluationStatus",
    "PlaybackSetting",
    "TrackCache",
    "User",
]

User.__annotations__ = get_type_hints(User, globals(), locals())
TrackCache.__annotations__ = get_type_hints(TrackCache, globals(), locals())
Evaluation.__annotations__ = get_type_hints(Evaluation, globals(), locals())
PlaybackSetting.__annotations__ = get_type_hints(
    PlaybackSetting,
    globals(),
    locals(),
)
