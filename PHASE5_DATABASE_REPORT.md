# PHASE5_DATABASE_REPORT.md — Phase 5 Database Foundation

## Overview

This report documents the Phase 5 database schema changes required to support the recommendation engine, user preferences persistence, public/private albums, and behaviour tracking.

---

## Schema Changes

### 1. profiles Table — 7 New Columns

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `onboarding_completed` | boolean | `false` | Whether user has completed onboarding |
| `style_attraction` | text[] | `'{}'` | User's style preferences (maps to onboarding Q1) |
| `size_range` | text[] | `'{}'` | User's size range (maps to onboarding Q2) |
| `height_range` | text | `NULL` | User's height range (maps to onboarding Q2) |
| `fit_preferences` | text[] | `'{}'` | User's fit preferences (maps to onboarding Q3) |
| `styling_direction` | text[] | `'{}'` | User's styling direction (maps to onboarding Q4) |
| `updated_at` | timestamptz | `now()` | Last profile update timestamp |

**Purpose:** Enables server-side preference storage, replacing localStorage-only approach. The matching algorithm can query user preferences directly from the database.

### 2. posts Table — 12 New Columns

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `style_tags` | text[] | `'{}'` | Style categories (minimal, streetwear, etc.) |
| `fit_tags` | text[] | `'{}'` | Fit attributes (relaxed, structured, etc.) |
| `gender_style` | text[] | `'{}'` | Gender direction (womenswear, menswear, etc.) |
| `occasion_tags` | text[] | `'{}'` | Occasions (office, casual, formal, etc.) |
| `size_range` | text[] | `'{}'` | Applicable size ranges |
| `height_range` | text | `NULL` | Primary fit reference height |
| `body_friendly_label` | text | `NULL` | Human-readable fit description |
| `match_label_primary` | text | `NULL` | Primary match reason label |
| `match_label_secondary` | text | `NULL` | Secondary match reason label |
| `view_count` | int | `0` | Number of views |
| `save_count` | int | `0` | Number of saves |
| `share_count` | int | `0` | Number of shares |

**Purpose:** Structured metadata enables the matching algorithm to run server-side. Engagement counts enable trending feed calculation.

### 3. albums Table — 2 New Columns

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `is_public` | boolean | `false` | Whether album is publicly visible |
| `save_count` | int | `0` | Number of saves/bookmarks |

**Purpose:** Enables public/private album visibility and engagement tracking.

### 4. post_interactions Table — New Table

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `id` | uuid | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | — | References `profiles(id)` ON DELETE CASCADE |
| `post_id` | uuid | — | References `posts(id)` ON DELETE CASCADE |
| `interaction_type` | text | — | Type of interaction |
| `interaction_score` | int | `1` | Weighted score for the interaction |
| `created_at` | timestamptz | `now()` | When the interaction occurred |

**Interaction Types and Weights:**

| Type | Score | Description |
|------|-------|-------------|
| `view` | 1 | User viewed a post |
| `album_add` | 6 | User added post to an album |
| `share` | 7 | User shared a post |
| `save` | 9 | User saved a post |

**Purpose:** Behaviour tracking enables the recommendation engine to learn from user actions and improve personalised suggestions over time.

---

## Indexes

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| `posts` | `idx_posts_style_tags` | GIN | Fast array overlap queries for style matching |
| `posts` | `idx_posts_fit_tags` | GIN | Fast array overlap queries for fit matching |
| `posts` | `idx_posts_created_at` | B-tree | Chronological feed ordering |
| `post_interactions` | `idx_post_interactions_user` | B-tree | User interaction history lookup |
| `post_interactions` | `idx_post_interactions_post` | B-tree | Post engagement aggregation |
| `post_interactions` | `idx_post_interactions_type` | B-tree | Filter by interaction type |
| `post_interactions` | `idx_post_interactions_created` | B-tree | Time-series queries for trending |
| `albums` | `idx_albums_is_public` | Partial | Public album discovery (only indexes `true`) |

---

## RLS Policies

### post_interactions (new table)

| Policy | Operation | Rule |
|--------|-----------|------|
| "Users can insert own interactions" | INSERT | `auth.uid() = user_id` |
| "Users can read own interactions" | SELECT | `auth.uid() = user_id` |
| "Users can delete own interactions" | DELETE | `auth.uid() = user_id` |

### album_posts (security fix)

| Policy | Operation | Rule |
|--------|-----------|------|
| "Users can insert into own albums" | INSERT | Album owner = `auth.uid()` |
| "Users can read own album posts" | SELECT | Album owner = `auth.uid()` OR `is_public = true` |
| "Users can delete from own albums" | DELETE | Album owner = `auth.uid()` |

### albums (public visibility)

| Policy | Operation | Rule |
|--------|-----------|------|
| "Anyone can read public albums" | SELECT | `is_public = true` OR `user_id = auth.uid()` |

---

## Recommendation Engine Data Flow

### 1. User Completes Onboarding

```
Frontend → Backend API → profiles table
                         ├── style_attraction = ["minimal", "classic"]
                         ├── size_range = ["S-M"]
                         ├── height_range = "165-175 cm"
                         ├── fit_preferences = ["structured"]
                         ├── styling_direction = ["womenswear"]
                         └── onboarding_completed = true
```

### 2. User Interacts with Posts

```
Frontend → Backend API → post_interactions table
                         ├── user_id = auth.uid()
                         ├── post_id = post.uuid
                         ├── interaction_type = "save"
                         └── interaction_score = 9
```

### 3. Recommendation Scoring (Server-Side)

```sql
-- Example: Score a post for a user
SELECT
  p.id,
  (
    -- Style match (+20)
    CASE WHEN p.style_tags && user.style_attraction THEN 20 ELSE 0 END +
    -- Size match (+20-25)
    CASE WHEN p.size_range && user.size_range THEN 25 ELSE 0 END +
    -- Height match (+15-20)
    CASE WHEN p.height_range = user.height_range THEN 20 ELSE 0 END +
    -- Fit match (+20)
    CASE WHEN p.fit_tags && user.fit_preferences THEN 20 ELSE 0 END +
    -- Gender direction match (+10)
    CASE WHEN p.gender_style && user.styling_direction THEN 10 ELSE 0 END +
    -- Behaviour signal (+15)
    CASE WHEN EXISTS (
      SELECT 1 FROM post_interactions pi
      WHERE pi.user_id = user.id
      AND pi.interaction_type = 'save'
      AND pi.post_id IN (
        SELECT post_id FROM posts
        WHERE posts.occasion_tags && p.occasion_tags
      )
    ) THEN 15 ELSE 0 END
  ) AS match_score
FROM posts p
ORDER BY match_score DESC;
```

### 4. Trending Feed Calculation

```sql
-- Trending score = weighted engagement over time
SELECT
  p.id,
  (p.save_count * 9 + p.share_count * 7 + p.view_count * 1) /
  GREATEST(EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600, 1)
  AS trending_score
FROM posts p
ORDER BY trending_score DESC
LIMIT 20;
```

---

## Migration Safety

### Non-Destructive Changes

- All `ALTER TABLE` operations use `ADD COLUMN IF NOT EXISTS` — safe to re-run
- All `CREATE INDEX` operations use `IF NOT EXISTS` — safe to re-run
- All `CREATE TABLE` operations use `IF NOT EXISTS` — safe to re-run
- All new columns have `DEFAULT` values — no data loss for existing rows
- No existing columns are modified or dropped

### Rollback

```sql
-- Rollback script (if needed)
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS onboarding_completed,
  DROP COLUMN IF EXISTS style_attraction,
  DROP COLUMN IF EXISTS size_range,
  DROP COLUMN IF EXISTS height_range,
  DROP COLUMN IF EXISTS fit_preferences,
  DROP COLUMN IF EXISTS styling_direction,
  DROP COLUMN IF EXISTS updated_at;

ALTER TABLE public.posts
  DROP COLUMN IF EXISTS style_tags,
  DROP COLUMN IF EXISTS fit_tags,
  DROP COLUMN IF EXISTS gender_style,
  DROP COLUMN IF EXISTS occasion_tags,
  DROP COLUMN IF EXISTS size_range,
  DROP COLUMN IF EXISTS height_range,
  DROP COLUMN IF EXISTS body_friendly_label,
  DROP COLUMN IF EXISTS match_label_primary,
  DROP COLUMN IF EXISTS match_label_secondary,
  DROP COLUMN IF EXISTS view_count,
  DROP COLUMN IF EXISTS save_count,
  DROP COLUMN IF EXISTS share_count;

ALTER TABLE public.albums
  DROP COLUMN IF EXISTS is_public,
  DROP COLUMN IF EXISTS save_count;

DROP TABLE IF EXISTS public.post_interactions;
```

### Risks

| Risk | Mitigation |
|------|------------|
| Existing `profiles` RLS blocks new columns | RLS applies to rows, not columns — existing policies should work |
| `post_interactions` FK to `profiles` fails if no profile row | Application must ensure profile exists before inserting interactions |
| GIN indexes increase write latency | Acceptable for read-heavy workload (recommendation queries) |

---

## Future Scalability Considerations

| Consideration | Approach |
|---------------|----------|
| **Server-side matching** | Move `calculateMatch` logic to PostgreSQL function for better performance |
| **Materialized views** | Create `trending_posts` materialized view refreshed every 15 minutes |
| **Caching** | Cache recommendation scores in `matching_scores` table, refresh periodically |
| **A/B testing** | Add `algorithm_version` column to `matching_scores` for testing different scoring models |
| **Collaborative filtering** | Use `post_interactions` to find similar users and recommend based on their saves |
| **Real-time updates** | Use Supabase Realtime to push new recommendations when preferences change |
| **Analytics** | Aggregate `post_interactions` for style trend analysis and creator insights |
| **Tag validation** | Add CHECK constraints or application-level validation for controlled vocabularies |

---

## Files

| File | Description |
|------|-------------|
| `backend/migrations/001_phase5_database_foundation.sql` | Complete migration SQL |
| `PHASE5_POST_METADATA_PLAN.md` | Post metadata schema design |
| `DATABASE_AUDIT.md` | Pre-migration schema audit |
| `DATABASE_SCHEMA_REPORT.md` | Pre-migration column details |