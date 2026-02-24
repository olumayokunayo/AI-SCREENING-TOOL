from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, patch

from app.services.ai_service import (
    cosine_similarity,
    similarity_to_score,
    _infer_name_heuristic,
)
from app.schemas.schemas import CandidateAnalysis


# ── cosine_similarity ─────────────────────────────────────────────────────────

def test_cosine_similarity_identical():
    vec = [1.0, 0.0, 0.0]
    assert cosine_similarity(vec, vec) == pytest.approx(1.0)


def test_cosine_similarity_orthogonal():
    assert cosine_similarity([1.0, 0.0], [0.0, 1.0]) == pytest.approx(0.0)


def test_cosine_similarity_zero_vector():
    assert cosine_similarity([0.0, 0.0], [1.0, 1.0]) == 0.0


# ── similarity_to_score ───────────────────────────────────────────────────────

def test_similarity_to_score_full():
    assert similarity_to_score(1.0) == 100.0


def test_similarity_to_score_zero():
    assert similarity_to_score(0.0) == 0.0


def test_similarity_to_score_clamps_above():
    assert similarity_to_score(1.5) == 100.0


def test_similarity_to_score_clamps_below():
    assert similarity_to_score(-0.1) == 0.0


# ── _infer_name_heuristic ─────────────────────────────────────────────────────

def test_infer_name_two_word():
    cv = "John Smith\nSoftware Engineer\n5 years experience"
    assert _infer_name_heuristic(cv) == "John Smith"


def test_infer_name_fallback():
    cv = "1234 unknown content here\nno names\n!!!"
    assert _infer_name_heuristic(cv) == "Unknown Candidate"


# ── analyse_candidate (mocked) ────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_analyse_candidate_returns_analysis():
    mock_response = {
        "name": "Alice Thornton",
        "strengths": ["Strong Python skills", "5 years FastAPI"],
        "gaps": ["No cloud experience"],
        "summary": "Alice is a backend engineer. She aligns well with API roles. Her main gap is cloud infrastructure.",
    }

    with patch("app.services.ai_service.get_openai_client") as mock_client_fn:
        mock_client = AsyncMock()
        mock_client_fn.return_value = mock_client

        import json
        mock_message = AsyncMock()
        mock_message.content = json.dumps(mock_response)
        mock_choice = AsyncMock()
        mock_choice.message = mock_message
        mock_completion = AsyncMock()
        mock_completion.choices = [mock_choice]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_completion)

        from app.services.ai_service import analyse_candidate
        result = await analyse_candidate("Build REST APIs", "Alice Thornton - Python developer")

    assert isinstance(result, CandidateAnalysis)
    assert result.name == "Alice Thornton"
    assert len(result.strengths) == 2
    assert len(result.gaps) == 1
