import Button from "../components/Button";
import Layout from "../components/Layout";
import type { AuthUser, OnboardingAnswers, Page } from "../types";

type AccountPageProps = {
  currentPage: Page;
  /** Authenticated Supabase user from AuthContext. */
  user: AuthUser | null;
  onboarding: OnboardingAnswers;
  onNavigate: (page: Page) => void;
  onEditPreferences: () => void;
  onLogout: () => void;
  isLoggedIn?: boolean;
};

export default function AccountPage({ currentPage, user, onboarding, onNavigate, onEditPreferences, onLogout, isLoggedIn = true }: AccountPageProps) {
  const summary = [...onboarding.styleAttraction, ...onboarding.fitPreferences, ...onboarding.stylingDirection].filter(Boolean).slice(0, 6);

  // Resolve display name from Supabase user metadata.
  const displayName = user?.full_name || (user?.user_metadata?.full_name as string) || "MUSÉ User";
  const displayEmail = user?.email || "user@muse.app";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Layout currentPage={currentPage} onNavigate={onNavigate} isLoggedIn={isLoggedIn}>
      <section className="bg-neutral-50 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <button onClick={() => onNavigate("settings")} className="mb-6 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-100">← Back to Settings</button>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Profile</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight">Account</h1>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-10 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black text-xl font-semibold text-white">{initial}</div>
          <h2 className="mt-6 text-2xl font-semibold">{displayName}</h2>
          <p className="mt-1 text-neutral-500">{displayEmail}</p>
          <p className="mt-4 inline-flex rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700">Style explorer</p>
        </aside>
        <div className="space-y-6">
          <section className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold">Style preferences</h2>
            <p className="mt-3 max-w-2xl leading-7 text-neutral-600">
              Update what you're drawn to so MUSÉ can keep your discovery feed feeling relevant and body-aware.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                ...(summary.length ? summary : ["Minimal / clean", "Relaxed fit", "Everyday styling"]),
              ].map((item) => <span key={item} className="rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-600">{item}</span>)}
            </div>
          </section>
          <section className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold">Account actions</h2>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button onClick={onEditPreferences} className="sm:w-auto">Edit preferences</Button>
              <Button onClick={onLogout} variant="secondary" className="sm:w-auto">
                Log out
              </Button>
            </div>
          </section>
        </div>
      </section>
    </Layout>
  );
}