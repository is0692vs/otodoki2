"""Evaluation CRUD API routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response, status

from app.api.deps import (
    get_current_user,
    get_evaluation_service,
)
from app.db.models import EvaluationStatus, User
from app.schemas import (
    EvaluationCreateRequest,
    EvaluationListResponse,
    EvaluationResponse,
)
from app.services.evaluations import EvaluationPage, EvaluationService

router = APIRouter(prefix="/api/v1/evaluations", tags=["evaluations"])


@router.get("", response_model=EvaluationListResponse)
async def list_evaluations(
    status_filter: EvaluationStatus | None = Query(
        None,
        alias="status",
        description="Filter by evaluation status",
    ),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    service: EvaluationService = Depends(get_evaluation_service),
) -> EvaluationListResponse:
    page = await service.list_evaluations(
        user=user,
        status=status_filter,
        limit=limit,
        offset=offset,
    )
    return await service.to_response(page)


@router.post(
    "",
    response_model=EvaluationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_evaluation(
    payload: EvaluationCreateRequest,
    user: User = Depends(get_current_user),
    service: EvaluationService = Depends(get_evaluation_service),
) -> EvaluationResponse:
    evaluation = await service.record_evaluation(user=user, request=payload)
    single_page = EvaluationPage(
        items=[evaluation],
        total=1,
        limit=1,
        offset=0,
    )
    response = await service.to_response(single_page)
    return response.items[0]


@router.delete("/{external_track_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_evaluation(
    external_track_id: str,
    user: User = Depends(get_current_user),
    service: EvaluationService = Depends(get_evaluation_service),
) -> Response:
    await service.delete_evaluation(
        user=user,
        external_track_id=external_track_id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


__all__ = ["router"]
