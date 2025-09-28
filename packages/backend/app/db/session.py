"""Database session and engine utilities.

Phase 1 scaffolding: the actual models will be wired in Phase 2.
"""
from __future__ import annotations

import os
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

DEFAULT_DATABASE_URL = (
    "postgresql+asyncpg://otodoki:otodoki-password@db:5432/otodoki2"
)
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)

engine = create_async_engine(DATABASE_URL, echo=False, future=True)

AsyncSessionMaker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide an async database session for request-scoped usage."""
    async with AsyncSessionMaker() as session:
        yield session


async def dispose_engine() -> None:
    """Dispose the async engine (used on shutdown)."""
    await engine.dispose()
