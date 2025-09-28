"""Track cache CRUD helpers."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import TrackCache


class TrackCacheCRUD:
    """Helpers for interacting with cached track metadata."""

    @staticmethod
    async def get_by_external_id(
        session: AsyncSession,
        external_id: str,
    ) -> Optional[TrackCache]:
        result = await session.execute(
            select(TrackCache).where(
                TrackCache.external_id == external_id  # type: ignore[arg-type]
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def ensure_track(
        session: AsyncSession,
        *,
        external_id: str,
        source: str | None = None,
        title: str | None = None,
        artist: str | None = None,
        album: str | None = None,
        artwork_url: str | None = None,
        preview_url: str | None = None,
        primary_genre: str | None = None,
        duration_ms: int | None = None,
    ) -> TrackCache:
        track = await TrackCacheCRUD.get_by_external_id(session, external_id)
        if track is None:
            track = TrackCache(
                external_id=external_id,
                source=source,
                title=title,
                artist=artist,
                album=album,
                artwork_url=artwork_url,
                preview_url=preview_url,
                primary_genre=primary_genre,
                duration_ms=duration_ms,
            )
            session.add(track)
        else:
            track.source = source or track.source
            track.title = title or track.title
            track.artist = artist or track.artist
            track.album = album or track.album
            track.artwork_url = artwork_url or track.artwork_url
            track.preview_url = preview_url or track.preview_url
            track.primary_genre = primary_genre or track.primary_genre
            track.duration_ms = duration_ms or track.duration_ms
        await session.flush()
        await session.refresh(track)
        return track
