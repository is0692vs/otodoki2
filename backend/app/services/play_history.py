"""Service layer for recording user playback history."""
from __future__ import annotations

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.crud import PlayHistoryCRUD, TrackCacheCRUD
from app.db.models import PlayHistory, TrackCache, User
from app.schemas.evaluation import TrackPayload
from app.schemas.history import (
    PlayHistoryCreateRequest,
    PlayHistoryResponse,
)


class PlayHistoryService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def record_playback(
        self,
        *,
        user: User,
        request: PlayHistoryCreateRequest,
    ) -> PlayHistory:
        track = await self._ensure_track(request.track)
        entry = await PlayHistoryCRUD.create(
            self.session,
            user_id=user.id,
            external_track_id=request.track.external_id,
            track_id=track.id if track else None,
            source=request.source,
            played_at=request.played_at,
        )
        await self.session.commit()
        await self.session.refresh(entry)
        await self.session.refresh(entry, attribute_names=["track"])
        return entry

    def to_response(self, history: PlayHistory) -> PlayHistoryResponse:
        return PlayHistoryResponse(
            id=history.id,
            external_track_id=history.external_track_id,
            source=history.source,
            played_at=history.played_at,
            track=self._to_track_payload(history.track),
        )

    async def _ensure_track(
        self,
        payload: TrackPayload,
    ) -> Optional[TrackCache]:
        return await TrackCacheCRUD.ensure_track(
            self.session,
            external_id=payload.external_id,
            source=payload.source,
            title=payload.title,
            artist=payload.artist,
            album=payload.album,
            artwork_url=payload.artwork_url,
            preview_url=payload.preview_url,
            primary_genre=payload.primary_genre,
            duration_ms=payload.duration_ms,
        )

    def _to_track_payload(
        self,
        track: Optional[TrackCache],
    ) -> Optional[TrackPayload]:
        if track is None:
            return None
        return TrackPayload(
            external_id=track.external_id,
            source=track.source,
            title=track.title,
            artist=track.artist,
            album=track.album,
            artwork_url=track.artwork_url,
            preview_url=track.preview_url,
            primary_genre=track.primary_genre,
            duration_ms=track.duration_ms,
        )
