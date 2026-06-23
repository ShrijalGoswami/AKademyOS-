# akademy38

Monorepo skeleton: Python **FastAPI** backend + **Next.js** frontend, with a `supabase/` folder reserved for database/auth configuration.

## Structure

```
akademy38/
├── backend/    # FastAPI app (Python venv)
├── frontend/   # Next.js 14 app (App Router, TypeScript, Tailwind)
└── supabase/   # Supabase config (reserved)
```

## Setup

### Backend

```bash
cd backend
python -m venv venv
# Windows (PowerShell):
venv\Scripts\Activate.ps1
# macOS / Linux:
# source venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env   # then fill in real values
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # then fill in real values
```

## Run

### Backend

```bash
cd backend
# activate venv first (see Setup)
uvicorn app.main:app --reload
# health check: http://127.0.0.1:8000/health
```

### Frontend

```bash
cd frontend
npm run dev
# http://localhost:3000
```

## Environment variables

- `backend/.env.example` — `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_JWT_SECRET` (required), `TUTOR_URL`, `TUTOR_API_KEY` (optional)
- `frontend/.env.local.example` — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Copy each `*.example` to its real counterpart (`backend/.env`, `frontend/.env.local`) and paste in values; the real files are git-ignored. The backend validates required keys on startup via `app/core/config.py` and fails fast if any are missing.
