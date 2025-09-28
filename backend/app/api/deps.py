"""API-specific dependency functions for FastAPI routes."""
from __future__ import annotations

import logging
from typing import AsyncGenerator
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import TokenError, decode_access_token
from app.db.models import User
from app.db.crud import UserCRUD
from app.dependencies import get_db_session
from app.services.auth import AuthService
from app.services.evaluations import EvaluationService
from app.services.play_history import PlayHistoryService

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Expose the application DB session factory for overrides in tests."""
    async for session in get_db_session():
        yield session


async def get_auth_service(
    session: AsyncSession = Depends(get_session),
) -> AuthService:
    return AuthService(session)


async def get_evaluation_service(
    session: AsyncSession = Depends(get_session),
) -> EvaluationService:
    return EvaluationService(session)


async def get_play_history_service(
    session: AsyncSession = Depends(get_session),
) -> PlayHistoryService:
    return PlayHistoryService(session)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    try:
        payload = decode_access_token(token)
    except TokenError as exc:  # pragma: no cover - converted to HTTP error
        logger.debug("token decode failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_uuid = UUID(user_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    user = await UserCRUD.get_by_id(session, user_uuid)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


__all__ = [
    "get_auth_service",
    "get_current_user",
    "get_evaluation_service",
    "get_play_history_service",
    "get_session",
]
