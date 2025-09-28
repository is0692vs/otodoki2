"""Schemas for playback history endpoints."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from .evaluation import TrackPayload


class PlayHistoryCreateRequest(BaseModel):
    track: TrackPayload
    source: str | None = Field(default=None, max_length=50)
    played_at: datetime | None = None


class PlayHistoryResponse(BaseModel):
    id: UUID
    external_track_id: str
    source: str | None = None
    played_at: datetime | None = None
    track: TrackPayload | None = None

    model_config = {
        "from_attributes": True,
    }
