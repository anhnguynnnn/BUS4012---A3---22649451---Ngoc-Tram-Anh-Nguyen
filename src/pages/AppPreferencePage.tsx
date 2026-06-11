import Layout from "../components/Layout";
import type { AppPreferences, Page } from "../types";

const toggles: { key: keyof AppPreferences; label: string }[] = [
  { key: "prioritiseSimilarBodyReferences", label: "Prioritise similar body references" },
  { key: "showExperimentalStyles", label: "Show more experimental styles" },
  { key: "showCreatorExplanations", label: "Show creator explanations" },
  { key: "showMatchPercentage", label: "Show match percentage" },
];

type Props = { currentPage: Page; preferences: AppPreferences; setPreferences: (value: AppPreferences) => void; onNavigate: (page: Page) => void; isLoggedIn?: boolean };

export default function AppPreferencePage({ currentPage, preferences, setPreferences, onNavigate, isLoggedIn = true }: Props) {
  return <Layout currentPage={currentPage} onNavigate={onNavigate} isLoggedIn={isLoggedIn}><section className="mx-auto max-w-4xl px-6 py-16"><button onClick={() => onNavigate("settings")} className="mb-6 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-100">← Back to Settings</button><p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Settings</p><h1 className="mt-4 text-5xl font-semibold tracking-tight">App Preferences</h1><div className="mt-10 space-y-4">{toggles.map((toggle) => <label key={toggle.key} className="flex items-center justify-between rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"><span className="font-medium">{toggle.label}</span><input type="checkbox" checked={preferences[toggle.key]} onChange={(event) => setPreferences({ ...preferences, [toggle.key]: event.target.checked })} className="h-5 w-5" /></label>)}</div></section></Layout>;
}