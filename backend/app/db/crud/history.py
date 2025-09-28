"""Play history CRUD helpers."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import PlayHistory


class PlayHistoryCRUD:
    """Helpers for the ``play_history`` table."""

    @staticmethod
    async def create(
        session: AsyncSession,
        *,
        user_id: UUID,
        external_track_id: str,
        track_id: int | None = None,
        source: str | None = None,
        played_at: datetime | None = None,
    ) -> PlayHistory:
        history = PlayHistory(
            user_id=user_id,
            external_track_id=external_track_id,
            track_id=track_id,
            source=source,
        )
        if played_at is not None:
            history.played_at = played_at
        session.add(history)
        await session.flush()
        await session.refresh(history)
        return history
