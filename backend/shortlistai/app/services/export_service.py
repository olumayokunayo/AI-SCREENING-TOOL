"""
app/services/export_service.py
Generates in-memory CSV exports for a screening's shortlist.
"""
from __future__ import annotations

import csv
import io
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import User
from app.services.screening_service import get_screening_detail


async def generate_csv_export(
    db: AsyncSession,
    screening_id: uuid.UUID,
    user: User,
) -> tuple[bytes, str]:
    """
    Build a CSV byte string for the given screening.
    Returns (csv_bytes, suggested_filename).
    Raises ValueError if screening not found.
    """
    detail = await get_screening_detail(db, screening_id, user)

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_ALL)

    # Header
    writer.writerow([
        "Rank",
        "Candidate Name",
        "Match Score (%)",
        "Key Strengths",
        "Gaps",
        "Recruiter Summary",
        "File Name",
    ])

    for candidate in detail.candidates:
        writer.writerow([
            candidate.rank,
            candidate.name,
            f"{candidate.match_score:.1f}",
            " | ".join(candidate.strengths),
            " | ".join(candidate.gaps),
            candidate.summary or "",
            candidate.file_name or "",
        ])

    csv_bytes = output.getvalue().encode("utf-8-sig")  # BOM for Excel compatibility
    safe_title = (detail.role_title or "screening").replace(" ", "_").replace("/", "-")[:40]
    filename = f"ShortlistAI_{safe_title}_{screening_id.hex[:8]}.csv"

    return csv_bytes, filename
