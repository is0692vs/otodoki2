"""User related CRUD helpers."""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User


class UserCRUD:
    """Database helpers for the ``users`` table."""

    @staticmethod
    async def get_by_id(
        session: AsyncSession,
        user_id: UUID,
    ) -> Optional[User]:
        result = await session.execute(
            select(User).where(User.id == user_id)  # type: ignore[arg-type]
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_email(
        session: AsyncSession,
        email: str,
    ) -> Optional[User]:
        result = await session.execute(
            select(User).where(User.email == email)  # type: ignore[arg-type]
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        session: AsyncSession,
        *,
        email: str,
        hashed_password: str,
        display_name: str | None = None,
    ) -> User:
        user = User(
            email=email,
            hashed_password=hashed_password,
            display_name=display_name,
        )
        session.add(user)
        try:
            await session.flush()
        except IntegrityError as exc:  # re-raise with context for caller
            await session.rollback()
            raise exc
        await session.refresh(user)
        return user

    @staticmethod
    async def update_display_name(
        session: AsyncSession,
        user: User,
        display_name: str | None,
    ) -> User:
        user.display_name = display_name
        await session.flush()
        await session.refresh(user)
        return user
