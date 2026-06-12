# MUSÉ — Deployment Failure Round 3 Report

**Date:** 12 June 2026  
**Error:** `Command "uv pip install" exited with 1` (persisted after Rounds 1 and 2)  
**Platform:** Vercel (Python Serverless Functions)

---

## Investigation Summary

### What Was Checked

| Check | Result |
|-------|--------|
| Root `requirements.txt` syntax | ✅ Clean — no bracket extras |
| `backend/requirements.txt` syntax | ✅ Clean — fixed in Round 2 |
| Other dependency files (`pyproject.toml`, `setup.py`, `Pipfile`) | ✅ None found in git |
| `backend/.venv/` tracked by git | ✅ Not tracked (properly gitignored) |
| `uv pip install` with root `requirements.txt` | ✅ Succeeds locally |
| `uv pip install` with `backend/requirements.txt` | ✅ Succeeds locally |
| Python imports match requirements | ✅ All dependencies covered |
| Frontend build (`npm run build`) | ✅ Passes |

### Root Cause (Round 3)

Vercel's Python serverless function runtime resolves dependencies from the **function's directory first**, then falls back to the project root. The function file is `api/index.py`, so Vercel looks for `api/requirements.txt` first.

**There was no `api/requirements.txt` file.**

While Vercel should fall back to the root `requirements.txt`, in practice, the dependency resolution can fail when:
1. The function imports code from a different directory (`backend/app/`)
2. Vercel's `uv` version or configuration expects `requirements.txt` in the function directory
3. The Vite framework detection (`"framework": "vite"` in `vercel.json`) changes how Vercel processes the Python function

---

## Fix Applied

### File Created: `api/requirements.txt`

```
fastapi==0.115.0
httpx==0.27.0
python-dotenv==1.0.1
pydantic==2.9.0
email-validator>=2.0.0
```

This is identical to the root `requirements.txt`. It ensures Vercel's Python runtime finds dependencies in the same directory as the function file (`api/index.py`).

---

## Complete Dependency Audit

### All Third-Party Python Imports (backend/app/**)

| Package | Where Used | In requirements.txt |
|---------|-----------|-------------------|
| `fastapi` | main.py, all routers, supabase_auth.py | ✅ `fastapi==0.115.0` |
| `fastapi.middleware.cors` | main.py (CORSMiddleware) | ✅ (part of fastapi) |
| `httpx` | supabase_auth.py, posts.py, interactions.py, recommendations.py | ✅ `httpx==0.27.0` |
| `pydantic` | models.py (BaseModel, EmailStr, Field, field_validator) | ✅ `pydantic==2.9.0` |
| `dotenv` (python-dotenv) | config.py, main.py | ✅ `python-dotenv==1.0.1` |
| `email_validator` | Transitive (required by pydantic.EmailStr) | ✅ `email-validator>=2.0.0` |

### Standard Library Imports (no action needed)

`os`, `re`, `pathlib`, `typing`, `sys`

### Packages NOT Needed for Vercel

| Package | Why Excluded |
|---------|-------------|
| `uvicorn` | Only used as CLI in Procfile for Railway. Vercel has its own ASGI runtime. |

---

## All Requirements.txt Files in Repository

| File | Location | Purpose | Status |
|------|----------|---------|--------|
| `requirements.txt` | Project root | Vercel serverless function deps (fallback) | ✅ Clean |
| `api/requirements.txt` | Function directory | Vercel serverless function deps (primary) | ✅ Created |
| `backend/requirements.txt` | Backend directory | Railway/local development deps | ✅ Clean |

---

## Verification

```
uv pip install -r requirements.txt (root)     ✅ 18 packages installed
uv pip install -r api/requirements.txt         ✅ 18 packages installed  
uv pip install -r backend/requirements.txt     ✅ 20 packages installed
npm run build (frontend)                       ✅ Built in 548ms
Python import check (all packages)             ✅ All importable
```

---

## Summary of All Fixes Across Rounds 1-3

| Round | File | Fix |
|-------|------|-----|
| 1 | `requirements.txt` (root) | Split `pydantic[email]` into `pydantic` + `email-validator` |
| 2 | `backend/requirements.txt` | Removed `[standard]` and `[email]` bracket extras |
| 3 | `api/requirements.txt` | Created — deps in function directory for Vercel runtime |

---

## Files Changed (Round 3)

| File | Action |
|------|--------|
| `api/requirements.txt` | **Created** — Python deps for Vercel function directory |

## Files NOT Changed

- All Python backend code
- All frontend code
- `api/index.py`
- `vercel.json`
- `requirements.txt` (root)
- `backend/requirements.txt`

---

## Verdict

**Fix applied.** Created `api/requirements.txt` in the function directory so Vercel's Python runtime can resolve dependencies directly. All three `requirements.txt` files use clean syntax with no bracket extras, verified with `uv pip install`.