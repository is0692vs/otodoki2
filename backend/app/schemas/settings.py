"""Schemas for playback settings endpoints."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class PlaybackSettingRequest(BaseModel):
    playback_rate: float = Field(ge=0.5, le=3.0)
    muted: bool = False


class PlaybackSettingResponse(PlaybackSettingRequest):
    updated_at: datetime | None = None

    model_config = {
        "from_attributes": True,
    }
