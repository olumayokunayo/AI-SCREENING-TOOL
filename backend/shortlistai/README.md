# ShortlistAI — Backend API

AI-powered recruitment shortlisting backend built with **FastAPI**, **PostgreSQL**, and **OpenAI**.

---

## Project Structure

```
shortlistai/
├── app/
│   ├── core/
│   │   ├── config.py         # Pydantic settings (env vars)
│   │   ├── database.py       # Async SQLAlchemy engine + session
│   │   ├── logging.py        # Structured logging config
│   │   └── security.py       # JWT + bcrypt utilities
│   ├── models/
│   │   └── models.py         # SQLAlchemy ORM models (User, Screening, Candidate)
│   ├── routers/
│   │   ├── auth.py           # /auth — register, login, me
│   │   └── screenings.py     # /screenings — create, list, detail, export
│   ├── schemas/
│   │   └── schemas.py        # Pydantic v2 request/response models
│   ├── services/
│   │   ├── ai_service.py     # OpenAI embeddings + structured GPT analysis
│   │   ├── auth_service.py   # User registration, login, JWT dependency
│   │   ├── export_service.py # CSV export generation
│   │   └── screening_service.py  # Full screening pipeline orchestrator
│   ├── utils/
│   │   └── file_parser.py    # PDF/DOCX text extraction + validation
│   └── main.py               # FastAPI app factory + lifespan
├── tests/
│   ├── test_auth.py          # Auth endpoint integration tests
│   └── test_ai_service.py    # AI utility unit tests
├── alembic.ini
├── pyproject.toml
├── requirements.txt
├── .env.example
└── README.md
```

---

## Prerequisites

- Python 3.11+
- PostgreSQL 14+
- An OpenAI API key

---

## Setup

### 1. Clone and create virtual environment

```bash
git clone https://github.com/your-org/shortlistai-api.git
cd shortlistai-api
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your actual values:
#   DATABASE_URL  — your PostgreSQL connection string
#   SECRET_KEY    — random 32+ character string
#   OPENAI_API_KEY — your OpenAI key
```

### 4. Create the PostgreSQL database

```bash
createdb shortlistai_db
# Or via psql:
psql -U postgres -c "CREATE DATABASE shortlistai_db;"
```

### 5. Run the server

```bash
uvicorn app.main:app --reload --port 8000
```

The API is now live at **http://localhost:8000**

- Interactive docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health check: http://localhost:8000/health

---

## Running Tests

```bash
# Install test extras
pip install aiosqlite pytest-asyncio

# Run all tests
pytest tests/ -v
```

---

## API Reference

### Base URL

```
http://localhost:8000/api/v1
```

---

### Authentication

#### Register

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "recruiter@agency.com",
    "password": "securepassword123",
    "full_name": "Sarah Mitchell"
  }'
```

**Response:**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "email": "recruiter@agency.com",
  "full_name": "Sarah Mitchell",
  "created_at": "2025-02-21T10:00:00Z"
}
```

---

#### Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "recruiter@agency.com",
    "password": "securepassword123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

---

#### Get current user

```bash
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Screenings

#### Create a screening (POST /screenings)

```bash
curl -X POST http://localhost:8000/api/v1/screenings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "job_description=We are looking for a Senior React Developer with 5+ years experience building scalable SaaS products. Must have TypeScript, REST APIs, and experience leading small teams." \
  -F "cvs=@/path/to/cv1.pdf" \
  -F "cvs=@/path/to/cv2.docx" \
  -F "cvs=@/path/to/cv3.pdf"
```

**Response:**
```json
{
  "id": "abc123...",
  "role_title": "Senior React Developer",
  "job_description": "We are looking for...",
  "candidate_count": 3,
  "top_match_score": 91.2,
  "average_match_score": 78.4,
  "status": "complete",
  "created_at": "2025-02-21T10:05:00Z",
  "candidates": [
    {
      "id": "...",
      "name": "Priya Kapoor",
      "rank": 1,
      "match_score": 91.2,
      "strengths": ["8 yrs React/TypeScript", "Led teams of 10+", "FinTech background"],
      "gaps": ["No GraphQL experience"],
      "summary": "Priya is a senior frontend engineer with deep TypeScript expertise. She aligns strongly with the team leadership and product scale requirements. Her only notable gap is GraphQL, which can be assessed at technical interview.",
      "file_name": "priya_kapoor_cv.pdf"
    }
  ]
}
```

---

#### List screenings (GET /screenings)

```bash
curl "http://localhost:8000/api/v1/screenings?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### Get screening detail (GET /screenings/{id})

```bash
curl http://localhost:8000/api/v1/screenings/abc123-... \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### Export CSV (GET /screenings/{id}/export)

```bash
curl http://localhost:8000/api/v1/screenings/abc123-.../export \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o shortlist_export.csv
```

---

## Architecture Notes

### Separation of Concerns

| Layer | Responsibility |
|---|---|
| `routers/` | HTTP concerns only: parse request, call service, return response |
| `services/` | Business logic, orchestration, DB queries |
| `models/` | SQLAlchemy ORM schema |
| `schemas/` | Pydantic I/O contracts |
| `utils/` | Pure utilities (file parsing) |
| `core/` | Infrastructure (config, DB, security, logging) |

### AI Pipeline

1. Extract text from each uploaded CV (pdfplumber / python-docx)
2. Delete the raw file immediately from disk
3. Generate embedding for the job description
4. Generate embeddings for all CVs concurrently (asyncio.gather)
5. Compute cosine similarity → normalise to 0–100 score
6. Run GPT analysis per candidate concurrently (semaphore-bounded at 5)
7. Persist screening + candidates to PostgreSQL (raw CV text never stored)
8. Return ranked results

### Security

- Uploaded files deleted immediately after text extraction
- Raw CV text never persisted to the database
- File type validation by extension and content-type
- 10 MB per-file size limit (configurable)
- JWT with configurable expiry
- Bcrypt password hashing

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL async connection string |
| `SECRET_KEY` | ✅ | — | JWT signing key (32+ chars) |
| `OPENAI_API_KEY` | ✅ | — | OpenAI API key |
| `ALGORITHM` | | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | | `60` | JWT lifetime |
| `OPENAI_EMBEDDING_MODEL` | | `text-embedding-3-small` | Embedding model |
| `OPENAI_CHAT_MODEL` | | `gpt-4o-mini` | Analysis model |
| `MAX_FILE_SIZE_MB` | | `10` | Max CV file size |
| `UPLOAD_DIR` | | `/tmp/shortlistai_uploads` | Temp upload path |
| `APP_ENV` | | `development` | `development` or `production` |
| `LOG_LEVEL` | | `INFO` | Python log level |
| `CORS_ORIGINS` | | `["http://localhost:3000"]` | JSON array of allowed origins |

---

## Production Checklist

- [ ] Set `APP_ENV=production` (disables auto-migration, reduces SQL logging)
- [ ] Use Alembic for database migrations (`alembic upgrade head`)
- [ ] Set a strong random `SECRET_KEY` (at least 64 chars)
- [ ] Run behind HTTPS (nginx/Caddy reverse proxy)
- [ ] Set `UPLOAD_DIR` to a path outside `/tmp` with proper permissions
- [ ] Configure `CORS_ORIGINS` to your production frontend URL only
- [ ] Add rate limiting (slowapi or nginx)
- [ ] Monitor OpenAI API costs and set usage limits in the dashboard
