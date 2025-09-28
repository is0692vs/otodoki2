"""Routes for exporting user data as CSV files."""
from __future__ import annotations

import csv
import io
from typing import List

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_session
from app.db.crud import EvaluationCRUD
from app.db.models import Evaluation, EvaluationStatus, User

router = APIRouter(prefix="/api/v1/export", tags=["export"])


async def _fetch_all_liked_evaluations(
    session: AsyncSession,
    user: User,
) -> List[Evaluation]:
    """Retrieve all liked evaluations for the given user."""
    evaluations: List[Evaluation] = []
    offset = 0
    batch_size = 500

    while True:
        chunk = await EvaluationCRUD.list_by_user(
            session,
            user_id=user.id,
            status=EvaluationStatus.LIKE,
            limit=batch_size,
            offset=offset,
        )
        if not chunk:
            break

        evaluations.extend(chunk)

        if len(chunk) < batch_size:
            break

        offset += batch_size

    for evaluation in evaluations:
        await session.refresh(evaluation, attribute_names=["track"])

    return evaluations


@router.get("/likes.csv")
async def export_liked_tracks_csv(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
) -> StreamingResponse:
    evaluations = await _fetch_all_liked_evaluations(session, current_user)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["trackName", "artistName", "collectionName"])

    for evaluation in evaluations:
        track = getattr(evaluation, "track", None)
        track_name = (
            getattr(track, "title", None)
            or getattr(track, "source", None)
            or evaluation.external_track_id
        )
        artist_name = getattr(track, "artist", "") or ""
        collection_name = getattr(track, "album", "") or ""
        writer.writerow([track_name, artist_name, collection_name])

    output.seek(0)
    csv_bytes = output.getvalue().encode("utf-8")

    headers = {
        "Content-Disposition": 'attachment; filename="otodoki2-likes.csv"'
    }

    return StreamingResponse(
        iter([csv_bytes]),
        media_type="text/csv",
        headers=headers,
    )


__all__ = ["router"]
