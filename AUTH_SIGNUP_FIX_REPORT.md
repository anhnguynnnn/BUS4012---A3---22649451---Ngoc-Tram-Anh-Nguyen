# AUTH_SIGNUP_FIX_REPORT.md

## Root Cause Analysis

The signup flow was broken due to **three compounding issues**:

### 1. Backend Not Running (Primary Cause)
The FastAPI backend was not running on port 8000. The browser console error:

```
Could not connect to the server.
Fetch API cannot load http://localhost:8000/auth/signup
Failed to load resource: Could not connect to the server.
```

This was the direct cause — the frontend was trying to reach `http://localhost:8000` but nothing was listening.

### 2. No Vite Dev-Server Proxy (Architectural Gap)
`vite.config.ts` had **no `server.proxy` configuration**. All frontend API calls went directly from the browser to `http://localhost:8000`, which meant:

- CORS preflight requests were required for every API call
- If the frontend and backend were on different origins, browsers would block requests
- The only path to the backend was a direct cross-origin fetch

### 3. CORS Only Allowed One Port
`backend/app/main.py` configured CORS to allow only `http://localhost:5173`. When Vite's default port 5173 was already in use (common during development), Vite would fall back to port 5174, and all API requests from the browser would be blocked by CORS.

---

## Files Changed

### `backend/app/main.py`
**Change:** Expanded CORS `allow_origins` from a single origin to include both common Vite ports.

```python
# Before:
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    ...
)

# After:
ALLOWED_ORIGINS = list(set([
    FRONTEND_ORIGIN,
    "http://localhost:5173",
    "http://localhost:5174",
]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    ...
)
```

### `vite.config.ts`
**Change:** Added `server.proxy` configuration so all API paths are forwarded to the FastAPI backend through the Vite dev server.

```typescript
// Before:
export default defineConfig({
  plugins: [react()],
});

// After:
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/auth": "http://localhost:8000",
      "/interactions": "http://localhost:8000",
      "/posts": "http://localhost:8000",
      "/recommendations": "http://localhost:8000",
      "/health": "http://localhost:8000",
    },
  },
});
```

### `src/lib/backendApi.ts`
**Change:** Changed `BACKEND_BASE_URL` from hardcoded `http://localhost:8000` to empty string (relative paths), so requests go through the Vite proxy.

```typescript
// Before:
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:8000";

// After:
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || "";
```

---

## Tests Performed

### Backend Health
| Test | Result |
|------|--------|
| `GET /health` (direct) | ✅ `{"status":"ok"}` |
| `GET /docs` (Swagger UI) | ✅ 200 OK |
| `GET /openapi.json` | ✅ All 10 routes registered |

### Auth Endpoints (Direct)
| Test | Result |
|------|--------|
| `POST /auth/signup` | ✅ 200 OK — returns `access_token`, `refresh_token`, `user` with `full_name` |
| `POST /auth/login` | ✅ 200 OK — returns tokens and user data |
| `GET /auth/me` (with Bearer token) | ✅ 200 OK — returns user profile including `full_name` |

### CORS
| Test | Result |
|------|--------|
| OPTIONS from `localhost:5173` | ✅ 200 OK |
| OPTIONS from `localhost:5174` | ✅ 200 OK |

### Vite Proxy (End-to-End)
| Test | Result |
|------|--------|
| `GET http://localhost:5174/health` (via proxy) | ✅ `{"status":"ok"}` |
| `POST http://localhost:5174/auth/signup` (via proxy) | ✅ User created: `test_muse_proxy@example.com`, `full_name: "Proxy Test"` |
| `POST http://localhost:5174/auth/login` (via proxy) | ✅ Login OK for `test_muse_proxy@example.com` |

### Frontend Build
| Test | Result |
|------|--------|
| `npx vite build` | ✅ Built in 600ms, 1755 modules, no errors |

### Supabase Configuration
| Check | Result |
|-------|--------|
| `.env` loaded | ✅ From `backend/.env` |
| `SUPABASE_URL` | ✅ `https://bsjxwlkenizhlpwallwj.supabase.co` |
| `SUPABASE_ANON_KEY` | ✅ Present, validated (masked: `eyJhbGci...dKahlI`) |
| Config validation | ✅ "Supabase configuration validated successfully" |

---

## Final Status

| Component | Status |
|-----------|--------|
| Backend (FastAPI on port 8000) | ✅ Running |
| `/auth/signup` endpoint | ✅ Working |
| `/auth/login` endpoint | ✅ Working |
| `/auth/me` endpoint | ✅ Working |
| CORS configuration | ✅ Allows both 5173 and 5174 |
| Vite proxy | ✅ Forwards `/auth`, `/posts`, etc. to backend |
| Frontend API base URL | ✅ Uses relative paths (goes through proxy) |
| Supabase credentials | ✅ Loaded and validated |
| Frontend build | ✅ Compiles without errors |

**The signup flow is fully functional end-to-end.** Users can sign up from the frontend, which sends requests through the Vite dev-server proxy to the FastAPI backend, which proxies to Supabase Auth.

---

## How to Run

```bash
# Terminal 1: Start the backend
cd backend && .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000

# Terminal 2: Start the frontend
npx vite --port 5173
```

The backend must be started **before** the frontend so the Vite proxy can connect to it.