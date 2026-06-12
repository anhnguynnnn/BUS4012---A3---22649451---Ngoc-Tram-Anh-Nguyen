# NAME_PROFILE_FIX.md — User Profile Name Bug Fix

## Root Cause

Two issues combined to cause the bug:

### 1. Supabase API field name mismatch (PRIMARY)

**File:** `backend/app/supabase_auth.py`

The Supabase Auth REST API expects custom user metadata under the `"data"` field, NOT `"user_metadata"`. The signup function was sending:

```python
payload["user_metadata"] = {"full_name": full_name}  # WRONG — ignored by Supabase
```

Supabase silently ignores unknown fields, so `full_name` was never stored. Fixed to:

```python
payload["data"] = {"full_name": full_name}  # CORRECT — stored in user_metadata
```

### 2. Login response missing full_name (SECONDARY)

**File:** `src/contexts/AuthContext.tsx`

The Supabase login/token response does not include custom `user_metadata` fields like `full_name`. Both `signIn` and `signUp` were using the user object directly from the auth response. Fixed to call `getMe(accessToken)` after getting tokens, which hits the `/auth/me` backend endpoint that enriches the response with `full_name` from metadata.

## Data Flow (After Fix)

```
Signup Form → AuthModal → AuthContext.signUp
  → backendApi.signup({ email, password, full_name: "Cham Em" })
  → POST /auth/signup → supabase_auth.signup
  → POST Supabase /auth/v1/signup { email, password, data: { full_name: "Cham Em" } }
  → Supabase stores full_name in user_metadata ✅
  → Returns access_token + refresh_token + user
  → AuthContext calls getMe(access_token)
  → GET /auth/me → supabase_auth.get_user → GET Supabase /auth/v1/user
  → Returns { full_name: "Cham Em", email: "...", user_metadata: { full_name: "Cham Em" } }
  → AuthContext sets session.user with full profile ✅
  → AccountPage reads user.full_name → displays "Cham Em" ✅
```

## Files Modified

| File | Change |
|------|--------|
| `backend/app/supabase_auth.py` | Changed `payload["user_metadata"]` to `payload["data"]` |
| `src/contexts/AuthContext.tsx` | Added `getMe()` call after login and signup to fetch full profile |

## Verification

```bash
# Signup with full_name
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"testpass123","full_name":"Cham Em"}'

# Login and get profile
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer <token>"
# → Returns: { "full_name": "Cham Em", ... }