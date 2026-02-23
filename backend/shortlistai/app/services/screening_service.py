"""
Orchestrates the full screening pipeline:
  1. Extract text from uploaded CVs
  2. Parse JD into essential / responsibility / desirable sections
  3. Generate embeddings (all CVs + all JD sections) in one batch
  4. Compute weighted match scores via scorer.py (55/30/15 formula)
  5. Run concurrent AI analysis per candidate, passing section scores for calibrated summaries
  6. Persist screening + candidates to DB
  7. Return ranked results
"""
from __future__ import annotations

import asyncio
import uuid
from dataclasses import dataclass, field

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.logging import get_logger
from app.models.models import Candidate, Screening, User
from app.schemas.schemas import (
    CandidateAnalysis,
    CandidateResponse,
    ScoringBreakdown,
    ScreeningDetailResponse,
    ScreeningListItem,
    ScreeningListResponse,
)
from app.services.ai_service import analyse_candidates_batch
from app.services.jd_parser import ParsedJD, parse_job_description
from app.services.scorer import SectionScores, score_cvs_batch
from app.utils.file_parser import extract_text_from_upload

logger = get_logger(__name__)


# ── Internal dataclasses ──────────────────────────────────────────────────────

@dataclass
class ParsedCV:
    filename: str
    text: str
    parse_error: str | None = None


@dataclass
class ScoredCandidate:
    filename: str
    text: str
    match_score: float
    section_scores: SectionScores | None = None
    analysis: CandidateAnalysis | None = None


# ── Screening pipeline ────────────────────────────────────────────────────────

async def _parse_cvs_concurrently(files: list[UploadFile]) -> tuple[list[ParsedCV], list[str]]:
    """
    Parse all uploaded files concurrently.
    Returns (successfully_parsed, parse_errors).
    """
    async def _parse_one(file: UploadFile) -> ParsedCV:
        try:
            filename, text = await extract_text_from_upload(file)
            return ParsedCV(filename=filename, text=text)
        except ValueError as exc:
            return ParsedCV(filename=file.filename or "unknown", text="", parse_error=str(exc))

    results = await asyncio.gather(*[_parse_one(f) for f in files])
    parsed = [r for r in results if not r.parse_error]
    errors = [r.parse_error for r in results if r.parse_error]
    for err in errors:
        logger.warning("CV parse error: %s", err)
    return parsed, errors


def _rank_candidates(scored: list[ScoredCandidate]) -> list[ScoredCandidate]:
    return sorted(scored, key=lambda c: c.match_score, reverse=True)


def _extract_role_title_heuristic(job_description: str) -> str:
    """
    Fast heuristic fallback. Looks for explicit 'Job Title:' / 'Role:' labels first,
    then falls back to the first short line that looks like a title rather than prose.
    Only used if the LLM call fails.
    """
    lines = [l.strip() for l in job_description.splitlines() if l.strip()]
    # Pass 1: labelled fields
    for line in lines[:15]:
        lower = line.lower()
        if any(lower.startswith(kw) for kw in ("job title:", "role:", "position:", "title:")):
            parts = line.split(":", 1)
            if len(parts) == 2 and parts[1].strip():
                return parts[1].strip()[:200]
    # Pass 2: first short line that doesn't look like a sentence
    for line in lines[:10]:
        if 3 < len(line) < 80 and not line.endswith(".") and line[0].isupper():
            return line[:200]
    return "Untitled Role"


async def _extract_role_title(job_description: str) -> str:
    """
    Ask the LLM to extract the job title from the description.
    Works even when the JD starts with body text rather than a title line.
    Falls back to the heuristic if the LLM call fails.
    """
    from app.services.ai_service import get_openai_client
    from app.core.config import get_settings
    settings = get_settings()
    client = get_openai_client()

    try:
        response = await client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are given a job description. Your only task is to identify "
                        "the job title being recruited for. "
                        "The title may appear explicitly (e.g. \'Job Title: X\') or be "
                        "implied in the text (e.g. \'We are seeking a Customer Service Adviser...\'). "
                        "Return ONLY the job title — a short plain-text string, no punctuation, "
                        "no explanation, no quotes, no markdown. "
                        "Good examples: Customer Service Adviser, Senior Software Engineer, "
                        "Marketing Manager, Data Analyst. "
                        "If you truly cannot determine a title, return: Untitled Role"
                    ),
                },
                {"role": "user", "content": job_description[:2000]},
            ],
            temperature=0.0,
            max_tokens=20,
        )
        title = (response.choices[0].message.content or "").strip().strip('"').strip("'").strip(".")
        if title and len(title) < 150 and title.lower() != "untitled role":
            logger.info("Role title extracted by LLM: '%s'", title)
            return title
        logger.warning("LLM returned unusable title '%s'; trying heuristic.", title)
    except Exception as exc:
        logger.warning("LLM role title extraction failed (%s); using heuristic.", exc)

    title = _extract_role_title_heuristic(job_description)
    logger.info("Role title from heuristic: '%s'", title)
    return title


async def run_screening(
    db: AsyncSession,
    user: User,
    job_description: str,
    files: list[UploadFile],
) -> ScreeningDetailResponse:
    """
    Main pipeline entry point. Returns full screening results.
    Raises RuntimeError if no CVs could be parsed.
    """
    logger.info("Starting screening for user=%s with %d files", user.id, len(files))

    # 1. Parse CVs
    parsed_cvs, parse_errors = await _parse_cvs_concurrently(files)
    if not parsed_cvs:
        raise RuntimeError(
            f"No readable CVs could be extracted. Errors: {'; '.join(parse_errors)}"
        )

    # 2. Parse JD into sections (essential / responsibility / desirable)
    #    Runs concurrently with nothing else — cheap single LLM call.
    parsed_jd: ParsedJD = await parse_job_description(job_description)

    # 3. Score all CVs using the weighted section scorer.
    #    Internally embeds CVs + JD sections in one batch, then scores in Python.
    cv_texts = [cv.text for cv in parsed_cvs]
    section_scores: list[SectionScores] = await score_cvs_batch(cv_texts, parsed_jd)

    # 4. Build ScoredCandidates from section scores
    scored: list[ScoredCandidate] = []
    for cv, sc in zip(parsed_cvs, section_scores):
        scored.append(ScoredCandidate(
            filename=cv.filename,
            text=cv.text,
            match_score=sc.final_score,
            section_scores=sc,
        ))

    # 5. Concurrent AI analysis — each call receives its candidate's section scores
    #    so the summary prompt is calibrated (no more treating desirable gaps as concerns).
    analyses = await analyse_candidates_batch(
        job_description=job_description,
        cv_texts=cv_texts,
        essential=parsed_jd.essential,
        responsibility=parsed_jd.responsibility,
        desirable=parsed_jd.desirable,
        section_scores=section_scores,
    )
    for candidate, analysis in zip(scored, analyses):
        candidate.analysis = analysis

    # 6. Rank by final score
    ranked = _rank_candidates(scored)

    # 7. Aggregate stats
    scores = [c.match_score for c in ranked]
    top_score = scores[0] if scores else None
    avg_score = round(sum(scores) / len(scores), 1) if scores else None
    role_title = await _extract_role_title(job_description)
    print(f"DEBUG ROLE TITLE: [{role_title}]", flush=True)

    # 8. Persist to DB
    screening = Screening(
        user_id=user.id,
        role_title=role_title,
        job_description=job_description,
        candidate_count=len(ranked),
        top_match_score=top_score,
        average_match_score=avg_score,
        status="complete",
    )
    db.add(screening)
    await db.flush()  # get screening.id

    for rank_idx, sc in enumerate(ranked, start=1):
        analysis = sc.analysis or CandidateAnalysis(
            name="Unknown Candidate", strengths=[], gaps=[], summary=""
        )
        candidate = Candidate(
            screening_id=screening.id,
            name=analysis.name,
            rank=rank_idx,
            match_score=sc.match_score,
            strengths=analysis.strengths,
            gaps=analysis.gaps,
            summary=analysis.summary,
            file_name=sc.filename,
        )
        db.add(candidate)

    await db.commit()
    await db.refresh(screening)

    # 9. Build response — inject scoring breakdown (not stored in DB, computed above)
    base_response = await get_screening_detail(db, screening.id, user)

    # Attach section scores to each candidate response
    scores_by_filename = {
        sc.filename: sc.section_scores
        for sc in ranked
        if sc.section_scores is not None
    }

    enriched_candidates = []
    for candidate_resp in base_response.candidates:
        ss = scores_by_filename.get(candidate_resp.file_name)
        if ss:
            breakdown = ScoringBreakdown(
                essential_score=ss.essential_score,
                responsibility_score=ss.responsibility_score,
                desirable_score=ss.desirable_score,
                confidence_label=ss.confidence_label,
            )
            enriched_candidates.append(
                candidate_resp.model_copy(update={"scoring": breakdown})
            )
        else:
            enriched_candidates.append(candidate_resp)

    return base_response.model_copy(update={"candidates": enriched_candidates})


# ── History / detail queries ──────────────────────────────────────────────────

async def get_user_screenings(
    db: AsyncSession,
    user: User,
    limit: int = 50,
    offset: int = 0,
) -> ScreeningListResponse:
    stmt = (
        select(Screening)
        .where(Screening.user_id == user.id)
        .order_by(Screening.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(stmt)
    screenings = result.scalars().all()

    count_stmt = select(Screening).where(Screening.user_id == user.id)
    total = len((await db.execute(count_stmt)).scalars().all())

    return ScreeningListResponse(
        total=total,
        items=[ScreeningListItem.model_validate(s) for s in screenings],
    )


async def get_screening_detail(
    db: AsyncSession,
    screening_id: uuid.UUID,
    user: User,
) -> ScreeningDetailResponse:
    stmt = (
        select(Screening)
        .where(Screening.id == screening_id, Screening.user_id == user.id)
        .options(selectinload(Screening.candidates))
    )
    result = await db.execute(stmt)
    screening = result.scalar_one_or_none()

    if screening is None:
        raise ValueError(f"Screening {screening_id} not found.")

    return ScreeningDetailResponse.model_validate(screening)