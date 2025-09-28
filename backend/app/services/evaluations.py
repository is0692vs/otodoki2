"""Service layer for handling user evaluations."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, List, Optional, cast

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.crud import EvaluationCRUD, TrackCacheCRUD
from app.db.models import Evaluation, EvaluationStatus, TrackCache, User
from app.schemas.evaluation import (
    EvaluationCreateRequest,
    EvaluationListResponse,
    EvaluationResponse,
    TrackPayload,
)


@dataclass
class EvaluationPage:
    items: List[Evaluation]
    total: int
    limit: int
    offset: int


class EvaluationService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def record_evaluation(
        self,
        *,
        user: User,
        request: EvaluationCreateRequest,
    ) -> Evaluation:
        track = await self._ensure_track(request.track)
        evaluation = await EvaluationCRUD.upsert(
            self.session,
            user_id=user.id,
            external_track_id=request.track.external_id,
            status=request.status,
            track_id=track.id if track else None,
            note=request.note,
            source=request.source,
        )
        await self.session.commit()
        await self.session.refresh(evaluation)
        await self.session.refresh(evaluation, attribute_names=["track"])
        if track is not None:
            await self.session.refresh(track)
        return evaluation

    async def delete_evaluation(
        self,
        *,
        user: User,
        external_track_id: str,
    ) -> None:
        await EvaluationCRUD.delete_by_user_and_track(
            self.session,
            user_id=user.id,
            external_track_id=external_track_id,
        )
        await self.session.commit()

    async def list_evaluations(
        self,
        *,
        user: User,
        status: EvaluationStatus | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> EvaluationPage:
        limit = max(1, min(limit, 200))
        offset = max(0, offset)

        query = select(Evaluation).where(
            cast(Any, Evaluation.user_id) == user.id
        )
        count_query = select(
            func.count(cast(Any, Evaluation.id))
        ).where(
            cast(Any, Evaluation.user_id) == user.id
        )
        if status is not None:
            query = query.where(
                cast(Any, Evaluation.status) == status
            )
            count_query = count_query.where(
                cast(Any, Evaluation.status) == status
            )

        query = (
            query.order_by(
                cast(Any, Evaluation.updated_at).desc()
            )
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(query)
        items = list(result.scalars().all())

        total_result = await self.session.execute(count_query)
        total = total_result.scalar_one()

        for item in items:
            await self.session.refresh(item, attribute_names=["track"])

        return EvaluationPage(
            items=items,
            total=total,
            limit=limit,
            offset=offset,
        )

    async def to_response(
        self,
        page: EvaluationPage,
    ) -> EvaluationListResponse:
        responses = [self._to_evaluation_response(item) for item in page.items]
        return EvaluationListResponse(
            items=responses,
            total=page.total,
            limit=page.limit,
            offset=page.offset,
        )

    def _to_evaluation_response(
        self,
        evaluation: Evaluation,
    ) -> EvaluationResponse:
        return EvaluationResponse(
            id=evaluation.id,
            external_track_id=evaluation.external_track_id,
            status=evaluation.status,
            note=evaluation.note,
            source=evaluation.source,
            created_at=evaluation.created_at,
            updated_at=evaluation.updated_at,
            track=self._to_track_payload(evaluation.track),
        )

    def _to_track_payload(
        self,
        track: Optional[TrackCache],
    ) -> Optional[TrackPayload]:
        if track is None:
            return None
        return TrackPayload(
            external_id=track.external_id,
            source=track.source,
            title=track.title,
            artist=track.artist,
            album=track.album,
            artwork_url=track.artwork_url,
            preview_url=track.preview_url,
            primary_genre=track.primary_genre,
            duration_ms=track.duration_ms,
        )

    async def _ensure_track(
        self,
        payload: TrackPayload,
    ) -> Optional[TrackCache]:
        return await TrackCacheCRUD.ensure_track(
            self.session,
            external_id=payload.external_id,
            source=payload.source,
            title=payload.title,
            artist=payload.artist,
            album=payload.album,
            artwork_url=payload.artwork_url,
            preview_url=payload.preview_url,
            primary_genre=payload.primary_genre,
            duration_ms=payload.duration_ms,
        )
