# PHASE6B_SUPABASE_FEED_REPORT.md — Supabase-Backed Feed

## Overview

Phase 6B replaces the hardcoded `mockPosts.ts` data source with Supabase-backed posts fetched from the backend API. All 4 page components that previously imported `mockPosts` now accept a `posts` prop and fall back to `mockPosts` only when the Supabase data source is empty.

---

## Architecture

### Data Flow (Before)

```
App mounts → pages import mockPosts directly → hardcoded Post[] used everywhere
```

### Data Flow (After)

```
App mounts
  → useEffect calls GET /posts (authenticated or anonymous)
  → Backend fetches from Supabase posts table
  → Frontend maps PostData[] → Post[] via backendPostToFrontendPost()
  → supabasePosts state stored in AppContent
  → Passed as `posts` prop to WelcomePage, StyleLibraryPage, AlbumDetailPage
  → Each page uses supabasePosts if non-empty, falls back to mockPosts otherwise
```

---

## Changes Made

### 1. `src/lib/backendApi.ts` — New API function

```typescript
export function getPosts(accessToken?: string, limit = 50): Promise<PostData[]>
```

- Calls `GET /posts?limit={limit}`
- Accepts optional auth token (authenticated reads get RLS-resolved user context)
- Returns `PostData[]` with all metadata columns

### 2. `src/App.tsx` — Shared posts state

New state and fetch logic:

```typescript
const [supabasePosts, setSupabasePosts] = useState<Post[]>([]);
const [postsLoading, setPostsLoading] = useState(true);

useEffect(() => {
  const token = getStoredAccessToken();
  fetchPosts(token || undefined)
    .then((postsData) => setSupabasePosts(postsData.map(backendPostToFrontendPost)))
    .catch(() => { /* silently fail */ })
    .finally(() => setPostsLoading(false));
}, []);
```

Props passed to child pages:

| Page | Prop Added |
|------|-----------|
| `WelcomePage` | `posts={supabasePosts}` |
| `StyleLibraryPage` | `posts={supabasePosts}` |
| `AlbumDetailPage` | `posts={supabasePosts}` |

### 3. `src/pages/WelcomePage.tsx` — Supabase-first with mock fallback

**Before:** `const trendingPosts = useMemo(() => mockPosts.slice(0, 9), []);`

**After:**
```typescript
const allPosts = supabasePosts.length > 0 ? supabasePosts : mockPosts;
const trendingPosts = useMemo(() => allPosts.slice(0, 9), [allPosts]);
```

- Accepts `posts?: Post[]` prop (aliased as `supabasePosts`)
- Uses Supabase data when available, falls back to mockPosts
- Trending section, search, and filter all use `allPosts`

### 4. `src/pages/StyleLibraryPage.tsx` — Supabase-first with mock fallback

**Before:** `const savedPosts = mockPosts.filter((post) => savedPostIds.includes(post.id));`

**After:**
```typescript
const allPosts = supabasePosts.length > 0 ? supabasePosts : mockPosts;
const savedPosts = allPosts.filter((post) => savedPostIds.includes(post.id));
```

- Accepts `posts?: Post[]` prop
- Saved posts filtered from Supabase data when available

### 5. `src/pages/AlbumDetailPage.tsx` — Supabase-first with mock fallback

**Before:** `const posts = album ? mockPosts.filter((post) => album.postIds.includes(post.id)) : [];`

**After:**
```typescript
const allPosts = supabasePosts.length > 0 ? supabasePosts : mockPosts;
const posts = album ? allPosts.filter((post) => album.postIds.includes(post.id)) : [];
```

- Accepts `posts?: Post[]` prop
- Album posts filtered from Supabase data when available

### 6. `src/pages/HomePage.tsx` — Not modified

HomePage.tsx is not rendered by App.tsx (the "home" page uses WelcomePage). It remains as-is with mockPosts for reference purposes.

---

## Fallback Strategy

| Scenario | Behaviour |
|----------|-----------|
| **Supabase has posts** | All pages use Supabase data exclusively |
| **Supabase empty or unreachable** | All pages fall back to `mockPosts.ts` |
| **Partial data** | Uses whatever Supabase returned (may be empty) |

The fallback is per-component: `supabasePosts.length > 0 ? supabasePosts : mockPosts`. This ensures the app always has content to display.

---

## Data Mapping

`backendPostToFrontendPost()` (from `matchingLogic.ts`) maps:

| Supabase Column | Frontend Type Field |
|----------------|-------------------|
| `creator_name` | `creatorName` |
| `image_url` | `image` |
| `description` | `caption` |
| `tags` | `hashtags` |
| `style_tags` | `styleTags` |
| `fit_tags` | `fitTags` |
| `gender_style` | `genderStyle` |
| `occasion_tags` | `occasionTags` |
| `size_range` | `sizeRange` |
| `height_range` | `heightRange` |
| `body_friendly_label` | `bodyFriendlyLabel` |
| `match_label_primary` | `matchLabelPrimary` |
| `match_label_secondary` | `matchLabelSecondary` |

---

## Prerequisites

1. Phase 5 migration applied (posts table with metadata columns)
2. Posts seeded in Supabase posts table
3. Backend running with Phase 6 routers registered

---

## Files Summary

| File | Action | Changes |
|------|--------|---------|
| `src/lib/backendApi.ts` | Modified | Added `getPosts()` function |
| `src/App.tsx` | Modified | Added `supabasePosts` state, fetch effect, prop passing |
| `src/pages/WelcomePage.tsx` | Modified | Added `posts` prop, Supabase-first with mock fallback |
| `src/pages/StyleLibraryPage.tsx` | Modified | Added `posts` prop, Supabase-first with mock fallback |
| `src/pages/AlbumDetailPage.tsx` | Modified | Added `posts` prop, Supabase-first with mock fallback |
| `src/pages/HomePage.tsx` | Not modified | Not rendered by App.tsx; kept as reference |
| `src/data/mockPosts.ts` | Not modified | Retained as development fallback |

## Verification

To verify a post inserted into Supabase appears in the app:

1. Insert a row into the `posts` table via Supabase SQL Editor:
   ```sql
   INSERT INTO posts (creator_name, image_url, description, style_tags, fit_tags, gender_style, occasion_tags, size_range, height_range, body_friendly_label, match_label_primary)
   VALUES ('Test Creator', 'https://example.com/image.jpg', 'Test post', ARRAY['minimal'], ARRAY['relaxed'], ARRAY['womenswear'], ARRAY['casual'], ARRAY['M'], '165-170cm', 'Casual minimal fit', 'Matches your minimal preference');
   ```

2. Start the backend: `cd backend && uvicorn app.main:app --reload`

3. Start the frontend: `npm run dev`

4. Navigate to the home page — the test post should appear in the feed.