"""
app/services/scorer.py

Weighted scoring engine for ShortlistAI.

Design:
  - Embeds each JD section (essential, responsibility, desirable) independently.
  - Scores the CV against each section via cosine similarity.
  - Applies a 55 / 30 / 15 weighted formula.
  - Desirable is additive only — zero desirable match does NOT penalise the score.
  - Applies a score floor: if essential_score ≥ 90%, final score cannot fall below 78.
  - Returns a SectionScores dataclass with all three sub-scores + final.

Why independent embeddings?
  Embedding the whole JD as one vector collapses essential and desirable into
  a single undifferentiated signal. A candidate who perfectly matches all
  essential criteria but has no industry background (listed as desirable) gets
  an artificially low cosine similarity because the desirable terms are absent
  from their CV. Splitting and weighting fixes this precisely.
"""
from __future__ import annotations

from dataclasses import dataclass

from app.core.logging import get_logger
from app.services.ai_service import cosine_similarity, get_embedding, get_embeddings_batch
from app.services.jd_parser import ParsedJD

logger = get_logger(__name__)

# ── Weight constants ──────────────────────────────────────────────────────────

WEIGHT_ESSENTIAL = 0.55
WEIGHT_RESPONSIBILITY = 0.30
WEIGHT_DESIRABLE = 0.15

# Score floor: if a candidate clears essential criteria, do not penalise
# them below this value even if desirable score is zero.
ESSENTIAL_FLOOR_THRESHOLD = 0.80   # essential_score (0–1) that triggers the floor
SCORE_FLOOR = 74.0                  # minimum final score when threshold is met

# Sigmoid rescaling constants.
# When a JD is split into three short sections (~100-300 words each), cosine
# similarities against a full CV are much lower than whole-document comparisons —
# typically 0.20-0.60 rather than 0.60-0.95. A hard clip at 0.50 (the old value)
# zeroed out virtually every score, causing the 9% bug.
#
# A sigmoid maps the meaningful short-section range to a recruiter-friendly 0-100:
#   raw=0.10 → ~5%    (clearly unrelated)
#   raw=0.28 → ~30%   (weak match)
#   raw=0.35 → ~50%   (moderate match — sigmoid midpoint)
#   raw=0.45 → ~77%   (good match)
#   raw=0.55 → ~92%   (strong match)
SIGMOID_MIDPOINT = 0.35   # similarity value that maps to 50%
SIGMOID_STEEPNESS = 12    # controls how sharply the curve rises


@dataclass
class SectionScores:
    essential_score: float       # 0–100, similarity of CV to essential section
    responsibility_score: float  # 0–100
    desirable_score: float       # 0–100
    final_score: float           # 0–100, weighted composite
    confidence_label: str        # human-readable hiring signal


# ── Similarity rescaling ──────────────────────────────────────────────────────

def _sim_to_pct(raw: float) -> float:
    """
    Map raw cosine similarity to a recruiter-friendly 0–100 score using a sigmoid.

    Why sigmoid instead of linear rescaling:
    Short JD sections (100–300 words) produce cosine similarities in the 0.20–0.60
    range against full CVs — far lower than the 0.60–0.95 range seen with
    whole-document comparisons. A linear clip at 0.50 zeroed out most scores
    (the root cause of 9% scores). The sigmoid handles the full range gracefully:
    low similarities stay low, high similarities score high, with a smooth curve
    that separates candidates meaningfully in the middle.
    """
    import math
    sigmoid = 1 / (1 + math.exp(-SIGMOID_STEEPNESS * (raw - SIGMOID_MIDPOINT)))
    return round(sigmoid * 100, 1)


# ── Confidence label ──────────────────────────────────────────────────────────

def _assign_confidence(
    final: float,
    essential_pct: float,
    has_essential_section: bool,
) -> str:
    """
    Derive a recruiter-facing decision signal from the scores.

    Priority: essential gaps are named explicitly. Desirable-only gaps
    are treated as development areas, not concerns.
    """
    if not has_essential_section:
        # No essential section was parsed — fall back to final score only
        if final >= 80:
            return "Strong match — recommend for interview"
        elif final >= 65:
            return "Moderate match — consider for interview"
        else:
            return "Weak match — review carefully before progressing"

    if essential_pct >= 90:
        if final >= 82:
            return "Strong match — recommend for interview"
        elif final >= 72:
            return "Good match — recommend for interview"
        else:
            return "Good match — minor development areas noted"
    elif essential_pct >= 70:
        return "Partial match — one or more essential criteria require exploration at interview"
    else:
        return "Weak match — significant gaps against essential requirements"


# ── Main scorer ───────────────────────────────────────────────────────────────

async def score_cv_against_jd(
    cv_text: str,
    parsed_jd: ParsedJD,
    cv_embedding: list[float],
) -> SectionScores:
    """
    Score a single CV against a pre-parsed JD.

    cv_embedding is passed in (already computed) to avoid redundant API calls.
    JD section embeddings are fetched here; in a batch context, callers may
    prefer to pre-compute them — see score_cvs_batch() below.
    """
    sections = [
        parsed_jd.essential,
        parsed_jd.responsibility,
        parsed_jd.desirable,
    ]

    # Embed only non-empty sections; use a zero score for absent sections.
    texts_to_embed = [s for s in sections if s.strip()]
    if not texts_to_embed:
        logger.warning("All JD sections empty — returning zero scores.")
        return SectionScores(
            essential_score=0.0,
            responsibility_score=0.0,
            desirable_score=0.0,
            final_score=0.0,
            confidence_label="Unable to score — job description could not be parsed.",
        )

    embeddings = await get_embeddings_batch(texts_to_embed)
    emb_iter = iter(embeddings)

    essential_pct = 0.0
    responsibility_pct = 0.0
    desirable_pct = 0.0

    if parsed_jd.essential.strip():
        essential_pct = _sim_to_pct(cosine_similarity(next(emb_iter), cv_embedding))
    if parsed_jd.responsibility.strip():
        responsibility_pct = _sim_to_pct(cosine_similarity(next(emb_iter), cv_embedding))
    if parsed_jd.desirable.strip():
        desirable_pct = _sim_to_pct(cosine_similarity(next(emb_iter), cv_embedding))

    # Weighted base (essential + responsibility only, 55+30 = 85 max before bonus)
    base = (essential_pct * WEIGHT_ESSENTIAL) + (responsibility_pct * WEIGHT_RESPONSIBILITY)

    # Desirable is additive — zero desirable = 0 bonus, not a penalty
    bonus = desirable_pct * WEIGHT_DESIRABLE

    raw_final = min(100.0, base + bonus)

    # Apply score floor: strong essential match cannot be unfairly penalised
    # by missing desirable criteria.
    has_essential = bool(parsed_jd.essential.strip())
    essential_ratio = essential_pct / 100.0

    if has_essential and essential_ratio >= ESSENTIAL_FLOOR_THRESHOLD:
        final = max(raw_final, SCORE_FLOOR)
    else:
        final = raw_final

    final = round(final, 1)

    confidence = _assign_confidence(final, essential_pct, has_essential)

    logger.debug(
        "Score — essential=%.1f%% responsibility=%.1f%% desirable=%.1f%% "
        "base=%.1f bonus=%.1f final=%.1f [%s]",
        essential_pct, responsibility_pct, desirable_pct, base, bonus, final, confidence,
    )

    return SectionScores(
        essential_score=essential_pct,
        responsibility_score=responsibility_pct,
        desirable_score=desirable_pct,
        final_score=final,
        confidence_label=confidence,
    )


async def score_cvs_batch(
    cv_texts: list[str],
    parsed_jd: ParsedJD,
) -> list[SectionScores]:
    """
    Score all CVs against the parsed JD efficiently.

    Strategy:
      1. Embed all CVs concurrently (single batch call).
      2. Embed JD sections once, reuse across all CVs.
      3. Compute scores purely in Python (no further API calls).
    """
    import asyncio

    # Embed all CVs and all JD sections concurrently
    jd_sections = [s for s in [parsed_jd.essential, parsed_jd.responsibility, parsed_jd.desirable] if s.strip()]
    all_texts = cv_texts + jd_sections

    all_embeddings = await get_embeddings_batch(all_texts)

    cv_embeddings = all_embeddings[:len(cv_texts)]
    jd_embeddings = all_embeddings[len(cv_texts):]

    # Map section embeddings back to their category
    jd_emb_iter = iter(jd_embeddings)
    essential_emb = next(jd_emb_iter) if parsed_jd.essential.strip() else None
    responsibility_emb = next(jd_emb_iter) if parsed_jd.responsibility.strip() else None
    desirable_emb = next(jd_emb_iter) if parsed_jd.desirable.strip() else None

    has_essential = essential_emb is not None

    results: list[SectionScores] = []
    for cv_emb in cv_embeddings:
        essential_pct = _sim_to_pct(cosine_similarity(essential_emb, cv_emb)) if essential_emb else 0.0
        responsibility_pct = _sim_to_pct(cosine_similarity(responsibility_emb, cv_emb)) if responsibility_emb else 0.0
        desirable_pct = _sim_to_pct(cosine_similarity(desirable_emb, cv_emb)) if desirable_emb else 0.0

        base = (essential_pct * WEIGHT_ESSENTIAL) + (responsibility_pct * WEIGHT_RESPONSIBILITY)
        bonus = desirable_pct * WEIGHT_DESIRABLE
        raw_final = min(100.0, base + bonus)

        essential_ratio = essential_pct / 100.0
        if has_essential and essential_ratio >= ESSENTIAL_FLOOR_THRESHOLD:
            final = round(max(raw_final, SCORE_FLOOR), 1)
        else:
            final = round(raw_final, 1)

        confidence = _assign_confidence(final, essential_pct, has_essential)

        results.append(SectionScores(
            essential_score=essential_pct,
            responsibility_score=responsibility_pct,
            desirable_score=desirable_pct,
            final_score=final,
            confidence_label=confidence,
        ))

    return results
