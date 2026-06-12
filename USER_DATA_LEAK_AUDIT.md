# USER_DATA_LEAK_AUDIT.md — Data Leak Between User Accounts

## Root Cause

**All user data was stored in `localStorage` with non-user-scoped keys.** Multiple users shared the same `muse:onboarding`, `muse:savedPosts`, and `muse:albums` keys. Logout only cleared auth tokens, not user data.

## Evidence

### Onboarding Pages — No Default Selections

All 4 onboarding pages receive `onboarding` as a prop from `App.tsx`. They render selections based on `onboarding.styleAttraction.includes(option)` etc. The onboarding object was loaded from localStorage on app mount:

| File | Line | State | Source |
|------|------|-------|--------|
| `src/App.tsx` | 34 | `onboarding` | `localStorage` key `muse:onboarding` → `defaultOnboarding` (empty arrays) |
| `src/App.tsx` | 35 | `savedPostIds` | `localStorage` key `muse:savedPosts` → `[]` |
| `src/App.tsx` | 36 | `albums` | `localStorage` key `muse:albums` → `[]` |
| `src/App.tsx` | 37 | `appPreferences` | `localStorage` key `muse:appPreferences` → `defaultAppPreferences` |

### Why Pre-Selected Options Appear

1. User A completes onboarding → `onboarding.styleAttraction = ["Minimal / clean", "Streetwear"]` saved to `muse:onboarding`
2. User A logs out → `muse:onboarding` NOT cleared
3. User B signs up → App.tsx loads `muse:onboarding` → finds User A's selections
4. Onboarding pages show User A's selections as pre-selected

### Albums and Saved Looks — Same Issue

- Albums loaded from `localStorage` key `muse:albums` (line 36 of `App.tsx`)
- Saved looks loaded from `localStorage` key `muse:savedPosts` (line 35 of `App.tsx`)
- Neither is user-scoped, neither is cleared on logout

### Logout Function — Missing Data Clear

```typescript
// src/App.tsx, lines 134-140
const logout = async () => {
    await signOut();           // Only clears auth tokens
    setEntryPopupSeen(false);
    setAuthMode("entry");
    setAuthModalOpen(true);
    setPage("home");
    // ❌ Does NOT clear: onboarding, savedPostIds, albums, appPreferences
};
```

### Data Sources — None Connected to Supabase

| Data | Source | User-Scoped? | Cleared on Logout? |
|------|--------|--------------|-------------------|
| Onboarding | `localStorage` `muse:onboarding` | ❌ | ❌ |
| Saved looks | `localStorage` `muse:savedPosts` | ❌ | ❌ |
| Albums | `localStorage` `muse:albums` | ❌ | ❌ |
| App preferences | `localStorage` `muse:appPreferences` | ❌ | ❌ |
| Mock posts | `src/data/mockPosts.ts` | N/A (hardcoded) | N/A |

**No data comes from Supabase database.** No backend endpoints exist for user data. All data is browser-local localStorage.

## Fix Applied

### 1. User-Scoped localStorage Keys (`src/utils/storage.ts`)

Added `setActiveUserId()` function. When set, all storage keys are namespaced:
- `muse:{userId}:onboarding`
- `muse:{userId}:savedPosts`
- `muse:{userId}:albums`
- `muse:{userId}:appPreferences`

Auth tokens remain non-scoped (they identify the user).

### 2. Auth State Sync (`src/App.tsx`)

Added `useEffect` that watches `user?.id`:
- **Login:** Sets active user ID → reloads that user's scoped data from localStorage
- **Logout:** Clears active user ID → resets all state to empty defaults

```typescript
useEffect(() => {
    setActiveUserId(user?.id ?? null);
    if (user?.id) {
      // Load user-scoped data
      setOnboardingState(mergeOnboarding(getFromStorage(STORAGE_KEYS.onboarding, defaultOnboarding)));
      setSavedPostIds(getFromStorage(STORAGE_KEYS.savedPosts, []));
      setAlbums(getFromStorage(STORAGE_KEYS.albums, []));
      setAppPreferencesState(mergeAppPreferences(getFromStorage(STORAGE_KEYS.appPreferences, defaultAppPreferences)));
    } else {
      // Reset to defaults on logout
      setOnboardingState(defaultOnboarding);
      setSavedPostIds([]);
      setAlbums([]);
      setAppPreferencesState(defaultAppPreferences);
    }
  }, [user?.id]);
```

## Files Modified

| File | Change |
|------|--------|
| `src/utils/storage.ts` | Added `setActiveUserId()`, converted `STORAGE_KEYS` to dynamic getters with user-scoped prefix |
| `src/App.tsx` | Added `useEffect` to sync user ID with auth state and reload/reset user data |

## How It Works After Fix

1. User A signs up (id: `abc-123`) → localStorage keys become `muse:abc-123:onboarding`, etc.
2. User A completes onboarding → saved to `muse:abc-123:onboarding`
3. User A logs out → active user ID cleared → state reset to defaults
4. User B signs up (id: `def-456`) → localStorage keys become `muse:def-456:onboarding`, etc.
5. User B sees empty onboarding (clean state) ✅
6. User A logs back in → keys become `muse:abc-123:onboarding` → their data is restored ✅