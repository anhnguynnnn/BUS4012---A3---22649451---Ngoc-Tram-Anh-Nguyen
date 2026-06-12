# MUSÉ MVP — Final Architecture Document

**Version:** 1.0 (MVP)  
**Date:** 12 June 2026  
**Stack:** React 18 + TypeScript + Vite | FastAPI (Python) | Supabase

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│  Vite Dev Server :5173                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │  Pages   │ │Components│ │  Hooks   │ │   Context  │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘ │
│       └─────────────┴────────────┴─────────────┘        │
│                        │ backendApi.ts                   │
│                        │ (Vite proxy → localhost:8000)   │
└────────────────────────┼────────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────────┐
│                   Backend (FastAPI)                      │
│  uvicorn :8000                                          │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────┐│
│  │AuthRouter│ │PostRouter│ │Interaction│ │ Recommend. ││
│  │ /auth/*  │ │ /posts/* │ │  Router   │ │   Router   ││
│  └────┬─────┘ └────┬─────┘ └─────┬─────┘ └─────┬─────┘│
│       └─────────────┴─────────────┴─────────────┘      │
│                        │ supabase_auth.py / httpx       │
└────────────────────────┼────────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────────┐
│                    Supabase (BaaS)                       │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────┐│
│  │   Auth   │ │ PostgREST│ │ PostgreSQL│ │   RLS     ││
│  │ (JWT)    │ │  (REST)  │ │  (Tables) │ │ (Policies)││
│  └──────────┘ └──────────┘ └───────────┘ └───────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture

### 2.1 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React 18 | Component-based UI with hooks |
| Language | TypeScript | Type safety, IDE tooling |
| Build | Vite | Fast HMR, production bundling |
| Styling | Tailwind CSS 3.4 | Utility-first CSS framework |
| Icons | Lucide React | SVG icon library |
| State | React Context + useState | Auth context, local component state |
| Routing | Page state (`useState<Page>`) | Client-side navigation via state machine |

### 2.2 Project Structure

```
src/
├── App.tsx                    # Root component, page routing, all app logic
├── main.tsx                   # React DOM entry point
├── types.ts                   # Shared TypeScript types (Page, Post, Album, etc.)
├── vite-env.d.ts              # Vite environment type declarations
├── index.css                  # Global styles + Tailwind directives
│
├── components/                # Reusable UI components
│   ├── AlbumCard.tsx          # Album preview card
│   ├── AuthModal.tsx          # Login/signup/entry modal
│   ├── Button.tsx             # Styled button (primary/secondary/ghost)
│   ├── Input.tsx              # Styled text input
│   ├── Layout.tsx             # Page layout wrapper
│   ├── Navigation.tsx         # Bottom/side navigation bar
│   ├── PostCard.tsx           # Fashion post card with save/match
│   ├── ProtectedRoute.tsx     # Auth-gated route wrapper
│   └── QuestionOption.tsx     # Onboarding option selector
│
├── contexts/
│   └── AuthContext.tsx         # Supabase auth state provider
│
├── hooks/
│   └── useAuth.ts             # AuthContext consumer hook
│
├── lib/
│   └── backendApi.ts          # API client (signup, login, profile, posts, recommendations)
│
├── pages/                     # Route-level page components
│   ├── WelcomePage.tsx        # Landing page with feed
│   ├── LoginPage.tsx          # Standalone login (unused — modal preferred)
│   ├── SignUpPage.tsx          # Standalone signup (unused — modal preferred)
│   ├── OnboardingStylePage    # Onboarding step 1: style attraction
│   ├── OnboardingBodyPage     # Onboarding step 2: body reference
│   ├── OnboardingFitPage      # Onboarding step 3: fit preferences
│   ├── OnboardingDirectionPage# Onboarding step 4: styling direction
│   ├── HomePage.tsx            # Authenticated home feed
│   ├── StyleLibraryPage.tsx   # Saved posts + albums
│   ├── AlbumDetailPage.tsx    # Single album view
│   ├── AccountPage.tsx        # User profile + onboarding summary
│   ├── AppPreferencePage.tsx  # App settings (match %, experimental styles)
│   ├── SettingsPage.tsx       # Account settings (clear data, logout)
│   └── PrivacyPage.tsx        # Privacy policy
│
├── utils/
│   ├── matchingLogic.ts       # Client-side match calculation + backend data mappers
│   └── storage.ts             # localStorage abstraction with user scoping
│
└── data/
    └── mockPosts.ts           # Fallback mock data (unused when backend is live)
```

### 2.3 Routing Model

The app uses a **state-machine router** instead of React Router:

```typescript
type Page = "welcome" | "login" | "signup" | "onboarding-style" | "onboarding-body" |
            "onboarding-fit" | "onboarding-direction" | "home" | "library" |
            "album-detail" | "account" | "app-preferences" | "settings" | "privacy";
```

`AppContent` renders the appropriate page component based on `page` state. This eliminates the need for a routing library dependency.

### 2.4 State Management

| State | Location | Persistence |
|-------|----------|-------------|
| Auth session | `AuthContext` | localStorage (tokens) |
| Page navigation | `AppContent.useState` | None (transient) |
| Onboarding answers | `AppContent.useState` | localStorage + Supabase |
| Saved post IDs | `AppContent.useState` | localStorage |
| Albums | `AppContent.useState` | localStorage |
| App preferences | `AppContent.useState` | localStorage |
| Posts (feed) | `AppContent.useState` | Fetched on mount |
| Backend health | `AppContent.useState` | Fetched on mount |

### 2.5 Vite Proxy Configuration

```typescript
// vite.config.ts
server: {
  proxy: {
    "/auth":          { target: "http://localhost:8000" },
    "/interactions":  { target: "http://localhost:8000" },
    "/posts":         { target: "http://localhost:8000" },
    "/recommendations": { target: "http://localhost:8000" },
    "/health":        { target: "http://localhost:8000" },
  }
}
```

All API requests use relative paths (e.g., `fetch("/auth/login")`) and are proxied to the FastAPI backend during development. This avoids CORS issues and keeps Supabase credentials server-side only.

---

## 3. Backend Architecture

### 3.1 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | FastAPI | 0.115.0 |
| Server | Uvicorn | 0.30.0 |
| HTTP Client | httpx | 0.27.0 |
| Validation | Pydantic (with email) | 2.9.0 |
| Environment | python-dotenv | 1.0.1 |

### 3.2 Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, router registration, health endpoint
│   ├── config.py            # Environment variable loading + validation
│   ├── models.py            # Pydantic request/response models
│   ├── supabase_auth.py     # Supabase Auth + PostgREST client functions
│   └── routers/
│       ├── auth.py           # /auth/signup, /auth/login, /auth/logout, /auth/me, /auth/profile
│       ├── posts.py          # /posts, /posts/trending
│       ├── interactions.py   # /interactions (POST track, GET history)
│       └── recommendations.py# /recommendations (personalised feed)
├── migrations/
│   ├── 001_phase5_database_foundation.sql  # Schema extensions
│   └── 002_seed_sample_posts.sql           # Sample data
├── seeds/
│   └── sample_posts.sql     # Additional seed data
├── requirements.txt         # Python dependencies
├── .env                     # Supabase credentials (gitignored)
└── .env.example             # Template for .env
```

### 3.3 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/signup` | No | Create user via Supabase Auth |
| `POST` | `/auth/login` | No | Password grant → JWT tokens |
| `POST` | `/auth/logout` | Bearer | Invalidate Supabase session |
| `GET` | `/auth/me` | Bearer | Return authenticated user profile |
| `GET` | `/auth/profile` | Bearer | Return onboarding data from profiles table |
| `PUT` | `/auth/profile` | Bearer | Update onboarding/preferences in profiles table |
| `GET` | `/posts` | Optional | List posts with metadata (limit, offset) |
| `GET` | `/posts/trending` | No | Trending posts by engagement |
| `POST` | `/interactions` | Bearer | Record user interaction (view/save/share/album_add) |
| `GET` | `/interactions` | Bearer | Get user's interaction history |
| `GET` | `/recommendations` | Bearer | Personalised post recommendations |
| `GET` | `/health` | No | Health check |

### 3.4 CORS Configuration

```python
ALLOWED_ORIGINS = [
    "http://localhost:5173",   # Vite default
    "http://localhost:5174",   # Vite fallback
    FRONTEND_ORIGIN,           # From .env
]
```

---

## 4. Supabase Integration

### 4.1 Authentication

MUSÉ uses **Supabase Auth** with email/password authentication. The backend acts as a proxy — the frontend never communicates directly with Supabase.

**Auth Flow:**

```
Frontend → POST /auth/signup → FastAPI → Supabase Auth REST API
                                        ← access_token + refresh_token
Frontend stores tokens in localStorage

Frontend → POST /auth/login → FastAPI → Supabase Auth REST API (grant_type=password)
                                       ← access_token + refresh_token + user
Frontend stores tokens, fetches /auth/me for enriched profile

Frontend → GET /auth/me → FastAPI → Supabase Auth REST API (GET /auth/v1/user)
                                    ← user object with metadata

Frontend → POST /auth/logout → FastAPI → Supabase Auth REST API (POST /auth/v1/logout)
Frontend clears localStorage tokens
```

### 4.2 Data Access (PostgREST)

All database operations go through Supabase's **PostgREST** layer using `httpx`:

```
FastAPI → GET {SUPABASE_URL}/rest/v1/posts → PostgREST → PostgreSQL
FastAPI → PATCH {SUPABASE_URL}/rest/v1/profiles → PostgREST → PostgreSQL
FastAPI → POST {SUPABASE_URL}/rest/v1/post_interactions → PostgREST → PostgreSQL
```

### 4.3 Row Level Security (RLS)

| Table | Policy | Rule |
|-------|--------|------|
| `post_interactions` | INSERT | `auth.uid() = user_id` |
| `post_interactions` | SELECT | `auth.uid() = user_id` |
| `post_interactions` | DELETE | `auth.uid() = user_id` |
| `album_posts` | INSERT | Album belongs to authenticated user |
| `album_posts` | SELECT | Album belongs to user OR album is public |
| `album_posts` | DELETE | Album belongs to authenticated user |
| `albums` | SELECT | `is_public = true OR user_id = auth.uid()` |

---

## 5. Recommendation Engine

### 5.1 Scoring Architecture

The recommendation engine runs server-side in `backend/app/routers/recommendations.py`.

```
                    ┌─────────────────────┐
                    │   User Request      │
                    │  GET /recommendations│
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Fetch from Supabase │
                    │  • Profile           │
                    │  • Posts             │
                    │  • Interactions      │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼─────────┐     │    ┌───────────▼───────────┐
    │  Onboarding Score  │     │    │   Behaviour Score     │
    │  (per post)        │     │    │   (per post)          │
    │                    │     │    │                       │
    │  Style match  +20  │     │    │  If has_interactions:  │
    │  Size match   +25  │     │    │    Σ(interaction_score)│
    │  Height match +20  │     │    │    normalised to 0-100│
    │  Fit match    +20  │     │    │                       │
    │  Direction    +10  │     │    │  If no history:        │
    │  Base score   +15  │     │    │    trending_score()    │
    │  (max 100)         │     │    │    (engagement-based)  │
    └─────────┬─────────┘     │    └───────────┬───────────┘
              │                │                │
              └────────────────┼────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Score Combination  │
                    │                      │
                    │  Has interactions:    │
                    │    final = 0.7×beh +  │
                    │            0.3×ob    │
                    │                      │
                    │  No interactions:     │
                    │    final = 0.5×beh +  │
                    │            0.5×ob    │
                    │                      │
                    │  match% = max(35,     │
                    │    min(final, 100))   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Sort by final_score │
                    │  Return top N posts  │
                    └─────────────────────┘
```

### 5.2 Interaction Weights

| Interaction | Score | Description |
|-------------|-------|-------------|
| `view` | 1 | User viewed a post |
| `album_add` | 6 | User added post to album |
| `share` | 7 | User shared a post |
| `save` | 9 | User saved/bookmarked a post |

### 5.3 Onboarding Score Breakdown

| Factor | Max Points | Matching Logic |
|--------|-----------|----------------|
| Base score | 15 | All posts start at 15 |
| Style attraction | +20 | Normalised overlap between user's `style_attraction` and post's `style_tags` |
| Size range | +25 | Overlap between user's `size_range` and post's `size_range` |
| Height range | +20 | Exact match between user's `height_range` and post's `height_range` |
| Fit preferences | +20 | Overlap between user's `fit_preferences` and post's `fit_tags` |
| Styling direction | +10 | Overlap between user's `styling_direction` and post's `gender_style` |
| **Maximum** | **100** | Capped at 100 |

### 5.4 Client-Side Fallback

`src/utils/matchingLogic.ts` contains a client-side `calculateMatch()` function used as a fallback when the backend is unavailable. It mirrors the same scoring logic using the frontend's onboarding state and saved posts.

---

## 6. Database Schema

### 6.1 Entity Relationship

```
┌──────────────┐     ┌──────────────┐     ┌───────────────────┐
│   profiles   │     │    posts     │     │ post_interactions  │
│──────────────│     │──────────────│     │───────────────────│
│ id (PK, FK)  │     │ id (PK)      │     │ id (PK)           │
│ full_name    │     │ creator_name │     │ user_id (FK→prof.) │
│ onboarding_* │     │ image_url    │     │ post_id (FK→posts) │
│ style_attr.  │     │ description  │     │ interaction_type   │
│ size_range   │     │ tags         │     │ interaction_score  │
│ height_range │     │ style_tags   │     │ created_at         │
│ fit_prefs    │     │ fit_tags     │     └───────────────────┘
│ styling_dir. │     │ gender_style │
│ updated_at   │     │ occasion_tags│     ┌──────────────┐
└──────┬───────┘     │ size_range   │     │   albums     │
       │             │ height_range │     │──────────────│
       │             │ body_friendly│     │ id (PK)      │
       │             │ match_label_*│     │ user_id (FK) │
       │             │ view_count   │     │ name         │
       │             │ save_count   │     │ is_public    │
       │             │ share_count  │     │ save_count   │
       │             │ created_at   │     │ created_at   │
       │             └──────────────┘     └──────┬───────┘
       │                                        │
       │             ┌──────────────┐            │
       │             │ album_posts  │            │
       │             │──────────────│            │
       └────────────→│ album_id(FK) │←───────────┘
                     │ post_id (FK) │
                     └──────────────┘
```

### 6.2 Table Definitions

#### `profiles`
Extends Supabase `auth.users`. Created by database trigger on signup.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | uuid (PK, FK → auth.users) | — | User ID |
| `full_name` | text | null | Display name |
| `onboarding_completed` | boolean | false | Whether user finished onboarding |
| `style_attraction` | text[] | '{}' | Selected style preferences |
| `size_range` | text[] | '{}' | Body size preferences |
| `height_range` | text | null | Height range preference |
| `fit_preferences` | text[] | '{}' | Fit style preferences |
| `styling_direction` | text[] | '{}' | Gender style direction |
| `updated_at` | timestamptz | now() | Last profile update |

#### `posts`
Fashion content items with recommendation metadata.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | uuid (PK) | gen_random_uuid() | Post ID |
| `creator_name` | text | — | Creator display name |
| `image_url` | text | — | Image URL |
| `description` | text | — | Post caption |
| `tags` | text[] | — | General hashtags |
| `style_category` | text | — | Primary style category |
| `style_tags` | text[] | '{}' | Style classification tags |
| `fit_tags` | text[] | '{}' | Fit classification tags |
| `gender_style` | text[] | '{}' | Gender direction tags |
| `occasion_tags` | text[] | '{}' | Occasion tags |
| `size_range` | text[] | '{}' | Applicable sizes |
| `height_range` | text | null | Target height range |
| `body_friendly_label` | text | null | Body-positive description |
| `match_label_primary` | text | null | Primary match reason label |
| `match_label_secondary` | text | null | Secondary match reason label |
| `view_count` | int | 0 | Total views |
| `save_count` | int | 0 | Total saves |
| `share_count` | int | 0 | Total shares |
| `created_at` | timestamptz | — | Creation timestamp |

#### `post_interactions`
Tracks user engagement for the recommendation engine.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | uuid (PK) | gen_random_uuid() | Interaction ID |
| `user_id` | uuid (FK → profiles) | — | User who performed action |
| `post_id` | uuid (FK → posts) | — | Target post |
| `interaction_type` | text | — | view/save/share/album_add |
| `interaction_score` | int | 1 | Weighted score (1/6/7/9) |
| `created_at` | timestamptz | now() | Timestamp |

#### `albums`
User-created post collections.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | uuid (PK) | gen_random_uuid() | Album ID |
| `user_id` | uuid (FK → profiles) | — | Album owner |
| `name` | text | — | Album name |
| `is_public` | boolean | false | Public visibility |
| `save_count` | int | 0 | Engagement count |
| `created_at` | timestamptz | — | Creation timestamp |

#### `album_posts`
Many-to-many junction between albums and posts.

| Column | Type | Description |
|--------|------|-------------|
| `album_id` | uuid (FK → albums) | Parent album |
| `post_id` | uuid (FK → posts) | Contained post |

### 6.3 Indexes

| Index | Table | Column(s) | Type |
|-------|-------|-----------|------|
| `idx_posts_style_tags` | posts | style_tags | GIN |
| `idx_posts_fit_tags` | posts | fit_tags | GIN |
| `idx_posts_created_at` | posts | created_at DESC | B-tree |
| `idx_post_interactions_user` | post_interactions | user_id | B-tree |
| `idx_post_interactions_post` | post_interactions | post_id | B-tree |
| `idx_post_interactions_type` | post_interactions | interaction_type | B-tree |
| `idx_post_interactions_created` | post_interactions | created_at DESC | B-tree |
| `idx_albums_is_public` | albums | is_public (WHERE true) | Partial B-tree |

---

## 7. Data Flow Diagrams

### 7.1 Signup + Onboarding Flow

```
User → AuthModal → AuthContext.signUp()
  → POST /auth/signup → Supabase Auth
  ← tokens + user
  → saveAuthTokens() → localStorage
  → setSession()
  → redirect to onboarding-style

User → OnboardingStyle → OnboardingBody → OnboardingFit → OnboardingDirection
  → setOnboardingState() at each step
  → saveToStorage() at each step (localStorage)
  → on completion: PUT /auth/profile → Supabase PostgREST (profiles table)
```

### 7.2 Feed Loading Flow

```
AppContent mounts
  → getStoredAccessToken()
  → if token: GET /recommendations
    → FastAPI fetches profiles, posts, interactions from Supabase
    → _calculate_onboarding_score() per post
    → _calculate_behaviour_score() per post
    → _build_recommendation() combines scores
    → sort by final_score desc
    → return to frontend
  → if no token: GET /posts
    → FastAPI fetches posts from Supabase
    → return to frontend
  → backendPostToFrontendPost() maps to frontend types
  → setSupabasePosts()
```

### 7.3 Interaction Tracking Flow

```
User saves post
  → requestSavePost(postId)
  → auth check → if not authenticated, open login modal
  → setSavedPostIds() → saveToStorage()
  → trackInteraction(token, postId, "save")
    → POST /interactions → FastAPI
    → validate interaction_type against INTERACTION_SCORES
    → POST {SUPABASE_URL}/rest/v1/post_interactions
    ← interaction record with score=9
```

---

## 8. Security Considerations

| Concern | Implementation |
|---------|---------------|
| Supabase credentials | Server-side only (backend/.env, never exposed to frontend) |
| Auth tokens | Stored in localStorage; validated server-side on every request |
| RLS policies | All user tables enforce `auth.uid() = user_id` |
| CORS | Restricted to localhost:5173/5174 origins |
| Input validation | Pydantic models on all backend endpoints |
| Password handling | Never stored or handled by backend; delegated entirely to Supabase Auth |