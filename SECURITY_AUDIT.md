# MUSÉ Security Audit — Phase 7

**Date:** 2026-06-12  
**Scope:** Full repository security review for GitHub submission and deployment readiness  
**Severity Scale:** Critical → High → Medium → Low → Informational

---

## 1. Secrets Audit

### 1.1 Findings

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| S-1 | `backend/.env` contains live Supabase anon key and project URL | Info | ✅ Not tracked by git |
| S-2 | No Supabase service role key used anywhere in codebase | Info | ✅ Clean |
| S-3 | No hardcoded JWT secrets, API keys, or tokens in source files | Info | ✅ Clean |
| S-4 | Frontend has zero direct Supabase credentials — all API calls go through backend proxy | Info | ✅ Clean |
| S-5 | `config.py` masks the anon key in startup logs (first 8 / last 6 chars only) | Info | ✅ Clean |

### 1.2 Verification

```
git ls-files '*.env' 'backend/.env'          → (empty — no .env files tracked)
grep -r "service_role\|JWT_SECRET\|PRIVATE_KEY" backend/ → (no matches)
grep -r "eyJ\|service_role" src/              → (no matches)
```

**Conclusion:** No secrets are committed to the repository.

---

## 2. Git Safety

### 2.1 `.gitignore` Coverage

| Pattern | Covered | Notes |
|---------|---------|-------|
| `.env`, `.env.*`, `backend/.env` | ✅ | All environment files excluded |
| `node_modules/` | ✅ | |
| `dist/`, `build/` | ✅ | |
| `coverage/` | ✅ | |
| `logs/`, `*.log` | ✅ | |
| `*.pem`, `*.key`, `*.cert`, `*.crt` | ✅ | Added in Phase 7 |
| `.DS_Store` | ✅ | |
| `__pycache__/`, `*.pyc` | ✅ | |
| `backend/.venv/` | ✅ | |
| `.vercel/` | ✅ | |
| `!/.env.example`, `!backend/.env.example` | ✅ | Example files preserved |

### 2.2 Git History

- No `.env` files have ever been committed (verified via `git log --all -- backend/.env`)
- No secrets appear in any tracked file

---

## 3. Environment Validation

| File | Status | Notes |
|------|--------|-------|
| `backend/.env.example` | ✅ | Empty placeholder values for `SUPABASE_URL` and `SUPABASE_ANON_KEY` |
| `backend/.env` | ✅ | Real values, not tracked by git |
| README / docs | ✅ | No real credentials in any documentation |

---

## 4. Supabase Security Review

### 4.1 Key Usage

| Key | Used? | Where |
|-----|-------|-------|
| Anon key | ✅ | `backend/app/config.py` → `SUPABASE_ANON_KEY` |
| Service role key | ❌ Not used | Not present anywhere in codebase |

**Frontend key exposure:** None. The frontend makes all API calls through the FastAPI backend proxy. The Supabase anon key is only used server-side in `config.py`, `supabase_auth.py`, and router modules.

### 4.2 Row Level Security (RLS)

| Table | RLS Enabled | Policies |
|-------|-------------|----------|
| `profiles` | ✅ (existing) | Users can read/update own profile |
| `posts` | ❌ | Intentional — public content for MVP |
| `post_interactions` | ✅ | Users can INSERT/SELECT/DELETE own interactions only |
| `albums` | ✅ | Users can manage own albums; public albums visible to all |
| `album_posts` | ✅ | Users can manage posts in own albums; read from own + public albums |

### 4.3 Auth Flow

1. Frontend sends email/password to `POST /auth/signup` or `POST /auth/login`
2. Backend proxies request to Supabase Auth REST API using the anon key
3. Supabase returns JWT access_token + refresh_token
4. Frontend stores tokens in localStorage (user-scoped)
5. All subsequent API calls include `Authorization: Bearer <token>`
6. Backend validates tokens by calling Supabase Auth `/user` endpoint

**Assessment:** Auth flow is sound. The backend never stores or generates its own JWTs — it delegates entirely to Supabase Auth.

---

## 5. Backend Security Review

### 5.1 Authentication & Authorization

| Endpoint | Auth Required | Notes |
|----------|--------------|-------|
| `POST /auth/signup` | No | Intentional — public registration |
| `POST /auth/login` | No | Intentional — public login |
| `POST /auth/logout` | ✅ Bearer token | |
| `GET /auth/me` | ✅ Bearer token | |
| `GET /auth/profile` | ✅ Bearer token | |
| `PUT /auth/profile` | ✅ Bearer token | |
| `GET /posts` | Optional | Public content |
| `GET /posts/trending` | No | Public content |
| `POST /interactions` | ✅ Bearer token | |
| `GET /interactions` | ✅ Bearer token | |
| `GET /recommendations` | ✅ Bearer token | |
| `GET /health` | No | Intentional — monitoring |

### 5.2 Input Validation

- **Pydantic models** enforce type validation on all request bodies
- `SignUpRequest`: email format validated via `EmailStr`, password min length 6
- `LoginRequest`: email format validated, password min length 1
- `InteractionRequest`: `interaction_type` validated against allowed values
- `ProfileUpdateRequest`: all fields optional, types enforced

### 5.3 Error Handling

- Supabase errors are forwarded to the client with original status codes
- Connection errors return `502 Bad Gateway` with descriptive messages
- **Recommendation:** In production, sanitize error details to avoid leaking internal infrastructure information

### 5.4 CORS Configuration

```python
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    FRONTEND_ORIGIN,  # from .env
]
```

- Specific origins only — no wildcard `*`
- `allow_credentials=True` is set
- `allow_methods=["*"]` and `allow_headers=["*"]` — could be restricted in production

---

## 6. Production Hardening Assessment

| Risk | Current State | Recommendation |
|------|--------------|----------------|
| **XSS** | Low risk — React auto-escapes rendered content. Post data from Supabase rendered as text nodes. | No fix needed for MVP |
| **CSRF** | N/A — API uses Bearer token auth (Authorization header), not cookie-based sessions. CSRF targets cookie auth. | No fix needed |
| **SQL Injection** | N/A — All database access goes through Supabase REST API (PostgREST). No raw SQL in backend. | No fix needed |
| **Rate Limiting** | ❌ Not implemented | **Add for production** — protect `/auth/signup`, `/auth/login` from brute force |
| **HTTPS** | Not enforced in dev | **Must enforce in production** via reverse proxy or platform config |
| **Input Sanitization** | Types validated, content not sanitized | **Add for production** — strip HTML from `full_name`, `description` |
| **Token Storage** | localStorage | Acceptable for MVP. Consider httpOnly cookies for production. |
| **Error Verbosity** | Supabase error details forwarded to client | **Sanitize in production** |

---

## 7. Summary

### Critical Issues: 0

### High Issues: 0

### Medium Issues: 2

| # | Issue | Recommendation |
|---|-------|----------------|
| M-1 | No rate limiting on auth endpoints | Add `slowapi` or reverse proxy rate limiting |
| M-2 | Supabase error details forwarded to client | Sanitize error responses in production |

### Low Issues: 3

| # | Issue | Recommendation |
|---|-------|----------------|
| L-1 | CORS allows all methods and headers | Restrict to `GET, POST, PUT, DELETE` and specific headers |
| L-2 | Token stored in localStorage | Consider httpOnly cookies for production |
| L-3 | No content sanitization on user-generated strings | Strip HTML tags from `full_name`, `description` |

### Fixes Applied in This Audit

1. ✅ Added `*.pem`, `*.key`, `*.cert`, `*.crt` to `.gitignore`
2. ✅ Verified no secrets in git history or tracked files
3. ✅ Confirmed RLS policies on sensitive tables
4. ✅ Confirmed service role key is not used

---

**Overall Security Posture: GOOD for academic MVP**