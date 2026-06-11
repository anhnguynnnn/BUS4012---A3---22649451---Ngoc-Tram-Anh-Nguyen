# MUSÉ Backend — Phase 1

Minimal FastAPI backend for the MUSÉ fashion discovery app.

This phase implements **authentication only** using the **Supabase Auth REST API**. It does not implement posts, saved posts, albums, onboarding storage, or matching logic yet.

## Tech Stack

- Python 3.11+
- FastAPI
- Uvicorn
- httpx
- Supabase Auth REST API

## File Structure

```text
backend/
  app/
    main.py
    config.py
    supabase_auth.py
    models.py
  requirements.txt
  .env.example
  README.md
```

## Environment Variables

Copy the example file and fill in your own Supabase project values:

```bash
cp .env.example .env
```

```env
# Required for /auth/signup and /auth/login.
# SUPABASE_URL must be in this format: https://<project-ref>.supabase.co
SUPABASE_URL=
SUPABASE_ANON_KEY=
FRONTEND_ORIGIN=http://localhost:5173
```

Do not commit real secrets.

## Setup

Run these commands from the `backend` folder:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API will run at:

```text
http://localhost:8000
```

## Endpoints

### Health Check

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

### Signup

Calls Supabase Auth:

```text
POST {SUPABASE_URL}/auth/v1/signup
```

Test locally:

```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@gmail.com","password":"password123","full_name":"MUSÉ User"}'
```

Request body:

```json
{
  "email": "user@gmail.com",
  "password": "password123",
  "full_name": "MUSÉ User"
}
```

`full_name` is optional and is sent to Supabase as user metadata.

### Login

Calls Supabase Auth:

```text
POST {SUPABASE_URL}/auth/v1/token?grant_type=password
```

Test locally:

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@gmail.com","password":"password123"}'
```

Successful response includes:

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 3600,
  "token_type": "bearer",
  "user": {}
}
```

## Notes for Learning

- This backend uses Supabase Auth via REST API, not the Supabase SDK.
- CORS is configured for the Vite frontend at `http://localhost:5173`.
- Authentication is intentionally simple for Phase 1.
- Future phases can add onboarding storage, posts feed APIs, saved posts, albums, and matching-based ranking.