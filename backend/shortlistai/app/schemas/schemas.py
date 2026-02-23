"""
app/schemas/schemas.py
Pydantic v2 request and response schemas.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: Optional[str] = Field(None, max_length=255)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Candidate ─────────────────────────────────────────────────────────────────

class CandidateResponse(BaseModel):
    id: uuid.UUID
    name: str
    rank: int
    match_score: float = Field(ge=0, le=100)
    strengths: List[str]
    gaps: List[str]
    summary: Optional[str]
    file_name: Optional[str]
    scoring: Optional["ScoringBreakdown"] = None

    model_config = {"from_attributes": True}


# ── Screening ─────────────────────────────────────────────────────────────────

class ScreeningListItem(BaseModel):
    id: uuid.UUID
    role_title: Optional[str]
    candidate_count: int
    top_match_score: Optional[float]
    average_match_score: Optional[float]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ScreeningDetailResponse(BaseModel):
    id: uuid.UUID
    role_title: Optional[str]
    job_description: str
    candidate_count: int
    top_match_score: Optional[float]
    average_match_score: Optional[float]
    status: str
    created_at: datetime
    candidates: List[CandidateResponse]

    model_config = {"from_attributes": True}


class ScreeningListResponse(BaseModel):
    total: int
    items: List[ScreeningListItem]


# ── Internal / AI ─────────────────────────────────────────────────────────────

class CandidateAnalysis(BaseModel):
    """Parsed output from the OpenAI structured summary call."""
    name: str
    strengths: List[str] = Field(default_factory=list)
    gaps: List[str] = Field(default_factory=list)
    summary: str

    @field_validator("strengths", "gaps", mode="before")
    @classmethod
    def ensure_list(cls, v):
        if isinstance(v, str):
            return [v]
        return v or []


# ── Scoring breakdown ─────────────────────────────────────────────────────────

class ScoringBreakdown(BaseModel):
    """
    Per-candidate scoring detail from the weighted section scorer.
    Passed through to the API response so the frontend can surface
    transparency about how the match score was calculated.
    """
    essential_score: float = Field(ge=0, le=100)
    responsibility_score: float = Field(ge=0, le=100)
    desirable_score: float = Field(ge=0, le=100)
    confidence_label: str


# ── Errors ────────────────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    detail: str
