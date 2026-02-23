"""
app/services/ai_service.py
All OpenAI interactions: embedding generation and structured candidate analysis.
Single-responsibility: no DB or HTTP concerns here.
"""
from __future__ import annotations

import asyncio
import json
import re
from typing import Any

from openai import AsyncOpenAI, APIError, RateLimitError

from app.core.config import get_settings
from app.core.logging import get_logger
from app.schemas.schemas import CandidateAnalysis

logger = get_logger(__name__)
settings = get_settings()

_client: AsyncOpenAI | None = None


def get_openai_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


# ── Embeddings ────────────────────────────────────────────────────────────────

async def get_embedding(text: str, retries: int = 3) -> list[float]:
    """
    Return a normalised embedding vector for the given text.
    Truncates to 8 000 characters to stay within token limits.
    """
    text = text[:8000].replace("\n", " ")
    client = get_openai_client()

    for attempt in range(1, retries + 1):
        try:
            response = await client.embeddings.create(
                model=settings.OPENAI_EMBEDDING_MODEL,
                input=text,
            )
            return response.data[0].embedding
        except RateLimitError:
            wait = 2 ** attempt
            logger.warning("Rate limit hit on embedding call; retrying in %ds (attempt %d).", wait, attempt)
            await asyncio.sleep(wait)
        except APIError as exc:
            logger.error("OpenAI APIError on embedding: %s", exc)
            raise

    raise RuntimeError("Failed to obtain embedding after retries.")


async def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Fetch embeddings for multiple texts concurrently."""
    tasks = [get_embedding(t) for t in texts]
    return await asyncio.gather(*tasks)


# ── Similarity ────────────────────────────────────────────────────────────────

def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Pure Python cosine similarity. Returns value in [0, 1]."""
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    mag_a = sum(a ** 2 for a in vec_a) ** 0.5
    mag_b = sum(b ** 2 for b in vec_b) ** 0.5
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def similarity_to_score(similarity: float) -> float:
    """Map cosine similarity [0–1] → match score [0–100], rounded to 1 dp."""
    return round(max(0.0, min(100.0, similarity * 100)), 1)


# ── Candidate Analysis ────────────────────────────────────────────────────────

_ANALYSIS_SYSTEM_PROMPT = """\
You are an expert recruitment consultant producing structured candidate assessments.
Respond ONLY with a valid JSON object — no markdown, no explanation, no trailing text.

JSON schema (all fields required):
{
  "name": "<inferred full name from CV, or 'Unknown Candidate'>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "gaps": ["<gap 1>", "<gap 2>"],
  "summary": "<3 sentences as specified below>"
}

SUMMARY RULES — follow these exactly:
- Sentence 1: State the candidate's seniority, background, and primary area of expertise.
- Sentence 2: Describe their strongest alignment with the ESSENTIAL skills and CORE RESPONSIBILITIES only.
- Sentence 3: If there is an ESSENTIAL gap → name it clearly and say it should be explored at interview.
              If there are NO essential gaps → do NOT manufacture a concern. Instead state: 
              "Their profile aligns well with the core requirements; any areas for development 
              relate to desirable preferences rather than essential criteria."

GAPS RULES — critical:
- Only list items from the ESSENTIAL SKILLS section as gaps if they are genuinely absent.
- Items from the DESIRABLE section that are missing must be labelled "(desirable)" in the gap text.
- Never frame a missing desirable item as a concern or weakness.
- If all essential criteria are met, the gaps list should contain at most one item 
  labelled "(desirable)". Do not pad gaps with desirable absences.
- Example of correct desirable gap: "No logistics sector background (desirable, not required)"
- Example of correct essential gap: "No demonstrable complaint handling experience"

STRENGTHS RULES:
- 2–4 concise bullet points, each ≤ 12 words
- Focus on what the candidate demonstrates against essential and responsibility criteria

Do NOT include any text outside the JSON object.
"""

_ANALYSIS_USER_TEMPLATE = """\
ESSENTIAL SKILLS (must-have requirements):
{essential}

CORE RESPONSIBILITIES (day-to-day duties):
{responsibility}

DESIRABLE CRITERIA (nice-to-have, absence is not a concern):
{desirable}

---

CANDIDATE CV:
{cv_text}

---

SCORING CONTEXT (use to calibrate your summary tone):
- Essential skills match: {essential_score}%
- Core responsibilities match: {responsibility_score}%
- Desirable criteria match: {desirable_score}%
- Overall role match: {final_score}%
- Hiring signal: {confidence_label}

If essential match is 85% or above, do NOT express concern about desirable gaps.
If essential match is below 70%, clearly flag which essential criteria appear absent.
"""


async def analyse_candidate(
    job_description: str,
    cv_text: str,
    retries: int = 2,
    essential: str = "",
    responsibility: str = "",
    desirable: str = "",
    essential_score: float = 0.0,
    responsibility_score: float = 0.0,
    desirable_score: float = 0.0,
    final_score: float = 0.0,
    confidence_label: str = "",
) -> CandidateAnalysis:
    """
    Ask GPT to produce a structured JSON analysis of the candidate.
    Receives pre-computed section scores so the prompt can calibrate
    summary tone accurately (essential gap vs desirable gap).
    Falls back to a safe default CandidateAnalysis on failure.
    """
    client = get_openai_client()

    # Use section-split prompt when sections are available;
    # fall back to full JD when called without sections (e.g. tests).
    if essential or responsibility or desirable:
        prompt = _ANALYSIS_USER_TEMPLATE.format(
            essential=essential[:1500] or "(not specified)",
            responsibility=responsibility[:1500] or "(not specified)",
            desirable=desirable[:800] or "(none listed)",
            cv_text=cv_text[:3500],
            essential_score=round(essential_score, 1),
            responsibility_score=round(responsibility_score, 1),
            desirable_score=round(desirable_score, 1),
            final_score=round(final_score, 1),
            confidence_label=confidence_label or "Not calculated",
        )
    else:
        # Legacy fallback: full JD, no scoring context
        prompt = f"JOB DESCRIPTION:\n{job_description[:3000]}\n\n---\n\nCANDIDATE CV:\n{cv_text[:4000]}"

    for attempt in range(1, retries + 1):
        try:
            response = await client.chat.completions.create(
                model=settings.OPENAI_CHAT_MODEL,
                messages=[
                    {"role": "system", "content": _ANALYSIS_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                max_tokens=700,
                response_format={"type": "json_object"},
            )
            raw = response.choices[0].message.content or "{}"
            data: dict[str, Any] = json.loads(raw)
            return CandidateAnalysis(**data)

        except (json.JSONDecodeError, Exception) as exc:
            logger.warning(
                "AI analysis attempt %d failed: %s", attempt, exc, exc_info=True
            )
            if attempt == retries:
                break
            await asyncio.sleep(1)

    # Graceful fallback — screening still completes without AI summary
    logger.error("AI analysis failed after %d attempts; returning fallback.", retries)
    return CandidateAnalysis(
        name=_infer_name_heuristic(cv_text),
        strengths=["Analysis unavailable"],
        gaps=["Analysis unavailable"],
        summary="AI analysis could not be completed for this candidate. Please review the CV manually.",
    )


def _infer_name_heuristic(cv_text: str) -> str:
    """
    Simple heuristic: the candidate's name is often the first non-empty line.
    Returns 'Unknown Candidate' as fallback.
    """
    for line in cv_text.splitlines():
        stripped = line.strip()
        # Name-like: 2–4 words, each starting with capital, no digits
        words = stripped.split()
        if 2 <= len(words) <= 4 and all(w[0].isupper() and w.isalpha() for w in words):
            return stripped
    return "Unknown Candidate"


# ── Concurrent Batch Analysis ─────────────────────────────────────────────────

async def analyse_candidates_batch(
    job_description: str,
    cv_texts: list[str],
    concurrency: int = 5,
    essential: str = "",
    responsibility: str = "",
    desirable: str = "",
    section_scores: list | None = None,
) -> list[CandidateAnalysis]:
    """
    Run AI analysis for all CVs concurrently, capped at `concurrency` parallel calls.

    When section text and scores are provided (normal pipeline), each candidate's
    summary is calibrated with accurate essential/desirable score context.
    Falls back to legacy full-JD mode when called without section data.
    """
    semaphore = asyncio.Semaphore(concurrency)

    async def _bounded(cv_text: str, scores) -> CandidateAnalysis:
        async with semaphore:
            if scores is not None:
                return await analyse_candidate(
                    job_description=job_description,
                    cv_text=cv_text,
                    essential=essential,
                    responsibility=responsibility,
                    desirable=desirable,
                    essential_score=scores.essential_score,
                    responsibility_score=scores.responsibility_score,
                    desirable_score=scores.desirable_score,
                    final_score=scores.final_score,
                    confidence_label=scores.confidence_label,
                )
            else:
                return await analyse_candidate(
                    job_description=job_description,
                    cv_text=cv_text,
                )

    if section_scores and len(section_scores) == len(cv_texts):
        tasks = [_bounded(cv, sc) for cv, sc in zip(cv_texts, section_scores)]
    else:
        tasks = [_bounded(cv, None) for cv in cv_texts]

    return await asyncio.gather(*tasks)
