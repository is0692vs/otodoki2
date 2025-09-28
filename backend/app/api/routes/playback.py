"""Playback settings API routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_session
from app.db.crud import PlaybackCRUD
from app.db.models import User
from app.schemas import PlaybackSettingRequest, PlaybackSettingResponse

router = APIRouter(prefix="/api/v1/settings", tags=["settings"])


@router.get("/playback", response_model=PlaybackSettingResponse)
async def get_playback_setting(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> PlaybackSettingResponse:
    setting = await PlaybackCRUD.get(session, user.id)
    if setting is None:
        return PlaybackSettingResponse(playback_rate=1.0, muted=False)
    return PlaybackSettingResponse.model_validate(setting)


@router.put(
    "/playback",
    response_model=PlaybackSettingResponse,
    status_code=status.HTTP_200_OK,
)
async def update_playback_setting(
    payload: PlaybackSettingRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> PlaybackSettingResponse:
    setting = await PlaybackCRUD.upsert(
        session,
        user_id=user.id,
        playback_rate=payload.playback_rate,
        muted=payload.muted,
    )
    await session.commit()
    await session.refresh(setting)
    return PlaybackSettingResponse.model_validate(setting)


__all__ = ["router"]
