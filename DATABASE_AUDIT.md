# DATABASE_AUDIT.md — Supabase Schema Audit

## Current Schema (6 tables)

### 1. profiles

| Column | Type (inferred) | Notes |
|--------|----------------|-------|
| `id` | uuid (PK) | Likely references `auth.users.id` |
| `full_name` | text | |
| `created_at` | timestamptz | |

- **Row count:** 0
- **RLS:** Enabled (insert blocked for anon key)
- **Frontend usage:** None — not referenced anywhere in frontend code
- **Backend usage:** None — no endpoints read/write to this table
- **Issues:** Missing columns for Phase 5 (see below)

### 2. posts

| Column | Type (inferred) | Notes |
|--------|----------------|-------|
| `id` | uuid (PK) | |
| `creator_name` | text | |
| `image_url` | text | |
| `description` | text | |
| `tags` | text[] | Nullable, currently null |
| `style_category` | text | Nullable, currently null |
| `created_at` | timestamptz | |

- **Row count:** 1 (test row)
- **RLS:** Not blocking reads (anon can SELECT)
- **Frontend usage:** None — frontend uses hardcoded `mockPosts.ts` with `Post` type
- **Backend usage:** None — no endpoints read/write to this table
- **Issues:** Schema does NOT match the frontend `Post` type (see gap analysis)

### 3. saved_posts

| Column | Type (inferred) | Notes |
|--------|----------------|-------|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK) | Likely references `auth.users.id` |
| `post_id` | uuid (FK) | Likely references `posts.id` |
| `created_at` | timestamptz | |

- **Row count:** 0
- **RLS:** Enabled (insert blocked for anon key)
- **Frontend usage:** None — saved posts stored in localStorage (`muse:savedPosts`)
- **Backend usage:** None — no endpoints

### 4. albums

| Column | Type (inferred) | Notes |
|--------|----------------|-------|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK) | Likely references `auth.users.id` |
| `name` | text | |
| `created_at` | timestamptz | |

- **Row count:** 0
- **RLS:** Enabled (insert blocked for anon key)
- **Frontend usage:** None — albums stored in localStorage (`muse:albums`)
- **Backend usage:** None — no endpoints
- **Issues:** Missing `is_public`, `description`, `updated_at`

### 5. album_posts

| Column | Type (inferred) | Notes |
|--------|----------------|-------|
| `id` | uuid (PK) | |
| `album_id` | uuid (FK) | References `albums.id` |
| `post_id` | uuid (FK) | References `posts.id` |

- **Row count:** 0
- **RLS:** Not blocking (anon could INSERT — leaked test row was created)
- **Frontend usage:** None
- **Backend usage:** None

### 6. matching_scores

| Column | Type (inferred) | Notes |
|--------|----------------|-------|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK) | Likely references `auth.users.id` |
| `post_id` | uuid (FK) | References `posts.id` |
| `score` | numeric | |
| `created_at` | timestamptz | |

- **Row count:** 0
- **RLS:** Enabled (insert blocked for anon key)
- **Frontend usage:** None — matching calculated client-side via `matchingLogic.ts`
- **Backend usage:** None — no endpoints

---

## Phase 5 Requirements vs Current Schema

### 1. User Preferences Persistence

**Requirement:** Store onboarding answers and app preferences per user.

| Needed Column | Table | Status |
|---------------|-------|--------|
| `onboarding` (jsonb) | `profiles` | ❌ MISSING |
| `app_preferences` (jsonb) | `profiles` | ❌ MISSING |

**Current state:** Onboarding stored in `localStorage` key `muse:{userId}:onboarding`. No database persistence.

### 2. Saved Posts Persistence

**Requirement:** Store which posts a user has saved.

| Needed Column | Table | Status |
|---------------|-------|--------|
| `user_id` | `saved_posts` | ✅ EXISTS |
| `post_id` | `saved_posts` | ✅ EXISTS |

**Current state:** Schema exists but is unused. Data in localStorage.

### 3. Albums Persistence

**Requirement:** Store user-created albums.

| Needed Column | Table | Status |
|---------------|-------|--------|
| `user_id` | `albums` | ✅ EXISTS |
| `name` | `albums` | ✅ EXISTS |
| `description` | `albums` | ❌ MISSING |
| `updated_at` | `albums` | ❌ MISSING |

**Current state:** Schema exists but is unused. Data in localStorage.

### 4. Public/Private Albums

**Requirement:** Allow albums to be public or private.

| Needed Column | Table | Status |
|---------------|-------|--------|
| `is_public` | `albums` | ❌ MISSING |

**Current state:** Not possible with current schema.

### 5. Many-to-Many Albums ↔ Posts

**Requirement:** Multiple posts per album, multiple albums per post.

| Needed Column | Table | Status |
|---------------|-------|--------|
| `album_id` | `album_posts` | ✅ EXISTS |
| `post_id` | `album_posts` | ✅ EXISTS |

**Current state:** Junction table exists. Frontend stores `postIds[]` array inside `Album` type — needs migration to junction table pattern.

### 6. Recommendation Scoring

**Requirement:** Store match scores per user-post pair.

| Needed Column | Table | Status |
|---------------|-------|--------|
| `user_id` | `matching_scores` | ✅ EXISTS |
| `post_id` | `matching_scores` | ✅ EXISTS |
| `score` | `matching_scores` | ✅ EXISTS |
| `reason` | `matching_scores` | ❌ MISSING |

**Current state:** Schema exists but unused. Matching calculated client-side.

### 7. Trending Feed

**Requirement:** Show trending/popular posts based on engagement.

| Needed Column | Table | Status |
|---------------|-------|--------|
| `save_count` | `posts` | ❌ MISSING |
| `view_count` | `posts` | ❌ MISSING |
| `trending_score` | `posts` | ❌ MISSING |

**Current state:** No engagement tracking. No trending calculation.

### 8. Behaviour Tracking

**Requirement:** Track user interactions for recommendation improvement.

| Table | Status |
|-------|--------|
| `user_interactions` / `events` | ❌ MISSING (entire table) |

**Current state:** No behaviour tracking table exists.

---

## Critical Gap: `posts` Table vs Frontend `Post` Type

The frontend `Post` type has **17 fields**. The database `posts` table has **7 columns**. The mismatch:

| Frontend `Post` Field | Database Column | Status |
|----------------------|-----------------|--------|
| `id` | `id` | ✅ |
| `creatorName` | `creator_name` | ✅ (snake_case) |
| `image` | `image_url` | ⚠️ Name mismatch |
| `caption` | `description` | ⚠️ Name mismatch |
| `hashtags` | `tags` | ⚠️ Name mismatch |
| `styleTags` | — | ❌ MISSING |
| `sizeRange` | — | ❌ MISSING |
| `heightRange` | — | ❌ MISSING |
| `fitTags` | — | ❌ MISSING |
| `genderStyle` | — | ❌ MISSING |
| `occasionTags` | — | ❌ MISSING |
| `bodyFriendlyLabel` | — | ❌ MISSING |
| `matchLabelPrimary` | — | ❌ MISSING |
| `matchLabelSecondary` | — | ❌ MISSING |
| `style_category` | `style_category` | ✅ (not in frontend type) |

The matching algorithm (`calculateMatch`) depends on `styleTags`, `fitTags`, `genderStyle`, `sizeRange`, `heightRange`, `occasionTags`, and `bodyFriendlyLabel`. **None of these columns exist in the database.**

---

## Current Data Sources (No Database Usage)

| Data | Current Source | Database Table | Connected? |
|------|---------------|----------------|------------|
| Onboarding | localStorage | `profiles` | ❌ No |
| App preferences | localStorage | `profiles` | ❌ No |
| Posts/feed | `mockPosts.ts` (hardcoded) | `posts` | ❌ No |
| Saved posts | localStorage | `saved_posts` | ❌ No |
| Albums | localStorage | `albums` | ❌ No |
| Album ↔ post mapping | localStorage (array in Album) | `album_posts` | ❌ No |
| Match scores | Client-side calculation | `matching_scores` | ❌ No |

---

## Migration Requirements for Phase 5

### Schema Changes

1. **`profiles` table** — Add columns:
   - `onboarding jsonb DEFAULT '{}'`
   - `app_preferences jsonb DEFAULT '{}'`
   - `avatar_url text`
   - `updated_at timestamptz`

2. **`posts` table** — Add columns:
   - `style_tags text[]`
   - `fit_tags text[]`
   - `gender_style text[]`
   - `occasion_tags text[]`
   - `size_range text[]`
   - `height_range text`
   - `body_friendly_label text`
   - `match_label_primary text`
   - `match_label_secondary text`
   - `save_count int DEFAULT 0`
   - `view_count int DEFAULT 0`

3. **`albums` table** — Add columns:
   - `is_public boolean DEFAULT false`
   - `description text`
   - `updated_at timestamptz`

4. **`matching_scores` table** — Add column:
   - `reason text`

5. **New table: `user_interactions`** — For behaviour tracking:
   - `id uuid PK`
   - `user_id uuid FK`
   - `post_id uuid FK`
   - `interaction_type text` (view, save, unsave, click)
   - `created_at timestamptz`

### RLS Policies

All tables need RLS policies for:
- Users can only read/write their own data
- `posts` table readable by all authenticated users
- `albums` readable by owner, or public if `is_public = true`

### Backend Endpoints Needed

- `GET/PUT /profile` — Read/write user profile (onboarding, preferences)
- `GET /posts` — Fetch posts from database
- `GET/POST/DELETE /saved-posts` — CRUD saved posts
- `GET/POST/PUT/DELETE /albums` — CRUD albums
- `POST/DELETE /album-posts` — Add/remove posts from albums
- `GET /recommendations` — Get matched posts
- `POST /interactions` — Track user behaviour