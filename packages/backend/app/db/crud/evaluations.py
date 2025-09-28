"""Evaluation CRUD helpers."""
from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Evaluation, EvaluationStatus


class EvaluationCRUD:
    """Helpers for creating and retrieving user evaluations."""

    @staticmethod
    async def get_by_id(
        session: AsyncSession,
        evaluation_id: UUID,
    ) -> Optional[Evaluation]:
        result = await session.execute(
            select(Evaluation).where(
                Evaluation.id == evaluation_id  # type: ignore[arg-type]
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_user_and_track(
        session: AsyncSession,
        user_id: UUID,
        external_track_id: str,
    ) -> Optional[Evaluation]:
        result = await session.execute(
            select(Evaluation).where(
                Evaluation.user_id == user_id,  # type: ignore[arg-type]
                Evaluation.external_track_id
                == external_track_id,  # type: ignore[arg-type]
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list_by_user(
        session: AsyncSession,
        user_id: UUID,
        *,
        status: EvaluationStatus | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Evaluation]:
        query = select(Evaluation).where(
            Evaluation.user_id == user_id  # type: ignore[arg-type]
        )
        if status is not None:
            query = query.where(
                Evaluation.status == status  # type: ignore[arg-type]
            )
        query = (
            query.order_by(
                Evaluation.updated_at.desc()  # type: ignore[union-attr]
            )
            .offset(offset)
            .limit(limit)
        )
        result = await session.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def upsert(
        session: AsyncSession,
        *,
        user_id: UUID,
        external_track_id: str,
        status: EvaluationStatus,
        track_id: int | None = None,
        note: str | None = None,
        source: str | None = None,
    ) -> Evaluation:
        evaluation = await EvaluationCRUD.get_by_user_and_track(
            session,
            user_id,
            external_track_id,
        )
        if evaluation is None:
            evaluation = Evaluation(
                user_id=user_id,
                external_track_id=external_track_id,
                status=status,
                track_id=track_id,
                note=note,
                source=source,
            )
            session.add(evaluation)
        else:
            evaluation.status = status
            evaluation.track_id = track_id
            evaluation.note = note
            evaluation.source = source
        await session.flush()
        await session.refresh(evaluation)
        return evaluation

    @staticmethod
    async def delete_by_user_and_track(
        session: AsyncSession,
        *,
        user_id: UUID,
        external_track_id: str,
    ) -> None:
        evaluation = await EvaluationCRUD.get_by_user_and_track(
            session,
            user_id,
            external_track_id,
        )
        if evaluation is not None:
            await session.delete(evaluation)
            await session.flush()
