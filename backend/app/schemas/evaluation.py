"""Evaluation request / response schemas."""
from __future__ import annotations

from datetime import datetime
from typing import List
from uuid import UUID

from pydantic import BaseModel, Field

from app.db.models import EvaluationStatus


class TrackPayload(BaseModel):
    external_id: str = Field(min_length=1, max_length=100)
    source: str | None = Field(default=None, max_length=50)
    title: str | None = Field(default=None, max_length=255)
    artist: str | None = Field(default=None, max_length=255)
    album: str | None = Field(default=None, max_length=255)
    artwork_url: str | None = Field(default=None, max_length=500)
    preview_url: str | None = Field(default=None, max_length=500)
    primary_genre: str | None = Field(default=None, max_length=150)
    duration_ms: int | None = Field(default=None, ge=0)


class EvaluationCreateRequest(BaseModel):
    track: TrackPayload
    status: EvaluationStatus
    note: str | None = Field(default=None, max_length=500)
    source: str | None = Field(default=None, max_length=50)


class EvaluationResponse(BaseModel):
    id: UUID
    external_track_id: str
    status: EvaluationStatus
    note: str | None = None
    source: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    track: TrackPayload | None = None

    model_config = {
        "from_attributes": True,
    }


class EvaluationListResponse(BaseModel):
    items: List[EvaluationResponse]
    limit: int
    offset: int
    total: int
