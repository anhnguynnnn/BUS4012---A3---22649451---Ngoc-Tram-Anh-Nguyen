import Layout from "../components/Layout";
import type { Page } from "../types";

type Props = { currentPage: Page; onNavigate: (page: Page) => void; isLoggedIn?: boolean };

export default function PrivacyPage({ currentPage, onNavigate, isLoggedIn = true }: Props) {
  const points = ["MUSÉ uses onboarding answers to recommend content.", "Data is stored locally in your browser for this prototype.", "You can clear saved data anytime from Settings.", "MUSÉ does not rank bodies.", "Matching is based on style, fit, and preference similarity."];
  return <Layout currentPage={currentPage} onNavigate={onNavigate} isLoggedIn={isLoggedIn}><section className="mx-auto max-w-4xl px-6 py-16"><button onClick={() => onNavigate("settings")} className="mb-6 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-100">← Back to Settings</button><p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Prototype privacy</p><h1 className="mt-4 text-5xl font-semibold tracking-tight">Privacy</h1><div className="mt-10 space-y-4">{points.map((point) => <p key={point} className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6 text-lg leading-8 text-neutral-700">{point}</p>)}</div></section></Layout>;
}