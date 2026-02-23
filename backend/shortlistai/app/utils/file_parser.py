"""
app/utils/file_parser.py
Extract and clean plain text from PDF and DOCX files.
Uploaded files are deleted immediately after text extraction.
"""
from __future__ import annotations

import os
import re
import tempfile
from pathlib import Path

import aiofiles
from fastapi import UploadFile

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
}
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc"}


# ── Validation ────────────────────────────────────────────────────────────────

def validate_cv_file(file: UploadFile) -> None:
    """Raise ValueError if the file fails type or size constraints."""
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"'{file.filename}' has unsupported extension '{ext}'. "
            f"Accepted: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    # Content-type check (best-effort; clients can spoof)
    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        logger.warning(
            "Unexpected content-type '%s' for file '%s' — proceeding by extension.",
            file.content_type, file.filename,
        )


# ── Extraction ────────────────────────────────────────────────────────────────

def _extract_pdf(path: str) -> str:
    import pdfplumber

    text_parts: list[str] = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)


def _extract_docx(path: str) -> str:
    from docx import Document

    doc = Document(path)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paragraphs)


def _clean_text(raw: str) -> str:
    """Normalise whitespace, remove control characters, trim."""
    # Remove non-printable characters except newlines and tabs
    cleaned = re.sub(r"[^\x20-\x7E\n\t]", " ", raw)
    # Collapse multiple blank lines
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    # Collapse excessive spaces
    cleaned = re.sub(r" {3,}", " ", cleaned)
    return cleaned.strip()


async def extract_text_from_upload(file: UploadFile) -> tuple[str, str]:
    """
    Save the uploaded file to a temp path, extract text, then delete the file.
    Returns (filename, extracted_text).
    Raises ValueError for unsupported formats or empty content.
    """
    validate_cv_file(file)

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = Path(file.filename or "cv").suffix.lower() or ".pdf"

    # Read bytes and enforce size limit
    content = await file.read()
    if len(content) > settings.max_file_size_bytes:
        raise ValueError(
            f"'{file.filename}' exceeds the {settings.MAX_FILE_SIZE_MB} MB size limit."
        )

    tmp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(
            dir=settings.UPLOAD_DIR, suffix=ext, delete=False
        ) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        if ext == ".pdf":
            raw_text = _extract_pdf(tmp_path)
        elif ext in (".docx", ".doc"):
            raw_text = _extract_docx(tmp_path)
        else:
            raise ValueError(f"Unsupported file extension: {ext}")

        cleaned = _clean_text(raw_text)
        if not cleaned:
            raise ValueError(f"No readable text found in '{file.filename}'.")

        logger.info("Extracted %d chars from '%s'", len(cleaned), file.filename)
        return file.filename or "unknown.pdf", cleaned

    finally:
        # Always delete the temp file — do not store raw CV data
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
            logger.debug("Deleted temp file: %s", tmp_path)
