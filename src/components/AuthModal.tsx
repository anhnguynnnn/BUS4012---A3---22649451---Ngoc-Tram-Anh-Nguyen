import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import Button from "./Button";
import Input from "./Input";

type AuthModalProps = {
  isOpen: boolean;
  initialMode?: "entry" | "login" | "signup";
  onClose: () => void;
  signUpSuccess?: boolean;
  onStartBrowsing?: () => void;
};

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function AuthModal({ isOpen, initialMode = "login", onClose, signUpSuccess = false, onStartBrowsing }: AuthModalProps) {
  // AuthContext manages real Supabase API calls and token persistence.
  const { signIn, signUp, isLoading, error: authError, clearError } = useAuth();
  const [mode, setMode] = useState<"entry" | "login" | "signup">(initialMode);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");

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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Call real Supabase auth via backend proxy on sign up.
  const handleSignUp = async () => {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please complete all required fields.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords must match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!acceptedTerms) {
      setError("Please agree to the terms and conditions.");
      return;
    }
    setError("");
    clearError();

    try {
      await signUp(email.trim(), password, fullName.trim());
      onStartBrowsing?.();
    } catch {
      // The API error is surfaced from AuthContext.
    }
  };

  // Call real Supabase auth via backend proxy on login.
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Please complete all required fields.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    clearError();

    try {
      await signIn(email.trim(), password);
      onClose();
    } catch {
      // The API error is surfaced from AuthContext.
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={onClose}>
      <section className="relative w-full max-w-md rounded-[2rem] border border-neutral-200 bg-white p-7 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <button onClick={onClose} className="absolute right-5 top-5 text-2xl leading-none text-neutral-400 hover:text-black" aria-label="Close authentication modal">×</button>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-400">MUSÉ account</p>
        {/* Show backend/Supabase auth errors in a visible banner */}
        {authError?.message && (
          <p className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{authError.message}</p>
        )}
        {signUpSuccess ? (
          <div className="mt-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black text-2xl text-white">✓</div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight">You're signed up</h2>
            <p className="mt-3 leading-7 text-neutral-600">Your MUSÉ account has been created successfully. You can start browsing and save looks to your Style Library.</p>
            <Button onClick={onStartBrowsing ?? onClose} className="mt-6">Start browsing</Button>
          </div>
        ) : mode === "entry" ? (
          <div className="mt-6 text-center">
            <h2 className="text-3xl font-semibold tracking-[0.18em]">MUSÉ</h2>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.35em] text-neutral-400">Fashion discovery</p>
            <h3 className="mt-4 text-3xl font-semibold tracking-tight">Welcome to MUSÉ</h3>
            <p className="mt-3 leading-7 text-neutral-600">Find real-life outfit inspiration shaped around your style, fit, and everyday routine.</p>
            <div className="mt-7 space-y-3">
              <Button onClick={() => setMode("login")}>Log in</Button>
              <Button variant="secondary" onClick={() => setMode("signup")}>Sign up</Button>
              <button onClick={onClose} className="w-full text-center text-sm text-neutral-500 underline-offset-4 hover:text-black hover:underline">Continue as guest</button>
            </div>
          </div>
        ) : forgotPassword ? (
          <div className="mt-6 space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight">Reset your password</h2>
            <p className="text-sm leading-6 text-neutral-500">Enter your email and we'll show a prototype reset confirmation.</p>
            <Input label="Email" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} type="email" placeholder="user@muse.app" />
            <Button onClick={() => setResetSent(true)}>Send reset link</Button>
            {resetSent && <p className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">If this email exists, a password reset link has been sent.</p>}
            <button onClick={() => setForgotPassword(false)} className="w-full text-center text-sm text-neutral-500 underline-offset-4 hover:text-black hover:underline">Back to log in</button>
          </div>
        ) : (
          <>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Continue your style discovery</h2>
            <div className="mt-6 grid grid-cols-2 rounded-full border border-neutral-200 bg-neutral-50 p-1">
              {(["login", "signup"] as const).map((item) => (
                <button key={item} onClick={() => { setMode(item); setForgotPassword(false); setError(""); clearError(); }} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === item ? "bg-black text-white" : "text-neutral-500 hover:text-black"}`}>
                  {item === "login" ? "Log in" : "Sign up"}
                </button>
              ))}
            </div>

        {mode === "login" ? (
          <div className="mt-6 space-y-4">
            <Input label="Email *" value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="user@muse.app" />
            <Input label="Password *" value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="••••••••" />
            <button onClick={() => setForgotPassword(true)} className="text-sm text-neutral-500 underline-offset-4 hover:text-black hover:underline">Forgot password?</button>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button onClick={handleLogin} disabled={isLoading}>{isLoading ? "Logging in…" : "Log in"}</Button>
            <button onClick={() => { setMode("signup"); setError(""); clearError(); }} className="w-full text-center text-sm text-neutral-500 underline-offset-4 hover:text-black hover:underline">Don't have an account? Sign up</button>
            <button onClick={onClose} className="w-full text-center text-sm text-neutral-500 underline-offset-4 hover:text-black hover:underline">Continue exploring as guest</button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <Input label="Full name *" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="MUSÉ User" />
            <Input label="Email *" value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="user@muse.app" />
            <Input label="Password *" value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="••••••••" />
            <Input label="Confirm password *" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" placeholder="••••••••" />
            <label className="flex items-center gap-3 text-sm text-neutral-600"><input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} /> I agree to the terms and conditions</label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button onClick={handleSignUp} disabled={isLoading}>{isLoading ? "Creating account…" : "Create account"}</Button>
            <button onClick={() => { setMode("login"); setError(""); clearError(); }} className="w-full text-center text-sm text-neutral-500 underline-offset-4 hover:text-black hover:underline">Already have an account? Log in</button>
          </div>
        )}
          </>
        )}
      </section>
    </div>
  );
}