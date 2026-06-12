# PHASE5A_ONBOARDING_PERSISTENCE_REPORT.md — Onboarding Persistence to Supabase

## Audit Summary

**Before Phase 5A:** Onboarding answers were stored ONLY in browser `localStorage`. No Supabase persistence existed. The backend had no profile endpoints — only auth (signup, login, logout, me).

**After Phase 5A:** Onboarding answers are persisted to both `localStorage` (offline-first) and the Supabase `profiles` table (server-side). Preferences load from Supabase on login and sync back on change.

---

## What Changed

### Backend (3 files)

#### 1. `backend/app/models.py` — New Pydantic models

```python
class ProfileResponse(BaseModel):
    id: str
    full_name: Optional[str] = None
    onboarding_completed: bool = False
    style_attraction: list[str] = []
    size_range: list[str] = []
    height_range: Optional[str] = None
    fit_preferences: list[str] = []
    styling_direction: list[str] = []
    updated_at: Optional[str] = None

class ProfileUpdateRequest(BaseModel):
    onboarding_completed: Optional[bool] = None
    style_attraction: Optional[list[str]] = None
    size_range: Optional[list[str]] = None
    height_range: Optional[str] = None
    fit_preferences: Optional[list[str]] = None
    styling_direction: Optional[list[str]] = None
```

#### 2. `backend/app/supabase_auth.py` — New Supabase PostgREST functions

| Function | Method | Endpoint | Purpose |
|----------|--------|----------|---------|
| `get_profile(access_token, user_id)` | GET | `/rest/v1/profiles?id=eq.{user_id}` | Fetch user profile |
| `update_profile(access_token, user_id, updates)` | PATCH | `/rest/v1/profiles?id=eq.{user_id}` | Update profile fields |

Both functions use the user's access token for RLS compliance (Supabase resolves `auth.uid()` from the Bearer token).

#### 3. `backend/app/routers/auth.py` — New API endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/profile` | GET | Return user's profile from `profiles` table |
| `/auth/profile` | PUT | Update user's profile (onboarding answers, preferences) |

**GET /auth/profile** returns defaults (`onboarding_completed: false`, empty arrays) if no profile row exists yet. This handles pre-migration users gracefully.

**PUT /auth/profile** uses `exclude_none=True` so only explicitly provided fields are updated.

### Frontend (2 files)

#### 4. `src/lib/backendApi.ts` — New API functions

```typescript
export function getProfile(accessToken: string): Promise<ProfileResponse>
export function updateProfile(accessToken: string, updates: ProfileUpdatePayload): Promise<ProfileResponse>
```

New types: `ProfileResponse`, `ProfileUpdatePayload`

#### 5. `src/App.tsx` — Two new `useEffect` hooks

**Effect 1: Load profile from Supabase on login**
```
user?.id changes → fetchProfile(token) → merge into onboarding state → save to localStorage
```
- Runs once when user logs in
- Only merges if `profile.onboarding_completed === true`
- Silently fails if Supabase is unreachable (localStorage data remains)
- Uses `cancelled` flag to prevent state updates after unmount

**Effect 2: Persist onboarding to Supabase on change (debounced)**
```
onboarding fields change → 1s debounce → updateProfile(token, { ... })
```
- Only runs when `onboarding.completed === true` and user is authenticated
- 1-second debounce to avoid excessive API calls during rapid changes
- Silently fails if Supabase is unreachable (localStorage is still up to date)
- Runs on: `styleAttraction`, `fitPreferences`, `stylingDirection`, `sizeRange`, `heightRange`

---

## Data Flow

### Onboarding Completion

```
User completes onboarding
  → setOnboardingState({ ...onboarding, completed: true })
  → localStorage useEffect saves to localStorage
  → Supabase useEffect fires after 1s debounce
  → PUT /auth/profile with all onboarding fields
  → Supabase profiles table updated
```

### Login

```
User logs in
  → AuthContext restores session
  → user?.id effect loads from localStorage
  → Supabase useEffect fetches GET /auth/profile
  → If onboarding_completed: merge DB values into state
  → localStorage updated with merged data
```

### Preference Edit (Account Page → Edit Preferences)

```
User edits preferences in onboarding pages
  → setOnboardingState updates individual fields
  → localStorage useEffect saves immediately
  → Supabase useEffect fires after 1s debounce
  → PUT /auth/profile with updated fields
```

### Logout

```
User logs out
  → AuthContext clears session
  → user?.id becomes undefined
  → All state reset to defaults
  → setActiveUserId(null) scopes localStorage to guest
```

---

## Database Columns Used

| Column | Type | Written On | Read On |
|--------|------|------------|---------|
| `onboarding_completed` | boolean | Onboarding finish | Login |
| `style_attraction` | text[] | Onboarding Q1 edit | Login |
| `fit_preferences` | text[] | Onboarding Q3 edit | Login |
| `styling_direction` | text[] | Onboarding Q4 edit | Login |
| `size_range` | text[] | Onboarding Q2 edit | Login |
| `height_range` | text | Onboarding Q2 edit | Login |
| `updated_at` | timestamptz | Auto (DB default) | — |

---

## Resilience

| Scenario | Behaviour |
|----------|-----------|
| **Supabase unreachable** | Silently fails. localStorage remains source of truth. |
| **Profile row doesn't exist** | GET returns defaults. PUT will 404 (user sees no error). |
| **Migration not applied** | GET returns defaults (no columns to read). PUT 404s silently. |
| **Rapid preference changes** | 1s debounce prevents excessive API calls. |
| **Component unmount** | `cancelled` flag prevents stale state updates. |
| **Multiple tabs** | Each tab has its own state. Last write wins in Supabase. |

---

## Prerequisites

The Phase 5 migration (`001_phase5_database_foundation.sql`) must be applied before the profile endpoints will work. Without it:
- GET `/auth/profile` returns defaults (no columns exist)
- PUT `/auth/profile` returns 404 (no rows to update)

---

## Files Modified

| File | Changes |
|------|---------|
| `backend/app/models.py` | Added `ProfileResponse`, `ProfileUpdateRequest` |
| `backend/app/supabase_auth.py` | Added `get_profile()`, `update_profile()` |
| `backend/app/routers/auth.py` | Added `GET /auth/profile`, `PUT /auth/profile` |
| `src/lib/backendApi.ts` | Added `getProfile()`, `updateProfile()`, types |
| `src/App.tsx` | Added Supabase load-on-login and save-on-change effects |