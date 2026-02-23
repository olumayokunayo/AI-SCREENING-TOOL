"""
app/services/jd_parser.py

Classifies a raw job description into three scored sections:
  - essential   : hard requirements the candidate must meet
  - responsibility : core duties and day-to-day tasks
  - desirable   : nice-to-have preferences, industry background, bonuses

The output is used by scorer.py to embed each section independently
so that desirable criteria cannot drag down a candidate who meets all
essential and responsibility criteria.
"""
from __future__ import annotations

import json
from dataclasses import dataclass

from app.core.logging import get_logger
from app.services.ai_service import get_openai_client
from app.core.config import get_settings

logger = get_logger(__name__)
settings = get_settings()


@dataclass
class ParsedJD:
    essential: str        # concatenated text of essential criteria
    responsibility: str   # concatenated text of core responsibilities
    desirable: str        # concatenated text of desirable/nice-to-have criteria
    raw: str              # original job description, kept for summary prompt


# ── Prompt ────────────────────────────────────────────────────────────────────

_PARSER_SYSTEM_PROMPT = """\
You are a recruitment analyst. Your task is to parse a job description and classify \
every requirement or bullet point into exactly one of three categories.

CATEGORIES:
1. essential   — Hard requirements. The candidate MUST meet these to be considered.
                 Signals: "must have", "required", "essential", "minimum X years",
                 hard skills listed without qualification, professional qualifications
                 that are non-negotiable, core behavioural requirements.

2. responsibility — The actual job tasks and day-to-day duties.
                 Signals: action verbs describing what the person will DO
                 (manage, handle, resolve, respond, maintain, support, report).
                 These describe job performance, not pre-conditions.

3. desirable   — Nice-to-have preferences. Absence does NOT disqualify.
                 Signals: "desirable", "advantageous", "preferred", "ideally",
                 "would be beneficial", "experience in X is an advantage",
                 industry-specific background mentioned as context,
                 degree-level qualifications for roles that do not require a degree.

RULES:
- Classify every meaningful requirement. Do not skip any.
- Industry background or sector experience listed WITHOUT "required/essential" → desirable.
- If a section header says "Desirable" or "Nice to Have", all bullets beneath it → desirable.
- If a section header says "Essential" or "Requirements", all bullets beneath it → essential.
- Responsibilities section bullets → responsibility.
- When in doubt between essential and desirable: default to desirable.

Respond ONLY with a valid JSON object, no markdown, no explanation:
{
  "essential": "<all essential criteria joined as plain text, one item per line>",
  "responsibility": "<all responsibility items joined as plain text, one item per line>",
  "desirable": "<all desirable items joined as plain text, one item per line>"
}

If a section has no content, return an empty string for that key.
"""


# ── Parser ────────────────────────────────────────────────────────────────────

async def parse_job_description(job_description: str) -> ParsedJD:
    """
    Ask the LLM to classify the JD into three sections.
    Falls back to treating the entire JD as essential+responsibility
    (no desirable) on failure — conservative, never silently broken.
    """
    client = get_openai_client()

    try:
        response = await client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": _PARSER_SYSTEM_PROMPT},
                {"role": "user", "content": job_description[:4000]},
            ],
            temperature=0.0,
            max_tokens=1500,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or "{}"
        data: dict = json.loads(raw)

        essential = str(data.get("essential", "")).strip()
        responsibility = str(data.get("responsibility", "")).strip()
        desirable = str(data.get("desirable", "")).strip()

        # Sanity check: if the parser returned everything as desirable
        # and left essential empty, treat responsibility as essential too
        # so we don't accidentally score a full JD as 0% essential.
        if not essential and not responsibility:
            logger.warning("JD parser returned empty essential+responsibility; using full JD as fallback.")
            essential = job_description
            responsibility = ""
            desirable = ""

        logger.info(
            "JD parsed — essential: %d chars, responsibility: %d chars, desirable: %d chars",
            len(essential), len(responsibility), len(desirable),
        )

        return ParsedJD(
            essential=essential,
            responsibility=responsibility,
            desirable=desirable,
            raw=job_description,
        )

    except Exception as exc:
        # Never let a parser failure kill the screening.
        # Fall back: treat full JD as essential/responsibility, no desirable section.
        logger.error("JD parsing failed (%s); falling back to full-JD scoring.", exc)
        return ParsedJD(
            essential=job_description,
            responsibility="",
            desirable="",
            raw=job_description,
        )
