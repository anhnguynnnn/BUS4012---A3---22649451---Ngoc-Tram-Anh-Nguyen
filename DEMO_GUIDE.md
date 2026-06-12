# MUSÉ MVP — Demo Guide

**Audience:** Lecturer / Assessor  
**Duration:** ~5 minutes  
**Prerequisites:** Backend running on port 8000, frontend running on port 5173

---

## Pre-Demo Setup

### 1. Start the Backend

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

You should see:
```
[MUSÉ Backend] API ready at http://localhost:8000
[MUSÉ Backend] Health check: http://localhost:8000/health
```

### 2. Start the Frontend

```bash
npm run dev
```

Vite will start on `http://localhost:5173` (or 5174 if 5173 is busy).

### 3. Open the Browser

Navigate to `http://localhost:5173`

---

## Demo Flow

### Step 1: Welcome Screen (30 seconds)

**What to show:**
- The MUSÉ landing page displays a curated fashion feed
- The navigation bar shows the MUSÉ branding
- A red banner should NOT appear (confirms backend connectivity)

**Talk track:** *"MUSÉ is a personalised fashion discovery platform. The landing page shows trending looks from the community."*

---

### Step 2: Create an Account (60 seconds)

**What to do:**
1. Click **"Get Started"** or the **login/signup** button in the navigation
2. The entry modal appears with browsing options
3. Switch to **Sign Up** mode
4. Enter:
   - Full Name: `Demo User`
   - Email: `demo@muse.test`
   - Password: `DemoPass123`
5. Click **Sign Up**

**What happens behind the scenes:**
- `POST /auth/signup` → Supabase Auth creates the user
- Access token and refresh token are stored in localStorage
- AuthContext session is established
- User is redirected to onboarding

**Talk track:** *"Authentication is handled by Supabase Auth, proxied through our FastAPI backend. The frontend never holds Supabase credentials directly."*

---

### Step 3: Complete Onboarding (60 seconds)

**What to do:**

**Screen 1 — Style Attraction:**
- Select 2-3 style preferences (e.g., "Minimal / Clean", "Streetwear")
- Click **Next**

**Screen 2 — Body Reference:**
- Select size range (e.g., "M")
- Select height range (e.g., "165–174 cm")
- Click **Next**

**Screen 3 — Fit Preferences:**
- Select 1-2 fit preferences (e.g., "Highlight my waist", "Prefer relaxed / loose fits")
- Click **Next**

**Screen 4 — Styling Direction:**
- Select direction (e.g., "Womenswear")
- Click **Finish**

**What happens behind the scenes:**
- Each step updates React state + saves to localStorage
- On completion, `PUT /auth/profile` syncs preferences to Supabase `profiles` table
- Onboarding data drives the recommendation engine

**Talk track:** *"Onboarding captures 5 dimensions of personal style. These preferences are the foundation of our recommendation engine."*

---

### Step 4: View Personalised Recommendations (60 seconds)

**What to do:**
- After onboarding, you land on the home feed
- Scroll through the post cards
- Each card shows:
  - Fashion image
  - Creator name
  - Match percentage (e.g., "87% match")
  - Match reason (e.g., "Similar to your minimal preference")
  - Style tags, fit tags, size range

**What happens behind the scenes:**
- `GET /recommendations` fetches posts from Supabase
- Backend scores each post:
  - **Onboarding score** (0-100): style +20, size +25, height +20, fit +20, direction +10
  - **Behaviour score** (0-100): based on interaction history or trending proxy
  - **Final score**: 70% behaviour + 30% onboarding
- Posts are sorted by final score descending

**Talk track:** *"The feed is ranked by a hybrid recommendation engine. New users see trending content. As they interact, the system learns their preferences and adjusts rankings."*

---

### Step 5: Save a Post (30 seconds)

**What to do:**
1. Click the **bookmark/save icon** on any post card
2. A save modal appears with album options

**What happens behind the scenes:**
- `requestSavePost()` checks authentication
- If not saved → opens save modal
- `POST /interactions` tracks the save (interaction_score = 9)
- Saved post ID added to localStorage

**Talk track:** *"Saving a post triggers an interaction event. The recommendation engine uses this signal — saves are weighted at 9 points versus 1 point for views."*

---

### Step 6: Create an Album (30 seconds)

**What to do:**
1. In the save modal, type an album name (e.g., "Summer Vibes")
2. Click **"Create & Save"**

**What happens behind the scenes:**
- Album created with `crypto.randomUUID()` as ID
- Post added to the album's `postIds` array
- `POST /interactions` tracks `album_add` (score = 6)
- Albums persisted to localStorage (scoped per user)

**Talk track:** *"Albums are personal lookbooks. Both the save and album-add interactions feed back into the recommendation engine."*

---

### Step 7: View Style Library (30 seconds)

**What to do:**
1. Navigate to **Library** via the navigation bar
2. Show the saved posts and albums
3. Open the "Summer Vibes" album to see the saved post

**Talk track:** *"The Style Library is the user's personal collection. Albums and saved posts persist across sessions via localStorage, scoped per user account."*

---

### Step 8: View Account Page (30 seconds)

**What to do:**
1. Navigate to **Account** via the navigation bar
2. Show the user profile with:
   - Full name and email
   - Onboarding preferences synced from Supabase
   - Options to edit preferences or log out

**Talk track:** *"The Account page shows the synced profile data. Users can edit their onboarding preferences, which immediately affects their feed recommendations."*

---

## Key Technical Points to Highlight

| Feature | Implementation |
|---------|---------------|
| Authentication | Supabase Auth via FastAPI proxy — frontend never holds Supabase credentials |
| Recommendation Engine | Hybrid scoring: onboarding preferences (5 factors) + interaction behaviour, 70/30 weighted |
| Data Persistence | Dual-layer: localStorage (fast, offline) + Supabase (cross-device sync) |
| Interaction Tracking | Every save/album-add/view tracked with weighted scores for recommendations |
| Backend Architecture | FastAPI with 4 routers: auth, posts, interactions, recommendations |
| Frontend Architecture | React SPA with TypeScript, Tailwind CSS, Vite dev proxy |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Red banner "Cannot connect to MUSÉ server" | Ensure backend is running on port 8000 |
| Feed shows empty | Check Supabase has seed data in `posts` table |
| Signup fails | Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `backend/.env` |
| Onboarding not persisting | Check Supabase `profiles` table has the Phase 5 migration columns |