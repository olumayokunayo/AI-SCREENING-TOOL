"""
app/routers/screenings.py
Screening endpoints: create, list, detail, export.
Route handlers contain zero business logic — all delegated to services.
"""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.logging import get_logger
from app.models.models import User
from app.schemas.schemas import ScreeningDetailResponse, ScreeningListResponse
from app.services.auth_service import get_current_user
from app.services.export_service import generate_csv_export
from app.services.screening_service import (
    get_screening_detail,
    get_user_screenings,
    run_screening,
)

logger = get_logger(__name__)

router = APIRouter(prefix="/screenings", tags=["Screenings"])

# ── POST /screenings ───────────────────────────────────────────────────────────

@router.post("", response_model=ScreeningDetailResponse, status_code=201)
async def create_screening(
    job_description: Annotated[str, Form(min_length=50, max_length=20_000)],
    cvs: Annotated[list[UploadFile], File(description="PDF or DOCX CV files (1–50)")],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ScreeningDetailResponse:
    """
    Upload a job description and one or more CV files.
    Returns ranked, AI-analysed candidates.
    """
    if not cvs or len(cvs) == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one CV file must be uploaded.",
        )
    if len(cvs) > 50:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Maximum 50 CVs per screening session.",
        )

    logger.info(
        "Screening requested by user=%s with %d CV(s)", current_user.id, len(cvs)
    )

    try:
        result = await run_screening(
            db=db,
            user=current_user,
            job_description=job_description,
            files=cvs,
        )
        return result
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error during screening: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again.",
        ) from exc


# ── GET /screenings ────────────────────────────────────────────────────────────

@router.get("", response_model=ScreeningListResponse)
async def list_screenings(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ScreeningListResponse:
    """List all screenings for the current user, newest first."""
    return await get_user_screenings(db, current_user, limit=limit, offset=offset)


# ── GET /screenings/{id} ───────────────────────────────────────────────────────

@router.get("/{screening_id}", response_model=ScreeningDetailResponse)
async def get_screening(
    screening_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ScreeningDetailResponse:
    """Retrieve full results for a specific screening."""
    try:
        return await get_screening_detail(db, screening_id, current_user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


# ── GET /screenings/{id}/export ────────────────────────────────────────────────

@router.get("/{screening_id}/export")
async def export_screening_csv(
    screening_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    """Download a CSV export of the ranked shortlist."""
    try:
        csv_bytes, filename = await generate_csv_export(db, screening_id, current_user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(csv_bytes)),
        },
    )
