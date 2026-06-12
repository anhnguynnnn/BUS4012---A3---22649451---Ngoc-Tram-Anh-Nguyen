# PHASE5_POST_METADATA_PLAN.md — Post Metadata Schema for Recommendation Engine

## Current State

### posts Table (7 columns)

| Column | Type | Used by Matching? |
|--------|------|-------------------|
| `id` | uuid | Yes (identity) |
| `creator_name` | text | No |
| `image_url` | text | No |
| `description` | No (display only) |
| `tags` | text[] | Not mapped to matching logic |
| `style_category` | text | Single value, not used by matching |
| `created_at` | timestamptz | No (could be used for trending) |

### Frontend Post Type (what matching logic needs)

| Field | Type | Matching Usage |
|-------|------|----------------|
| `styleTags` | string[] | Matches against `onboarding.styleAttraction` (weight: +20) |
| `fitTags` | string[] | Matches against `onboarding.fitPreferences` (weight: +20) |
| `genderStyle` | string[] | Matches against `onboarding.stylingDirection` (weight: +10) |
| `sizeRange` | string[] | Matches against `onboarding.sizeRange` (weight: +20–25) |
| `heightRange` | string | Matches against `onboarding.heightRange` (weight: +15–20) |
| `occasionTags` | string[] | Used for saved-post signal matching (weight: +15) |
| `bodyFriendlyLabel` | string | Fallback match reason |

**Gap:** The database has 2 generic columns (`tags`, `style_category`). The matching engine needs 6 structured metadata fields.

---

## Proposed Schema

### Option A: Structured Columns (Recommended)

Add dedicated `text[]` columns to `posts` for each metadata dimension.

```sql
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS style_tags        text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS fit_tags          text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS gender_style      text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS occasion_tags     text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS size_range        text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS height_range      text,
  ADD COLUMN IF NOT EXISTS body_friendly_label text,
  ADD COLUMN IF NOT EXISTS match_label_primary text,
  ADD COLUMN IF NOT EXISTS match_label_secondary text;
```

**Pros:**
- Direct mapping to matching logic (no JSON parsing)
- PostgreSQL `text[]` supports GIN indexing for fast overlap queries
- Type-safe, queryable with standard SQL
- Easy to validate with CHECK constraints

**Cons:**
- More columns to manage
- Schema changes needed if new dimensions are added

### Option B: Single JSONB Column

```sql
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
```

Store all metadata in one JSONB column:
```json
{
  "style_tags": ["minimal", "clean"],
  "fit_tags": ["relaxed fit"],
  "gender_style": ["womenswear"],
  "occasion_tags": ["casual", "office"],
  "size_range": ["S-M"],
  "height_range": "155-165 cm",
  "body_friendly_label": "Petite-friendly relaxed fit"
}
```

**Pros:**
- Flexible, no schema changes for new dimensions
- Single column to manage

**Cons:**
- Requires JSONB extraction in queries
- Less type-safe
- Harder to validate
- More complex matching queries

**Recommendation: Option A** — structured columns directly support the matching algorithm and allow PostgreSQL array operations.

---

## Metadata Taxonomy

### style_tags (maps to `onboarding.styleAttraction`)

| Value | Normalised Form | Description |
|-------|----------------|-------------|
| `minimal` | `minimal` | Clean lines, neutral palette |
| `clean` | `clean` | Minimal / clean aesthetic |
| `streetwear` | `streetwear` | Urban, casual, graphic-led |
| `feminine` | `feminine` | Soft, flowing, delicate |
| `soft` | `soft` | Feminine / soft aesthetic |
| `classic` | `classic` | Timeless, tailored |
| `tailored` | `tailored` | Classic / tailored aesthetic |
| `trend-driven` | `trend-driven` | Seasonal trends, fast fashion |

**Usage:** `text[]` — a post can have multiple style tags (e.g., `{"minimal", "classic"}`).

### gender_style (maps to `onboarding.stylingDirection`)

| Value | Description |
|-------|-------------|
| `womenswear` | Women's fashion |
| `menswear` | Men's fashion |
| `gender-neutral` | Unisex / gender-neutral |

**Usage:** `text[]` — typically one value, but can have multiple for crossover styles.

### fit_tags (maps to `onboarding.fitPreferences`)

| Value | Normalised Form | Description |
|-------|----------------|-------------|
| `highlight waist` | `highlight waist` | Defines waistline |
| `balance proportions` | `balance proportions` | Balances body proportions |
| `more coverage` | `more coverage` | Modest / covered styling |
| `relaxed fit` | `relaxed fit` | Loose, comfortable |
| `loose fit` | `loose fit` | Relaxed / loose fits |
| `structured` | `structured` | Add structure to outfits |

**Usage:** `text[]` — a post can have multiple fit attributes.

### occasion_tags (used for saved-post signal matching)

| Value | Description |
|-------|-------------|
| `office` | Workplace appropriate |
| `formal` | Formal events, evening |
| `casual` | Everyday wear |
| `streetwear` | Urban streetwear |
| `date night` | Evening social |
| `brunch` | Daytime social |
| `travel` | Travel-friendly |
| `weekend` | Relaxed weekend |

**Usage:** `text[]` — a post can suit multiple occasions.

### size_range (maps to `onboarding.sizeRange`)

| Value | Description |
|-------|-------------|
| `XXS-XS` | Extra small |
| `S-M` | Small to medium |
| `M-L` | Medium to large |
| `L-XL` | Large to extra large |
| `XL+` | Plus size |

**Usage:** `text[]` — a post can reference multiple size ranges.

### height_range (maps to `onboarding.heightRange`)

| Value | Description |
|-------|-------------|
| `Under 155 cm` | Petite |
| `155-165 cm` | Average petite |
| `165-175 cm` | Average tall |
| `175+ cm` | Tall |

**Usage:** `text` — single value per post (the primary fit reference height).

---

## Matching Data Flow

```
Post Metadata (DB)          Onboarding Answers (User)
─────────────────           ─────────────────────────
style_tags[]        ←→      styleAttraction[]
fit_tags[]          ←→      fitPreferences[]
gender_style[]      ←→      stylingDirection[]
size_range[]        ←→      sizeRange[]
height_range        ←→      heightRange
occasion_tags[]     ←→      savedPosts signals (cross-reference)
```

### Matching Algorithm Input/Output

```
Input:  post.style_tags, user.styleAttraction
Output: +20 score if overlap detected

Input:  post.size_range, user.sizeRange
Output: +20–25 score if overlap detected

Input:  post.height_range, user.heightRange
Output: +15–20 score if exact match

Input:  post.fit_tags, user.fitPreferences
Output: +20 score if overlap detected

Input:  post.gender_style, user.stylingDirection
Output: +10 score if overlap detected

Input:  post.occasion_tags, savedPosts[*].occasion_tags
Output: +15 score if overlap with saved post signals
```

---

## Column Summary for Migration

### New Columns on `posts`

| Column | Type | Nullable | Default | Index |
|--------|------|----------|---------|-------|
| `style_tags` | text[] | NO | `'{}'` | GIN |
| `fit_tags` | text[] | NO | `'{}'` | GIN |
| `gender_style` | text[] | NO | `'{}'` | — |
| `occasion_tags` | text[] | NO | `'{}'` | — |
| `size_range` | text[] | NO | `'{}'` | — |
| `height_range` | text | YES | NULL | — |
| `body_friendly_label` | text | YES | NULL | — |
| `match_label_primary` | text | YES | NULL | — |
| `match_label_secondary` | text | YES | NULL | — |

### Recommended Indexes

```sql
CREATE INDEX idx_posts_style_tags ON public.posts USING GIN (style_tags);
CREATE INDEX idx_posts_fit_tags ON public.posts USING GIN (fit_tags);
CREATE INDEX idx_posts_created_at ON public.posts (created_at DESC);
```

GIN indexes on `style_tags` and `fit_tags` enable fast array overlap queries (`&&` operator) used by the matching algorithm.

### Compatibility with Existing `tags` and `style_category`

| Existing Column | Action |
|----------------|--------|
| `tags` | Keep — may be used for search/discovery. Migrate useful values to `style_tags` or `occasion_tags`. |
| `style_category` | Keep — may be used for filtering. Single value can be copied to `style_tags` array. |

These columns are additive — no existing data is lost.

---

## Sample Row (After Migration)

```json
{
  "id": "uuid",
  "creator_name": "Cham Em",
  "image_url": "https://...",
  "description": "Relaxed office look with structured blazer",
  "tags": ["blazer", "neutral"],
  "style_category": "classic",
  "style_tags": ["classic", "tailored", "minimal"],
  "fit_tags": ["structured", "balance proportions"],
  "gender_style": ["womenswear"],
  "occasion_tags": ["office", "casual"],
  "size_range": ["S-M", "M-L"],
  "height_range": "155-165 cm",
  "body_friendly_label": "Balanced fit for average height",
  "match_label_primary": "Classic tailored",
  "match_label_secondary": "Office-ready structured fit",
  "created_at": "2026-06-11T00:00:00.000Z"
}
```

---

## Future Scalability

| Consideration | Approach |
|---------------|----------|
| New style categories | Add value to `style_tags` array — no schema change |
| New occasion types | Add value to `occasion_tags` array — no schema change |
| New fit attributes | Add value to `fit_tags` array — no schema change |
| Seasonal tags | Add `season_tags text[]` column when needed |
| Trending calculation | Add `save_count`, `view_count` columns |
| Tag validation | Use CHECK constraints or application-level validation |
| Tag normalization | Enforce lowercase in application layer (matching logic already normalises) |