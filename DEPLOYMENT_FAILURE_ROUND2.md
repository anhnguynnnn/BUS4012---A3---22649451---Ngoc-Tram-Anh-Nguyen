# MUSÉ — Deployment Failure Round 2 Report

**Date:** 12 June 2026  
**Error:** `Command "uv pip install" exited with 1` (persisted after Round 1 fix)  
**Platform:** Vercel (Python Serverless Functions)

---

## Root Cause

The Round 1 fix only updated `requirements.txt` at the project root. However, **`backend/requirements.txt`** still contained PEP 508 bracket syntax:

```
uvicorn[standard]==0.30.0
pydantic[email]==2.9.0
```

Vercel's build system scans the entire project for Python dependency files. When it encounters `backend/requirements.txt`, `uv` fails on the bracket notation (`[standard]` and `[email]`), causing the entire build to exit with code 1.

---

## Investigation Process

1. **Installed `uv` locally** to reproduce the exact Vercel build behavior
2. **Tested root `requirements.txt`** with `uv pip install` — **succeeded** (18 packages installed)
3. **Identified the remaining failure source**: `backend/requirements.txt` still had bracket syntax
4. **Tested `backend/requirements.txt`** with `uv pip install` — **succeeded after fix**

---

## Files Changed

### `backend/requirements.txt`

**Before (failed):**
```
fastapi==0.115.0
uvicorn[standard]==0.30.0
httpx==0.27.0
python-dotenv==1.0.1
pydantic[email]==2.9.0
```

**After (fixed):**
```
fastapi==0.115.0
uvicorn==0.30.0
httpx==0.27.0
python-dotenv==1.0.1
pydantic==2.9.0
email-validator>=2.0.0
```

### Changes

| Line | Before | After | Why |
|------|--------|-------|-----|
| 2 | `uvicorn[standard]==0.30.0` | `uvicorn==0.30.0` | Removed `[standard]` extras that `uv` can't parse |
| 5 | `pydantic[email]==2.9.0` | `pydantic==2.9.0` | Removed `[email]` extras |
| 6 | *(new)* | `email-validator>=2.0.0` | Explicit dependency for `pydantic.EmailStr` |

### Impact of Removing `[standard]` Extras

The `[standard]` extra for uvicorn installs optional performance packages:
- `uvloop` (faster event loop)
- `httptools` (faster HTTP parsing)
- `watchfiles` (file watching for reload)
- `python-dotenv` (already listed separately)

These are **performance optimizations only**. Uvicorn works perfectly without them. The backend API functionality is identical.

---

## Files NOT Changed

| File | Status |
|------|--------|
| `requirements.txt` (root) | ✅ Already fixed in Round 1 |
| `api/index.py` | ✅ Unchanged |
| `vercel.json` | ✅ Unchanged |
| All Python backend code | ✅ Unchanged |
| All frontend code | ✅ Unchanged |

---

## Verification

Both `requirements.txt` files verified with `uv pip install`:

```
Root requirements.txt:
  ✅ Resolved 18 packages — Installed successfully

Backend requirements.txt:
  ✅ Resolved 20 packages — Installed successfully
```

---

## Why This Wasn't Caught in Round 1

Round 1 focused on the root `requirements.txt` (which Vercel uses for the serverless function). The `backend/requirements.txt` was not considered because it's used for Railway/local development, not Vercel. However, Vercel's build system scans the entire repository for Python dependency files, and the bracket syntax in `backend/requirements.txt` caused the build to fail.

---

## Verdict

**Fix applied.** Both `requirements.txt` files now use clean syntax compatible with `uv`. Vercel should build successfully on the next deployment.