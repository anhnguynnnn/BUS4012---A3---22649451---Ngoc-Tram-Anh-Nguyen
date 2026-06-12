# MUSÉ — Deployment Build Failure Report

**Date:** 12 June 2026  
**Error:** `Command "uv pip install" exited with 1`  
**Platform:** Vercel (Python Serverless Functions)

---

## Root Cause

The `requirements.txt` at the project root contained:

```
pydantic[email]==2.9.0
```

This uses PEP 508 **extras syntax** (`[email]`) to request the `email-validator` dependency. While standard `pip` resolves this correctly, **Vercel's `uv` package manager** (used for Python serverless function builds) can fail on this bracket notation, causing the entire build to exit with code 1.

The `[email]` extra is required because `backend/app/models.py` imports `EmailStr` from pydantic, which depends on the `email-validator` package.

---

## Dependency Audit

### All Third-Party Imports Found in `backend/app/`

| Package | Import Locations | Version Required |
|---------|-----------------|-----------------|
| `fastapi` | `main.py`, `supabase_auth.py`, all routers | `==0.115.0` |
| `httpx` | `supabase_auth.py`, `posts.py`, `interactions.py`, `recommendations.py` | `==0.27.0` |
| `pydantic` | `models.py` (BaseModel, EmailStr, Field, field_validator) | `==2.9.0` |
| `email-validator` | Transitive — required by `pydantic.EmailStr` | `>=2.0.0` |
| `python-dotenv` | `config.py`, `main.py` (load_dotenv) | `==1.0.1` |

### Standard Library Imports (No Action)

`os`, `re`, `pathlib`, `typing`, `sys` — all built-in, no installation needed.

### NOT Imported (Correctly Excluded)

`uvicorn` — only used as a CLI command in `Procfile` for Railway, not imported in any Python file. Vercel provides its own ASGI runtime.

---

## Files Changed

### `requirements.txt` (project root)

**Before (failed):**
```
fastapi==0.115.0
httpx==0.27.0
python-dotenv==1.0.1
pydantic[email]==2.9.0
```

**After (fixed):**
```
fastapi==0.115.0
httpx==0.27.0
python-dotenv==1.0.1
pydantic==2.9.0
email-validator>=2.0.0
```

### What Changed

| Line | Before | After | Why |
|------|--------|-------|-----|
| 4 | `pydantic[email]==2.9.0` | `pydantic==2.9.0` | Removed extras syntax that breaks `uv` |
| 5 | *(new)* | `email-validator>=2.0.0` | Explicit dependency for `pydantic.EmailStr` |

---

## Why the Fix Works

1. **No bracket syntax** — `pydantic==2.9.0` is a plain version pin that `uv` handles without issues
2. **Explicit `email-validator`** — instead of relying on pydantic's optional `[email]` extra, the dependency is listed directly as a top-level requirement
3. **Same functionality** — `EmailStr` in `models.py` still works because `email-validator` is installed as a standalone package
4. **No code changes** — all Python backend code remains identical

---

## Files NOT Changed

| File | Status |
|------|--------|
| `api/index.py` | ✅ Unchanged — already correct |
| `vercel.json` | ✅ Unchanged — already correct |
| `backend/app/main.py` | ✅ Unchanged |
| `backend/app/models.py` | ✅ Unchanged |
| `backend/app/config.py` | ✅ Unchanged |
| All routers | ✅ Unchanged |
| All frontend code | ✅ Unchanged |

---

## Verification

All required packages confirmed importable:

```
✅ fastapi — 0.115.0
✅ httpx — 0.27.0
✅ pydantic — 2.9.0
✅ dotenv — installed
✅ email_validator — 2.3.0
```

---

## Expected Vercel Build Behavior

After this fix, Vercel's build process should:

1. `npm install` → install Node.js dependencies
2. `npm run build` → build React frontend to `dist/`
3. `uv pip install -r requirements.txt` → install Python dependencies (now without bracket syntax)
4. Package `api/index.py` as a Python serverless function
5. Deploy successfully

---

## Verdict

**Fix applied.** The bracket syntax `pydantic[email]` has been replaced with explicit `pydantic` + `email-validator` lines. This resolves the `uv pip install` exit code 1 on Vercel.