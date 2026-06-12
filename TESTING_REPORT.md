# MUSÉ MVP — Testing Report

**Date:** 12 June 2026  
**Scope:** Code-level audit of all core user flows  
**Method:** Static analysis of source code (no live runtime testing)  
**Frontend:** React 18 + TypeScript + Vite + Tailwind CSS  
**Backend:** FastAPI (Python) + Supabase (Auth, PostgREST, PostgreSQL)

---

## Summary

| # | Feature | Result | Notes |
|---|---------|--------|-------|
| 1 | Signup | ✅ Pass | Email/password via Supabase Auth; profile row created by Supabase trigger |
| 2 | Login | ✅ Pass | Password grant → tokens stored in localStorage → session restored on refresh |
| 3 | Logout | ✅ Pass | Remote token invalidation + local token/session cleanup |
| 4 | Onboarding | ✅ Pass | 4-step wizard persisted to localStorage + debounced sync to Supabase profiles table |
| 5 | Feed Recommendations | ✅ Pass | Onboarding score (5 factors) + behaviour score (interaction-weighted), 70/30 blend |
| 6 | Save Post | ✅ Pass | Auth-gated; saves to local state + tracks interaction via `POST /interactions` |
| 7 | Create Album | ✅ Pass | Auth-gated; albums persisted to localStorage (scoped per user) |
| 8 | Add Post to Album | ✅ Pass | Save modal lists existing albums; tracks `album_add` interaction |
| 9 | Profile Loading | ✅ Pass | `GET /auth/profile` merges Supabase onboarding data into local state on login |

**Overall: 9/9 flows pass code-level audit.**

---

## Detailed Flow Analysis

### 1. Signup

**Entry:** `src/components/AuthModal.tsx` → `src/contexts/AuthContext.tsx` → `signUp()`

| Step | Component / File | Action |
|------|-----------------|--------|
| 1 | `AuthModal.tsx` | User fills email, password, full name in signup form |
| 2 | `AuthContext.signUp()` | Calls `signupRequest(email, password, fullName)` |
| 3 | `backendApi.ts` → `signup()` | `POST /auth/signup` with `{ email, password, full_name }` |
| 4 | `backend/app/routers/auth.py` → `/auth/signup` | Delegates to `supabase_auth.signup()` |
| 5 | `supabase_auth.py` → `signup()` | `POST {SUPABASE_URL}/auth/v1/signup` with metadata |
| 6 | Supabase Auth | Creates auth user + triggers `profiles` table insert |
| 7 | `AuthContext` | If tokens returned: saves tokens, fetches `/auth/me` for full profile, sets session |
| 8 | `AuthContext` | If email confirmation required: stores pending user, no session |

**Result:** ✅ Pass  
**Notes:** Handles both instant-confirmation and email-confirmation Supabase modes. Profile row creation relies on Supabase database trigger (must be configured in Supabase dashboard).

---

### 2. Login

**Entry:** `src/components/AuthModal.tsx` → `src/contexts/AuthContext.tsx` → `signIn()`

| Step | Component / File | Action |
|------|-----------------|--------|
| 1 | `AuthModal.tsx` | User enters email + password in login form |
| 2 | `AuthContext.signIn()` | Calls `loginRequest(email, password)` |
| 3 | `backendApi.ts` → `login()` | `POST /auth/login` with `{ email, password }` |
| 4 | `backend/app/routers/auth.py` → `/auth/login` | Delegates to `supabase_auth.login()` |
| 5 | `supabase_auth.py` → `login()` | `POST {SUPABASE_URL}/auth/v1/token?grant_type=password` |
| 6 | `AuthContext` | Saves `access_token` + `refresh_token` to localStorage |
| 7 | `AuthContext` | Fetches `/auth/me` to enrich user metadata (full_name) |
| 8 | `AuthContext` | Sets session → `isAuthenticated = true` |
| 9 | `AppContent` | `useEffect` on `isAuthenticated`: closes modal, sets `entryPopupSeen`, redirects |

**Result:** ✅ Pass  
**Notes:** Session persists across page refreshes via `restoreSession()` which reads tokens from localStorage and validates with `GET /auth/me`.

---

### 3. Logout

**Entry:** `src/pages/SettingsPage.tsx` / `src/pages/AccountPage.tsx` → `AppContent.logout()`

| Step | Component / File | Action |
|------|-----------------|--------|
| 1 | User clicks Logout | Triggers `logout()` in `AppContent` |
| 2 | `AuthContext.signOut()` | Calls `logoutRequest(accessToken)` |
| 3 | `backendApi.ts` → `logout()` | `POST /auth/logout` with Bearer token |
| 4 | `supabase_auth.py` → `logout()` | `POST {SUPABASE_URL}/auth/v1/logout` invalidates Supabase session |
| 5 | `AuthContext` | `clearAuthTokens()` removes tokens from localStorage |
| 6 | `AuthContext` | Sets `session = null` → `isAuthenticated = false` |
| 7 | `AppContent` | Resets entry popup, auth mode, redirects to home |

**Result:** ✅ Pass  
**Notes:** Even if the remote logout fails (e.g., token already expired), local state is always cleared. This ensures the user is never stuck in a broken auth state.

---

### 4. Onboarding (4 Steps)

**Entry:** `src/pages/OnboardingStylePage.tsx` → `OnboardingBodyPage` → `OnboardingFitPage` → `OnboardingDirectionPage`

| Step | Page | Data Collected |
|------|------|----------------|
| 1 | `OnboardingStylePage` | `styleAttraction[]` — e.g., "Minimal / Clean", "Streetwear" |
| 2 | `OnboardingBodyPage` | `sizeRange[]`, `heightRange` — body reference preferences |
| 3 | `OnboardingFitPage` | `fitPreferences[]` — e.g., "Highlight my waist", "Relaxed fit" |
| 4 | `OnboardingDirectionPage` | `stylingDirection[]` — "Womenswear", "Menswear", "Gender-neutral" |

**Persistence:**

| Layer | Mechanism |
|-------|-----------|
| Local | `saveToStorage(STORAGE_KEYS.onboarding, onboarding)` via `useEffect` in `AppContent` |
| Remote | Debounced (1s) `PUT /auth/profile` with onboarding fields when `onboarding.completed = true` |
| Restore | On login, `GET /auth/profile` fetches Supabase data → merges into local state |

**Result:** ✅ Pass  
**Notes:** Onboarding data is dual-persisted (localStorage + Supabase). On login, Supabase data takes precedence and is merged into local state. Offline usage works via localStorage alone.

---

### 5. Feed Recommendations

**Entry:** `AppContent` `useEffect` on mount → `GET /recommendations` or fallback `GET /posts`

| Step | Component / File | Action |
|------|-----------------|--------|
| 1 | `AppContent` | On mount, reads `getStoredAccessToken()` |
| 2 | If token exists | Calls `fetchRecommendations(token)` → `GET /recommendations` |
| 3 | `backend/app/routers/recommendations.py` | Fetches profile, posts, interactions from Supabase in parallel |
| 4 | `_calculate_onboarding_score()` | Scores each post against user's onboarding (style +20, size +25, height +20, fit +20, direction +10) |
| 5 | `_calculate_behaviour_score()` | Scores based on user's interaction history (view=1, save=9, share=7, album_add=6) |
| 6 | `_trending_score()` | Fallback for users with no interactions (engagement-based) |
| 7 | `_build_recommendation()` | Combines scores: 70% behaviour + 30% onboarding (or 50/50 if no history) |
| 8 | Response sorted | Posts returned sorted by `final_score` descending |
| 9 | If no token | Falls back to `GET /posts` (unauthenticated list) |
| 10 | `matchingLogic.ts` | `backendPostToFrontendPost()` maps snake_case DB fields to camelCase frontend types |

**Result:** ✅ Pass  
**Notes:** Recommendation engine uses a hybrid scoring model. New users without interaction history get trending-based scores as a proxy. The 70/30 weighting shifts emphasis to behaviour as users interact more.

---

### 6. Save Post

**Entry:** `PostCard` component → `AppContent.requestSavePost()`

| Step | Component / File | Action |
|------|-----------------|--------|
| 1 | User taps save on `PostCard` | Calls `requestSavePost(postId)` |
| 2 | `AppContent` | Checks `isAuthenticated` — if not, opens login modal |
| 3 | If already saved | Removes from `savedPostIds` (toggle behaviour) |
| 4 | If not saved | Sets `pendingSavePostId` → opens save modal |
| 5 | `savePostOnly()` | Adds to `savedPostIds` state |
| 6 | `backendApi.ts` → `trackInteraction()` | `POST /interactions` with `{ post_id, interaction_type: "save" }` |
| 7 | Backend | Inserts into `post_interactions` table with `interaction_score = 9` |

**Persistence:** `savedPostIds` stored in localStorage via `useEffect`.

**Result:** ✅ Pass  
**Notes:** Save is auth-gated. Unauthenticated users are prompted to log in first. The save interaction is tracked in Supabase for the recommendation engine.

---

### 7. Create Album

**Entry:** `StyleLibraryPage` → `AppContent.createAlbum()`

| Step | Component / File | Action |
|------|-----------------|--------|
| 1 | User enters album name | Via `StyleLibraryPage` input |
| 2 | `AppContent.createAlbum()` | Calls `requireAuth()` — if not authenticated, opens login modal |
| 3 | If authenticated | Adds `{ id: crypto.randomUUID(), name, postIds: [], createdAt }` to `albums` state |
| 4 | Persistence | `useEffect` saves `albums` to localStorage |

**Result:** ✅ Pass  
**Notes:** Albums are client-side only (localStorage). They are scoped per user via `setActiveUserId()` which namespaces localStorage keys. No Supabase albums table integration in this MVP.

---

### 8. Add Post to Album

**Entry:** Save modal (`renderSaveModal()`) → `AppContent.savePostToAlbum()`

| Step | Component / File | Action |
|------|-----------------|--------|
| 1 | Save modal displays | Lists existing albums + "Create & Save" option |
| 2 | User selects album | Calls `savePostToAlbum(albumId)` |
| 3 | `AppContent` | Adds `postId` to album's `postIds` array (deduped via `Set`) |
| 4 | `backendApi.ts` → `trackInteraction()` | `POST /interactions` with `interaction_type: "album_add"` (score=6) |
| 5 | Also tracks | `POST /interactions` with `interaction_type: "save"` (score=9) |

**Alternative:** `savePostToNewAlbum()` creates a new album and adds the post in one step.

**Result:** ✅ Pass  
**Notes:** Both `save` and `album_add` interactions are tracked, contributing to the user's behaviour profile for recommendations.

---

### 9. Profile Loading

**Entry:** `AppContent` `useEffect` on `user?.id` change → `GET /auth/profile`

| Step | Component / File | Action |
|------|-----------------|--------|
| 1 | User logs in | `AuthContext` sets `user` object |
| 2 | `AppContent` `useEffect` | Triggers on `user?.id` change |
| 3 | `fetchProfile(token)` | `GET /auth/profile` with Bearer token |
| 4 | `backend/app/routers/auth.py` | Validates token → fetches from `profiles` table via PostgREST |
| 5 | If profile exists | Returns onboarding fields from Supabase |
| 6 | If no profile | Returns defaults (empty arrays, `onboarding_completed: false`) |
| 7 | `AppContent` | Merges Supabase onboarding into local `onboarding` state if `onboarding_completed = true` |
| 8 | `AppContent` | Also loads `savedPostIds`, `albums`, `appPreferences` from user-scoped localStorage |

**Result:** ✅ Pass  
**Notes:** Profile loading is resilient — if the Supabase request fails, localStorage data remains the source of truth. The merge only applies when `onboarding_completed` is true in Supabase.

---

## Build Verification

| Check | Result |
|-------|--------|
| `tsc -b` (TypeScript compilation) | ✅ Pass — zero errors |
| `vite build` (production bundle) | ✅ Pass |
| Unused imports/variables | ✅ Clean |

---

## Known Limitations (Non-Blocking)

| # | Issue | Impact | Mitigation |
|---|-------|--------|------------|
| 1 | Albums are localStorage-only | Albums don't sync across devices | Supabase `albums` table exists but is not used for write-through; acceptable for MVP |
| 2 | No image upload | Posts use external `image_url` | Seed data provides working image URLs |
| 3 | No email verification enforcement | Users can sign up with unverified emails | Supabase handles this; depends on project settings |
| 4 | Backend health check uses `/health` | Requires backend to be running | Frontend shows a red banner if backend is unreachable |
| 5 | No pagination on feed | All posts loaded at once (limit=50) | Acceptable for MVP data volume |

---

## Conclusion

All 9 core user flows are implemented correctly at the code level. The application builds without TypeScript errors. The recommendation engine integrates onboarding preferences and interaction history with a weighted scoring model. Data persistence uses a dual-layer approach (localStorage + Supabase) for resilience.