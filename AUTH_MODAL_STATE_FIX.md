# AUTH_MODAL_STATE_FIX.md — Modal Form State Bug Fix

## Root Cause

The `AuthModal` component in `src/components/AuthModal.tsx` stays mounted even when closed (it renders `null` when `isOpen` is `false`, but React preserves its internal `useState` values). The `useEffect` that runs on `isOpen` change only reset `mode`, `forgotPassword`, `resetSent`, and `error` — but left form fields (`fullName`, `email`, `password`, `confirmPassword`, `acceptedTerms`) with their previous values.

**Flow that reproduces the bug:**
1. User opens modal → enters email/password → signs up or logs in
2. User logs out → modal reopens
3. Previous form values are still populated in the input fields

## Fix

**File:** `src/components/AuthModal.tsx`

Added 5 `setState` calls to the existing `useEffect` that triggers on `isOpen` change:

```tsx
useEffect(() => {
    setMode(initialMode);
    setForgotPassword(false);
    setResetSent(false);
    setError("");
    clearError();
    // Reset all form fields so the modal always opens with a clean form.
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setAcceptedTerms(false);
  }, [clearError, initialMode, isOpen]);
```

This ensures:
- Opening the modal always starts with empty fields
- Logout → reopen modal shows clean form
- Switching between Login and Sign Up modes resets fields (the `initialMode` dependency triggers the reset)

## Verification

- `npx tsc --noEmit` passes (exit code 0)
- No new files or dependencies added
- Single `useEffect` change, no logic restructuring