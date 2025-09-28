"""Authentication domain services."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    TokenError,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    get_password_hash,
    verify_password,
)
from app.db.crud import UserCRUD
from app.db.models import User
from app.schemas import TokenBundleResponse, UserResponse


class AuthServiceError(Exception):
    """Raised when authentication operations fail."""

    def __init__(self, message: str, *, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


@dataclass
class TokenBundle:
    access_token: str
    refresh_token: str
    access_expires_at: datetime
    refresh_expires_at: datetime

    def to_response(self, user: User) -> TokenBundleResponse:
        now = datetime.now(timezone.utc)
        return TokenBundleResponse(
            access_token=self.access_token,
            refresh_token=self.refresh_token,
            expires_in=max(
                1,
                int((self.access_expires_at - now).total_seconds()),
            ),
            refresh_expires_in=max(
                1,
                int((self.refresh_expires_at - now).total_seconds()),
            ),
            user=UserResponse.model_validate(user),
        )


class AuthService:
    """High-level authentication workflows."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def register_user(
        self,
        *,
        email: str,
        password: str,
        display_name: str | None = None,
    ) -> Tuple[User, TokenBundle]:
        existing = await UserCRUD.get_by_email(self.session, email)
        if existing:
            raise AuthServiceError(
                "Email is already registered",
                status_code=409,
            )

        hashed = get_password_hash(password)
        user = await UserCRUD.create(
            self.session,
            email=email,
            hashed_password=hashed,
            display_name=display_name,
        )
        await self.session.commit()
        await self.session.refresh(user)
        tokens = await self._issue_tokens(user)
        return user, tokens

    async def authenticate_user(
        self,
        *,
        email: str,
        password: str,
    ) -> Tuple[User, TokenBundle]:
        user = await UserCRUD.get_by_email(self.session, email)
        if user is None or not verify_password(password, user.hashed_password):
            raise AuthServiceError(
                "Invalid email or password",
                status_code=401,
            )

        tokens = await self._issue_tokens(user)
        return user, tokens

    async def refresh_tokens(
        self,
        refresh_token: str,
    ) -> Tuple[User, TokenBundle]:
        try:
            payload = decode_refresh_token(refresh_token)
        except TokenError as exc:  # pragma: no cover - delegated to handler
            raise AuthServiceError(
                "Invalid refresh token",
                status_code=401,
            ) from exc

        user_id = payload.get("sub")
        if not user_id:
            raise AuthServiceError("Invalid refresh token", status_code=401)

        try:
            user_uuid = UUID(user_id)
        except ValueError as exc:
            raise AuthServiceError(
                "Invalid refresh token",
                status_code=401,
            ) from exc

        user = await UserCRUD.get_by_id(self.session, user_uuid)
        if user is None:
            raise AuthServiceError("User not found", status_code=404)

        tokens = await self._issue_tokens(user)
        return user, tokens

    async def _issue_tokens(self, user: User) -> TokenBundle:
        access_token, access_exp = create_access_token(str(user.id))
        refresh_token, refresh_exp = create_refresh_token(str(user.id))
        return TokenBundle(
            access_token=access_token,
            refresh_token=refresh_token,
            access_expires_at=access_exp,
            refresh_expires_at=refresh_exp,
        )
