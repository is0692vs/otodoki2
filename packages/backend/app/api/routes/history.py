"""Playback history API routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.api.deps import (
    get_current_user,
    get_play_history_service,
)
from app.db.models import User
from app.schemas import PlayHistoryCreateRequest, PlayHistoryResponse
from app.services.play_history import PlayHistoryService

router = APIRouter(prefix="/api/v1/history", tags=["history"])


@router.post(
    "/played",
    response_model=PlayHistoryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def record_playback(
    payload: PlayHistoryCreateRequest,
    user: User = Depends(get_current_user),
    service: PlayHistoryService = Depends(get_play_history_service),
) -> PlayHistoryResponse:
    entry = await service.record_playback(user=user, request=payload)
    return service.to_response(entry)


__all__ = ["router"]
