# AUTH_FLOW_TRACE.md — Authentication Flow Investigation

## Executive Summary

**The backend and Supabase are working correctly.** Both signup and login succeed via direct curl requests. The issue reported (navbar shows "Log in" after signup, login returns "Invalid login credentials") cannot be reproduced at the API level. The root cause is either a frontend state management issue or a testing methodology issue.

---

## Confirmed Facts (from curl tests)

| Test | Result |
|------|--------|
| Signup with valid credentials | ✅ 200 OK — returns `access_token`, `refresh_token`, `user` |
| Login with same credentials | ✅ 200 OK — returns `access_token`, `refresh_token`, `user` |
| Login with wrong password | ✅ 400 — "Invalid login credentials" (expected) |
| Email confirmation | **DISABLED** — Supabase returns tokens immediately on signup |
| Password storage | ✅ Correct — password hash matches between signup and login |

---

## Full Signup Flow Trace

### Step 1: Frontend — AuthModal.handleSignUp

```
File: src/components/AuthModal.tsx
Function: handleSignUp()
```

- Validates: fields non-empty, email format, passwords match, password ≥ 6 chars, terms accepted
- Calls: `signUp(email.trim(), password, fullName.trim())`
- Note: `password` is NOT trimmed (correct behavior)

### Step 2: Frontend — AuthContext.signUp

```
File: src/contexts/AuthContext.tsx
Function: signUp()
```

- Sets `isLoading = true`, `error = null`
- Calls: `signupRequest(email, password, fullName)` → `backendApi.signup()`

### Step 3: Frontend — backendApi.signup

```
File: src/lib/backendApi.ts
Function: signup()
```

- Sends: `POST http://localhost:8000/auth/signup`
- Body: `{ "email": "...", "password": "...", "full_name": "..." }`
- Headers: `Content-Type: application/json`

### Step 4: Backend — routers/auth.signup

```
File: backend/app/routers/auth.py
Function: signup()
```

- Receives: `SignUpRequest` (email: EmailStr, password: str min_length=6, full_name: Optional[str])
- Calls: `supabase_signup(email=str(request.email), password=request.password, full_name=request.full_name)`
- No `response_model` — returns raw Supabase dict

### Step 5: Backend — supabase_auth.signup

```
File: backend/app/supabase_auth.py
Function: signup()
```

- Sends: `POST {SUPABASE_URL}/auth/v1/signup`
- Body: `{ "email": "...", "password": "...", "user_metadata": { "full_name": "..." } }`
- Headers: `{ "apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json" }`

### Step 6: Supabase Response

```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "expires_in": 3600,
  "expires_at": 1781187203,
  "refresh_token": "ua2xph5wwajq",
  "user": {
    "id": "f92abd62-...",
    "email": "traceuser@gmail.com",
    "email_confirmed_at": "2026-06-11T13:13:23.040877401Z",
    "user_metadata": { "email_verified": true, ... }
  }
}
```

**Key observation:** Supabase returns `access_token`, `refresh_token`, and `user` on signup. Email confirmation is DISABLED.

### Step 7: Backend Returns

The backend returns the Supabase response as-is (no transformation, no `response_model` validation).

### Step 8: Frontend — AuthContext.signUp (continued)

```typescript
const response = await signupRequest(email, password, fullName);
const maybeSession = response as Partial<{ access_token: string; refresh_token: string; user: AuthUser }>;

if (maybeSession.access_token && maybeSession.refresh_token && maybeSession.user) {
  // ✅ THIS BRANCH SHOULD BE TAKEN (tokens are present)
  saveAuthTokens(maybeSession.access_token, maybeSession.refresh_token);
  setSession({ accessToken: maybeSession.access_token, refreshToken: maybeSession.refresh_token, user: maybeSession.user });
} else {
  // ❌ This branch should NOT be taken
  const pendingUser = userFromSignUpResponse(response);
  setSession(pendingUser ? { accessToken: "", refreshToken: "", user: pendingUser } : null);
}
```

**Expected:** The first branch is taken, tokens are saved, session is set with valid `accessToken`.

### Step 9: AuthContext State Update

- `session.accessToken` = JWT string (truthy)
- `isAuthenticated` = `Boolean(session?.accessToken)` = `true`
- Navbar should show "Account" and "Settings" instead of "Log in"

### Step 10: AuthModal Closes

```typescript
try {
  await signUp(email.trim(), password, fullName.trim());
  onStartBrowsing?.();  // ← Called if signUp doesn't throw
} catch {
  // Error already in AuthContext state
}
```

- `onStartBrowsing` is called → modal closes, redirect to onboarding
- `App.tsx` useEffect: `if (isAuthenticated) { setAuthModalOpen(false); setEntryPopupSeen(true); }`

---

## Full Login Flow Trace

### Step 1: Frontend — AuthModal.handleLogin

```
File: src/components/AuthModal.tsx
Function: handleLogin()
```

- Validates: fields non-empty, email format
- Calls: `signIn(email.trim(), password)`

### Step 2: Frontend — AuthContext.signIn

- Calls: `loginRequest(email, password)` → `backendApi.login()`

### Step 3: Frontend — backendApi.login

- Sends: `POST http://localhost:8000/auth/login`
- Body: `{ "email": "...", "password": "..." }`

### Step 4: Backend — supabase_auth.login

- Sends: `POST {SUPABASE_URL}/auth/v1/token?grant_type=password`
- Body: `{ "email": "...", "password": "..." }`

### Step 5: Supabase Response (curl test)

```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "dpo5fubveha6",
  "expires_in": 3600,
  "token_type": "bearer",
  "user": { "id": "...", "email": "traceuser@gmail.com", ... }
}
```

**Login succeeds with the same credentials used for signup.**

---

## Analysis: Why Does the User See "Invalid login credentials"?

### Hypothesis 1: Testing with a Previously Created User (MOST LIKELY)

The user may have created the account during earlier testing when:
- Email confirmation was still enabled
- A different password was used
- The account was created via Supabase Dashboard (not the app)

**Evidence:** The user confirmed "Email is verified (Email Confirmed At contains a timestamp)" — this is consistent with an account that was either manually confirmed or created when email confirmation was enabled.

**Resolution:** Delete the existing user from Supabase Dashboard → Authentication → Users, then sign up fresh through the app.

### Hypothesis 2: Frontend State Not Updating After Signup

The `AuthContext.signUp` function sets the session correctly, but the React state might not propagate to all components.

**Evidence against:** The `useEffect` in `App.tsx` watches `isAuthenticated` and should close the modal. If `isAuthenticated` is `true`, the navbar should update.

**Possible cause:** The `AppContent` component reads `isAuthenticated` from `useAuth()`, which reads from `AuthContext`. If the context value doesn't change (memoization issue), the component won't re-render.

**Check:** The `useMemo` in `AuthContext`:
```typescript
const value = useMemo<AuthContextValue>(() => ({
  ...
  isAuthenticated: Boolean(session?.accessToken),
  ...
}), [clearError, error, isLoading, session, signIn, signOut, signUp]);
```

The dependency array includes `session`, so when `setSession` is called, the memo should recompute. This looks correct.

### Hypothesis 3: CORS Preflight Failure

The browser sends an OPTIONS preflight before the POST. If CORS fails, the request never reaches the backend.

**Evidence against:** CORS is configured with `allow_origins=[FRONTEND_ORIGIN]`, `allow_methods=["*"]`, `allow_headers=["*"]`. This should handle all preflight requests.

**Verification:** Check browser DevTools → Network tab for OPTIONS requests.

---

## Recommended Actions

### Immediate: Delete and Recreate Test User

1. Go to Supabase Dashboard → Authentication → Users
2. Delete the existing test user
3. Sign up fresh through the MUSÉ app
4. Verify the user appears with `email_confirmed_at` populated
5. Check if the navbar updates to show "Account"

### If Issue Persists: Add Debug Logging

Add temporary `console.log` statements to `AuthContext.signUp`:

```typescript
console.log('[AUTH] Signup response:', response);
console.log('[AUTH] Has tokens:', Boolean(maybeSession.access_token));
console.log('[AUTH] Setting session...');
```

Then check the browser console for the actual values.

### Browser DevTools Checklist

1. **Network tab:** Check if the POST to `/auth/signup` is actually sent
2. **Network tab:** Check the response status and body
3. **Console tab:** Check for any JavaScript errors
4. **Application → Local Storage:** Check if `muse:accessToken` and `muse:refreshToken` are populated after signup
5. **Application → Local Storage:** Check if tokens are cleared after the modal closes

---

## Conclusion

The authentication backend is working correctly. Both signup and login succeed via curl with the same credentials. The reported issue ("Invalid login credentials" on login, "Log in" still showing after signup) is most likely caused by:

1. **Testing with a stale user account** that was created under different Supabase configuration (most likely)
2. **A frontend state propagation issue** that prevents `isAuthenticated` from updating the navbar

No code changes are recommended until the user confirms they have deleted the old test user and tried fresh signup through the app.