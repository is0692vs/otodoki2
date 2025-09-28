"""Playback settings CRUD helpers."""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import PlaybackSetting


class PlaybackCRUD:
    """Helpers for the ``playback_settings`` table."""

    @staticmethod
    async def get(
        session: AsyncSession,
        user_id: UUID,
    ) -> Optional[PlaybackSetting]:
        result = await session.execute(
            select(PlaybackSetting).where(
                PlaybackSetting.user_id == user_id  # type: ignore[arg-type]
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def upsert(
        session: AsyncSession,
        *,
        user_id: UUID,
        playback_rate: float,
        muted: bool,
    ) -> PlaybackSetting:
        setting = await PlaybackCRUD.get(session, user_id)
        if setting is None:
            setting = PlaybackSetting(
                user_id=user_id,
                playback_rate=playback_rate,
                muted=muted,
            )
            session.add(setting)
        else:
            setting.playback_rate = playback_rate
            setting.muted = muted
        await session.flush()
        await session.refresh(setting)
        return setting
