# DATA_PERSISTENCE_AUDIT.md — Data Persistence Investigation

## Root Cause

**All user data (onboarding, albums, saved looks) is stored in `localStorage` with non-user-scoped keys.** There is no connection to Supabase user IDs. Multiple users share the same localStorage data, and logout does not clear user-specific data.

---

## Data Source Summary

| Data Type | Storage | Key | User-Scoped? | Cleared on Logout? |
|-----------|---------|-----|--------------|-------------------|
| Onboarding selections | `localStorage` | `muse:onboarding` | ❌ No | ❌ No |
| Saved looks | `localStorage` | `muse:savedPosts` | ❌ No | ❌ No |
| Albums | `localStorage` | `muse:albums` | ❌ No | ❌ No |
| App preferences | `localStorage` | `muse:appPreferences` | ❌ No | ❌ No |
| Auth tokens | `localStorage` | `muse:accessToken`, `muse:refreshToken` | ✅ Yes | ✅ Yes |
| Entry popup seen | `localStorage` | `muse_has_seen_entry_popup` | ❌ No | ❌ No |

---

## Detailed Findings

### 1. Onboarding Selections

**File:** `src/App.tsx`

```typescript
const [onboarding, setOnboardingState] = useState<OnboardingAnswers>(
  () => mergeOnboarding(getFromStorage(STORAGE_KEYS.onboarding, defaultOnboarding))
);
```

**Source:** `localStorage` key `muse:onboarding`, falling back to `defaultOnboarding` (empty arrays, `completed: false`).

**Problem:** The key `muse:onboarding` is the same for ALL users. User A's onboarding selections persist and are visible to User B.

**Note:** The `defaultOnboarding` has empty arrays and `completed: false`. If a user sees pre-selected options, it means a previous user completed onboarding and the data was never cleared from localStorage.

### 2. Saved Looks (Post IDs)

**File:** `src/App.tsx`

```typescript
const [savedPostIds, setSavedPostIds] = useState<string[]>(
  () => getFromStorage(STORAGE_KEYS.savedPosts, [])
);
```

**Source:** `localStorage` key `muse:savedPosts`, falling back to `[]`.

**Problem:** Same key for all users. Saved looks from one account bleed into another.

### 3. Albums

**File:** `src/App.tsx`

```typescript
const [albums, setAlbums] = useState<Album[]>(
  () => getFromStorage(STORAGE_KEYS.albums, [])
);
```

**Source:** `localStorage` key `muse:albums`, falling back to `[]`.

**Problem:** Same key for all users. Albums created by one account are visible to all other accounts.

### 4. App Preferences

**File:** `src/App.tsx`

```typescript
const [appPreferences, setAppPreferencesState] = useState<AppPreferences>(
  () => mergeAppPreferences(getFromStorage(STORAGE_KEYS.appPreferences, defaultAppPreferences))
);
```

**Source:** `localStorage` key `muse:appPreferences`, falling back to `defaultAppPreferences`.

**Problem:** Same key for all users.

### 5. Logout Does NOT Clear User Data

**File:** `src/App.tsx` — `logout` function:

```typescript
const logout = async () => {
    await signOut();           // Clears auth tokens only
    setEntryPopupSeen(false);
    setAuthMode("entry");
    setAuthModalOpen(true);
    setPage("home");
    // ❌ Does NOT clear: onboarding, savedPostIds, albums, appPreferences
};
```

**File:** `src/contexts/AuthContext.tsx` — `signOut` function:

```typescript
const signOut = useCallback(async () => {
    // ...
    clearAuthTokens();  // Only clears muse:accessToken and muse:refreshToken
    setSession(null);
    // ❌ Does NOT clear: onboarding, savedPosts, albums, appPreferences
}, [session?.accessToken]);
```

**File:** `src/utils/storage.ts` — `clearAuthTokens`:

```typescript
export function clearAuthTokens(): void {
  removeFromStorage(STORAGE_KEYS.accessToken);
  removeFromStorage(STORAGE_KEYS.refreshToken);
  // Only removes auth tokens, NOT user-specific data
}
```

### 6. `clearMuseStorage` Exists But Is Not Called on Logout

**File:** `src/utils/storage.ts`:

```typescript
export function clearMuseStorage(): void {
  Object.keys(localStorage)
    .filter((key) => key.startsWith(PREFIX))
    .forEach((key) => localStorage.removeItem(key));
}
```

This function clears ALL muse-prefixed keys, but it's only called from `clearData()` in the Settings page ("Clear Data" button). It is NOT called during logout.

### 7. No Supabase Database Connection

**File:** `backend/app/routers/auth.py`

The backend only has auth endpoints (`/auth/signup`, `/auth/login`, `/auth/logout`, `/auth/me`). There are **no database tables, no Supabase database client, and no API endpoints** for storing/retrieving:
- Onboarding selections
- Saved looks
- Albums

All data lives exclusively in the browser's `localStorage`.

---

## Files Involved

| File | Role |
|------|------|
| `src/utils/storage.ts` | localStorage read/write/clear utilities |
| `src/utils/matchingLogic.ts` | Default onboarding and preferences values |
| `src/App.tsx` | Loads all data from localStorage on mount, persists on change |
| `src/contexts/AuthContext.tsx` | Logout only clears auth tokens |
| `src/data/mockPosts.ts` | Mock post data (hardcoded, not from database) |

---

## Why the Bug Occurs

1. User A signs up → completes onboarding → saves looks → creates albums
2. All data stored in `localStorage` with keys like `muse:onboarding`, `muse:savedPosts`, `muse:albums`
3. User A logs out → only auth tokens are cleared
4. User B signs up → App.tsx loads `localStorage` → finds User A's data still there
5. User B sees User A's onboarding selections, saved looks, and albums

---

## Recommended Fix Before Phase 5

### Option A: Scope localStorage keys by user ID (Quick Fix)

Prefix all localStorage keys with the Supabase user ID:

```
muse:{userId}:onboarding
muse:{userId}:savedPosts
muse:{userId}:albums
```

On logout, the current user's data stays in localStorage (for when they log back in), but the new user gets their own clean namespace.

**Pros:** No backend changes needed, data persists across sessions per user.
**Cons:** Data only available on the same browser, no cross-device sync.

### Option B: Store data in Supabase database (Full Fix)

Create Supabase tables for user preferences, saved looks, and albums. Replace localStorage with API calls.

**Pros:** Cross-device sync, proper data isolation, scalable.
**Cons:** Requires backend endpoints, Supabase table setup, migration of existing localStorage data.

### Option C: Clear all user data on logout (Minimum Fix)

Call `clearMuseStorage()` during logout so the next user starts fresh.

**Pros:** Simplest change, prevents data bleeding.
**Cons:** Data is lost when logging out, no cross-session persistence.

**Recommended:** Option A for immediate fix, Option B for Phase 5.