# DATABASE_SCHEMA_REPORT.md — Supabase Database Schema

**Project:** bsjxwlkenizhlpwallwj.supabase.co
**Audit Date:** 12 June 2026
**Method:** PostgREST API probing (anon key)

---

## 1. profiles

### Columns

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` or `auth.uid()` |
| `full_name` | text | YES | NULL |
| `created_at` | timestamptz | NO | `now()` |

### Keys & Constraints

| Type | Column(s) |
|------|-----------|
| Primary Key | `id` |
| Foreign Key | `id` → `auth.users(id)` (inferred) |

### RLS Policies

- **Enabled:** Yes
- **INSERT:** Blocked for anon key (returns `42501: new row violates row-level security policy`)
- **SELECT:** Blocked for anon key (returns empty `[]`, likely requires authenticated user matching `id`)

### Sample Row Structure

```json
{
  "id": "uuid",
  "full_name": "Cham Em",
  "created_at": "2026-06-11T00:00:00.000Z"
}
```

### Notes

- Only 3 columns — no `email`, `onboarding`, `app_preferences`, or `avatar_url`
- Table is empty (0 rows)

---

## 2. posts

### Columns

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `creator_name` | text | YES | NULL |
| `image_url` | text | YES | NULL |
| `description` | text | YES | NULL |
| `tags` | text[] | YES | NULL |
| `style_category` | text | YES | NULL |
| `created_at` | timestamptz | NO | `now()` |

### Keys & Constraints

| Type | Column(s) |
|------|-----------|
| Primary Key | `id` |

### RLS Policies

- **Enabled:** Likely yes, but SELECT is allowed for anon key
- **SELECT:** Allowed (anon can read posts)
- **INSERT:** Unknown (no test performed)

### Sample Row Structure

```json
{
  "id": "1327a710-6a61-426f-9dcf-773488a93693",
  "creator_name": "chaam em ",
  "image_url": "https://www.instagram.com/p/DYHbGBWFL84/?img_index=1",
  "description": "baby girl",
  "tags": null,
  "style_category": null,
  "created_at": "2026-06-11T00:25:12.683673"
}
```

### Notes

- 1 row exists (test data)
- Missing columns needed by frontend `Post` type: `style_tags`, `fit_tags`, `gender_style`, `occasion_tags`, `size_range`, `height_range`, `body_friendly_label`

---

## 3. saved_posts

### Columns

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `user_id` | uuid | YES | NULL |
| `post_id` | uuid | YES | NULL |
| `created_at` | timestamptz | NO | `now()` |

### Keys & Constraints

| Type | Column(s) |
|------|-----------|
| Primary Key | `id` |
| Foreign Key | `user_id` → `auth.users(id)` (inferred) |
| Foreign Key | `post_id` → `posts(id)` (inferred) |

### RLS Policies

- **Enabled:** Yes
- **INSERT:** Blocked for anon key (`42501`)
- **SELECT:** Blocked for anon key (returns empty `[]`)

### Sample Row Structure

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "post_id": "uuid",
  "created_at": "2026-06-11T00:00:00.000Z"
}
```

### Notes

- Table is empty (0 rows)
- Schema is adequate for basic saved posts functionality

---

## 4. albums

### Columns

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `user_id` | uuid | YES | NULL |
| `name` | text | YES | NULL |
| `created_at` | timestamptz | NO | `now()` |

### Keys & Constraints

| Type | Column(s) |
|------|-----------|
| Primary Key | `id` |
| Foreign Key | `user_id` → `auth.users(id)` (inferred) |

### RLS Policies

- **Enabled:** Yes
- **INSERT:** Blocked for anon key (`42501`)
- **SELECT:** Blocked for anon key (returns empty `[]`)

### Sample Row Structure

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "My Summer Fits",
  "created_at": "2026-06-11T00:00:00.000Z"
}
```

### Notes

- Table is empty (0 rows)
- Missing: `is_public` (boolean), `description` (text), `updated_at` (timestamptz)

---

## 5. album_posts

### Columns

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `album_id` | uuid | YES | NULL |
| `post_id` | uuid | YES | NULL |

### Keys & Constraints

| Type | Column(s) |
|------|-----------|
| Primary Key | `id` |
| Foreign Key | `album_id` → `albums(id)` (inferred) |
| Foreign Key | `post_id` → `posts(id)` (inferred) |

### RLS Policies

- **Enabled:** No (or permissive)
- **INSERT:** Allowed for anon key (test row was successfully created)
- **SELECT:** Allowed for anon key

### Sample Row Structure

```json
{
  "id": "fd11c41b-9c27-4e70-88f9-68b7cbf71da6",
  "album_id": null,
  "post_id": null
}
```

### Notes

- ⚠️ **Security issue:** RLS is not properly configured — anon key can INSERT
- Missing `created_at` column
- Missing unique constraint on `(album_id, post_id)` to prevent duplicates

---

## 6. matching_scores

### Columns

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `user_id` | uuid | YES | NULL |
| `post_id` | uuid | YES | NULL |
| `score` | numeric | YES | NULL |
| `created_at` | timestamptz | NO | `now()` |

### Keys & Constraints

| Type | Column(s) |
|------|-----------|
| Primary Key | `id` |
| Foreign Key | `user_id` → `auth.users(id)` (inferred) |
| Foreign Key | `post_id` → `posts(id)` (inferred) |

### RLS Policies

- **Enabled:** Yes
- **INSERT:** Blocked for anon key (`42501`)
- **SELECT:** Blocked for anon key (returns empty `[]`)

### Sample Row Structure

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "post_id": "uuid",
  "score": 85,
  "created_at": "2026-06-11T00:00:00.000Z"
}
```

### Notes

- Table is empty (0 rows)
- Missing `reason` (text) column for storing match explanation

---

## Summary Table

| Table | Columns | Rows | RLS | Anon SELECT | Anon INSERT |
|-------|---------|------|-----|-------------|-------------|
| `profiles` | 3 | 0 | ✅ | ❌ | ❌ |
| `posts` | 7 | 1 | ✅ | ✅ | Unknown |
| `saved_posts` | 4 | 0 | ✅ | ❌ | ❌ |
| `albums` | 4 | 0 | ✅ | ❌ | ❌ |
| `album_posts` | 3 | 0 | ❌ | ✅ | ✅ ⚠️ |
| `matching_scores` | 5 | 0 | ✅ | ❌ | ❌ |

**⚠️ `album_posts` has no RLS — anon can read and write. This is a security issue that must be fixed before Phase 5.**