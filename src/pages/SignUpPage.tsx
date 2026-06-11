import { useState } from "react";
import Button from "../components/Button";
import Input from "../components/Input";
import Layout from "../components/Layout";
import type { Page, UserAccount } from "../types";

type SignUpPageProps = {
  onSignUp: (user: UserAccount) => void;
  onLogin: () => void;
  onNavigate: (page: Page) => void;
};

export default function SignUpPage({ onSignUp, onLogin, onNavigate }: SignUpPageProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setError("Please complete all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords must match.");
      return;
    }
    if (!acceptedTerms) {
      setError("Please agree to the terms and conditions.");
      return;
    }

    setError("");
    onSignUp({ fullName, email, password });
  };

  return (
    <Layout currentPage="signup" onNavigate={onNavigate}>
      <section className="bg-neutral-50 px-6 py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Join MUSÉ</p>
            <h1 className="mt-5 text-5xl font-semibold tracking-tight">Create a discovery feed that starts with your style direction.</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-neutral-600">Save looks, shape your first recommendations, and explore outfit references that feel realistic.</p>
          </div>
          <div className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm md:p-10">
            <h2 className="text-3xl font-semibold tracking-tight">Create your MUSÉ account</h2>
            <div className="space-y-3">
              <Input label="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="MUSÉ User" />
              <Input label="Email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="user@muse.app" type="email" />
              <Input label="Password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" type="password" />
              <Input label="Confirm password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="••••••••" type="password" />
            </div>
            <label className="flex items-center gap-3 text-sm text-neutral-600">
              <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="h-4 w-4 rounded border-neutral-300" />
              I agree to the terms and conditions
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <p className="text-xs leading-5 text-neutral-500">For this prototype, account details are saved locally in your browser with localStorage.</p>
            <Button onClick={handleSubmit}>Sign up</Button>
            <button onClick={onLogin} className="w-full text-center text-sm text-neutral-500 underline-offset-4 hover:text-black hover:underline">
              Already have an account? Log in
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
}