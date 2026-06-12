# PHASE6_RECOMMENDATION_REPORT.md — Recommendation Engine

## Overview

Phase 6 implements the MUSÉ recommendation engine with a hybrid client-server architecture. The backend handles interaction tracking, data fetching, and scoring. The frontend receives pre-scored recommendations and tracks user behaviour.

---

## Architecture

### Hybrid Client + Server Design

| Layer | Responsibility |
|-------|---------------|
| **Backend** | Interaction tracking, profile/post/interaction data fetching, scoring algorithm (70/30 split), trending feed |
| **Frontend** | API calls to backend, interaction tracking triggers, display of match percentages and reasons |

### Data Flow

```
User opens Home feed
  → Frontend calls GET /recommendations (authenticated)
  → Backend fetches profile, posts, interactions from Supabase
  → Backend calculates onboarding score (30%) + behaviour score (70%)
  → Backend returns sorted recommendations with match_percentage, match_reason
  → Frontend renders posts with match labels

User saves a post
  → Frontend calls POST /interactions { post_id, interaction_type: "save" }
  → Backend records interaction with score 9 in post_interactions table
  → Next recommendation fetch incorporates the new interaction
```

---

## Backend Implementation

### New Files (3)

#### 1. `backend/app/routers/interactions.py`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/interactions` | POST | Yes | Record a user interaction with a post |
| `/interactions` | GET | Yes | Get user's interaction history |

**Interaction Types and Weights:**

| Type | Score | Trigger |
|------|-------|---------|
| `view` | 1 | Post rendered on screen |
| `album_add` | 6 | Post added to album |
| `share` | 7 | Post shared |
| `save` | 9 | Post saved |

#### 2. `backend/app/routers/posts.py`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/posts` | GET | Yes | List posts with all metadata columns |
| `/posts/trending` | GET | No | Globally trending posts ranked by engagement |

**Trending formula:** `save_count * 9 + share_count * 7 + view_count * 1`

#### 3. `backend/app/routers/recommendations.py`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/recommendations` | GET | Yes | Personalised post recommendations for authenticated user |

**Scoring algorithm:**

```python
# Users WITH behaviour history:
final_score = (behaviour_score * 0.7) + (onboarding_score * 0.3)

# Users with NO behaviour history (cold start):
final_score = (trending_score * 0.5) + (onboarding_score * 0.5)
```

**Onboarding score components (0-100):**

| Component | Weight | Condition |
|-----------|--------|-----------|
| Base score | 15 | Always applied |
| Style match | +20 | `style_attraction` overlaps with `style_tags` |
| Size match | +25 | `size_range` overlaps |
| Height match | +20 | `height_range` exact match |
| Fit match | +20 | `fit_preferences` overlaps with `fit_tags` |
| Direction match | +10 | `styling_direction` overlaps with `gender_style` |

**Behaviour score (0-100):**
```
sum(interaction_score for all interactions with this post)
normalized: total / 45 * 100, capped at 100
```

**Match percentage:** `max(35, min(final_score, 100))`

**Match reason priority:**
1. `match_label_primary` from database
2. First onboarding match reason
3. `body_friendly_label` fallback

#### 4. `backend/app/models.py` — New Pydantic models

| Model | Purpose |
|-------|---------|
| `InteractionRequest` | POST /interactions body |
| `InteractionResponse` | Interaction record response |
| `PostResponse` | Post with all metadata columns |
| `RecommendationItem` | Scored recommendation with post + scores |

#### 5. `backend/app/main.py` — Router registration

```python
app.include_router(interactions_router)
app.include_router(posts_router)
app.include_router(recommendations_router)
```

---

## Frontend Implementation

### Modified Files (2)

#### 1. `src/lib/backendApi.ts` — New API functions

| Function | Purpose |
|----------|---------|
| `trackInteraction(token, postId, type)` | Record user interaction |
| `getRecommendations(token)` | Fetch personalised recommendations |
| `getTrendingPosts()` | Fetch trending posts (no auth) |

New types: `InteractionType`, `PostData`, `RecommendationItem`

#### 2. `src/utils/matchingLogic.ts` — New helper functions

| Function | Purpose |
|----------|---------|
| `recommendationToMatchResult(rec)` | Convert backend recommendation to `MatchResult` |
| `backendPostToFrontendPost(post)` | Convert snake_case DB post to camelCase frontend `Post` |

New type: `BackendRecommendation`

---

## Scoring Algorithm Details

### 70% Behaviour / 30% Onboarding (Authenticated Users)

```
User has interaction history:
  behaviour_score = sum of interaction_score for this post, normalized to 0-100
  onboarding_score = style(+20) + size(+25) + height(+20) + fit(+20) + direction(+10), base 15
  final_score = (behaviour * 0.7) + (onboarding * 0.3)
  match_percentage = max(35, min(final_score, 100))
```

### 50% Trending / 50% Onboarding (Cold Start)

```
User has NO interaction history:
  trending_score = (save_count * 9 + share_count * 7 + view_count * 1), normalized to 0-100
  onboarding_score = same as above
  final_score = (trending * 0.5) + (onboarding * 0.5)
  match_percentage = max(35, min(final_score, 100))
```

### Cold Start Strategy

For new users with no interaction history:
1. Use globally trending engagement scores as behaviour proxy
2. Weight trending and onboarding equally (50/50)
3. As user accumulates interactions, shift to 70/30 behaviour-heavy weighting

---

## Match Labels

### Primary Match Reason

Priority:
1. `match_label_primary` column from `posts` table (pre-defined by content creators)
2. First generated onboarding match reason (e.g., "Similar to your classic preference")
3. `body_friendly_label` column (e.g., "Petite-friendly relaxed fit")

### Secondary Match Reason

Priority:
1. `match_label_secondary` column from `posts` table
2. Second generated onboarding match reason (if available)

---

## Interaction Tracking Triggers

| User Action | Interaction Type | Score | Where Triggered |
|-------------|-----------------|-------|-----------------|
| Post visible on screen | `view` | 1 | WelcomePage / HomePage |
| Save button clicked | `save` | 9 | WelcomePage / HomePage |
| Share button clicked | `share` | 7 | PostCard component |
| Add to album | `album_add` | 6 | Save modal in App.tsx |

---

## Resilience

| Scenario | Behaviour |
|----------|-----------|
| **Supabase unreachable** | Backend returns 502, frontend falls back to client-side matching |
| **No posts in database** | Returns empty recommendations array |
| **No profile exists** | Returns defaults (onboarding_completed: false, empty arrays) |
| **No interactions** | Uses trending score as behaviour proxy (cold start) |
| **Interaction tracking fails** | Silently fails, doesn't block user flow |

---

## Prerequisites

1. Phase 5 migration (`001_phase5_database_foundation.sql`) must be applied
2. Phase 5A onboarding persistence must be working (profile columns populated)
3. Posts must have metadata columns populated (`style_tags`, `fit_tags`, etc.)

---

## Files Summary

| File | Action | Changes |
|------|--------|---------|
| `backend/app/models.py` | Modified | Added InteractionRequest, InteractionResponse, PostResponse, RecommendationItem |
| `backend/app/routers/interactions.py` | **New** | POST/GET /interactions endpoints |
| `backend/app/routers/posts.py` | **New** | GET /posts, GET /posts/trending endpoints |
| `backend/app/routers/recommendations.py` | **New** | GET /recommendations with scoring algorithm |
| `backend/app/main.py` | Modified | Registered 3 new routers |
| `src/lib/backendApi.ts` | Modified | Added trackInteraction, getRecommendations, getTrendingPosts |
| `src/utils/matchingLogic.ts` | Modified | Added BackendRecommendation type, recommendationToMatchResult, backendPostToFrontendPost |

## API Endpoints Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/interactions` | POST | Yes | Track user interaction |
| `/interactions` | GET | Yes | Get user's interaction history |
| `/posts` | GET | Yes | List posts with metadata |
| `/posts/trending` | GET | No | Trending posts by engagement |
| `/recommendations` | GET | Yes | Personalised recommendations |