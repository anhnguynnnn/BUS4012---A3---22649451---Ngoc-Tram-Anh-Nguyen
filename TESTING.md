# MUSÉ Phase 4 — Authentication System Testing Guide

## Prerequisites

1. **Supabase project** configured in `backend/.env` (already done).
2. **Python 3.11+** with the backend virtual environment.
3. **Node.js 18+** with npm.
4. **Two browser windows/tabs** (for testing session persistence).

---

## Start the Application

### Terminal 1 — Backend (FastAPI + Supabase)

```bash
cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000
```

You should see:
```
[MUSÉ Backend] Supabase configuration validated successfully
[MUSÉ Backend] API ready at http://localhost:8000
```

### Terminal 2 — Frontend (Vite)

```bash
npm run dev
```

Open the URL shown (usually `http://localhost:5173`).

---

## Test Cases

### 1. User Sign Up

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open the app | Entry popup appears with "Welcome to MUSÉ" |
| 2 | Click **Sign up** | Sign up form appears |
| 3 | Fill in: Full name, Email, Password, Confirm password | All fields accept input |
| 4 | Check "I agree to terms" | Checkbox toggles |
| 5 | Click **Create account** | Button shows "Creating account…" loading state |
| 6 | After success | Redirected to onboarding style page |

**Verify in Supabase Dashboard → Authentication → Users:** new user appears.

---

### 2. User Login

| Step | Action | Expected |
|------|--------|----------|
| 1 | Log out (Settings → Log out) | Returns to home with entry popup |
| 2 | Click **Log in** | Login form appears |
| 3 | Enter email and password from sign up | Fields accept input |
| 4 | Click **Log in** | Button shows "Logging in…" loading state |
| 5 | After success | Modal closes, redirected to home feed with search/filter UI |

---

### 3. User Logout

| Step | Action | Expected |
|------|--------|----------|
| 1 | Navigate to **Account** page | Profile shows real email/name from Supabase |
| 2 | Click **Log out** | Session cleared, entry popup appears |

**Verify:** Open browser DevTools → Application → Local Storage:
- `muse:accessToken` should be removed
- `muse:refreshToken` should be removed

---

### 4. Session Persistence

| Step | Action | Expected |
|------|--------|----------|
| 1 | Log in successfully | Home feed visible |
| 2 | Refresh the page (Cmd+R / F5) | Page loads briefly, then user is still logged in |
| 3 | Close the tab and reopen | User remains logged in |

**Verify:** Tokens exist in localStorage before refresh.

---

### 5. Protected Routes

| Step | Action | Expected |
|------|--------|----------|
| 1 | Log out completely | Entry popup visible |
| 2 | Click **Continue as guest** | Guest can browse home feed |
| 3 | Click **Account** in nav | Login modal appears (not account page) |
| 4 | Try to save a post (click heart icon) | Login modal appears |
| 5 | Try to create an album | Login modal appears |

---

### 6. Auth State Management

| Step | Action | Expected |
|------|--------|----------|
| 1 | Log in | Nav shows "Account" and "Settings" buttons |
| 2 | Log out | Nav shows "Log in" button |
| 3 | Sign up a new account | Immediately authenticated, onboarding starts |

---

### 7. User Profile Retrieval

| Step | Action | Expected |
|------|--------|----------|
| 1 | Log in | Auth state populated |
| 2 | Navigate to Account page | Shows real name and email from Supabase |
| 3 | Verify avatar initial | First letter of display name |

---

### 8. Error Handling

| Step | Action | Expected |
|------|--------|----------|
| 1 | Try login with wrong password | Red error banner: "Invalid login credentials" |
| 2 | Try sign up with existing email | Red error banner from Supabase |
| 3 | Try sign up with short password (< 6 chars) | Red error banner from backend validation |
| 4 | Leave all fields empty, click login | "Please complete all required fields" |
| 5 | Enter invalid email format | "Please enter a valid email address" |
| 6 | Mismatched passwords on sign up | "Passwords must match" |

---

### 9. TypeScript Support

All types are defined in `src/types.ts`:
- `AuthUser` — Supabase user object
- `AuthSession` — Access token + refresh token + user
- `AuthError` — Error message with optional status code

Run type checking:
```bash
npx tsc --noEmit
```

Expected: No errors.

---

### 10. Responsive UI

| Viewport | Test |
|----------|------|
| Mobile (< 640px) | Auth modal is full-width, inputs stack vertically |
| Tablet (640–1024px) | Auth modal centered, proper padding |
| Desktop (> 1024px) | Auth modal centered at max-w-md |

---

## Backend API Endpoints

| Method | Path | Auth Required | Description |
|--------|------|---------------|-------------|
| GET | `/health` | No | Health check |
| POST | `/auth/signup` | No | Create new user |
| POST | `/auth/login` | No | Log in, returns tokens |
| POST | `/auth/logout` | Yes (Bearer) | Invalidate session |
| GET | `/auth/me` | Yes (Bearer) | Get current user profile |

### Manual API Testing with curl

```bash
# Health check
curl http://localhost:8000/health

# Sign up
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get current user (replace TOKEN with access_token from login)
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer TOKEN"

# Logout (replace TOKEN with access_token)
curl -X POST http://localhost:8000/auth/logout \
  -H "Authorization: Bearer TOKEN"
```

---

## Security Checklist

- [ ] No Supabase service role key in frontend code
- [ ] No Supabase service role key in `backend/.env.example`
- [ ] `backend/.env` is gitignored
- [ ] Tokens only stored in localStorage (not exposed in URLs or logs)
- [ ] Backend validates all auth tokens with Supabase before returning user data
- [ ] Passwords are never stored in frontend state after login