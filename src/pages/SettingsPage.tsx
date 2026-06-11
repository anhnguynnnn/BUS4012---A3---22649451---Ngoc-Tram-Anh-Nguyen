import Button from "../components/Button";
import Layout from "../components/Layout";
import type { Page } from "../types";

type Props = { currentPage: Page; onNavigate: (page: Page) => void; onClearData: () => void; onLogout: () => void; isLoggedIn?: boolean };

export default function SettingsPage({ currentPage, onNavigate, onClearData, onLogout, isLoggedIn = true }: Props) {
  return <Layout currentPage={currentPage} onNavigate={onNavigate} isLoggedIn={isLoggedIn}><section className="mx-auto max-w-5xl px-6 py-16"><p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">MUSÉ</p><h1 className="mt-4 text-5xl font-semibold tracking-tight">Settings</h1><div className="mt-10 grid gap-4 md:grid-cols-2"><Button variant="secondary" onClick={() => onNavigate("account")}>Account</Button><Button variant="secondary" onClick={() => onNavigate("app-preferences")}>App Preferences</Button><Button variant="secondary" onClick={() => onNavigate("privacy")}>Privacy</Button><Button variant="secondary" onClick={() => { if (confirm("Clear all MUSÉ localStorage data?")) onClearData(); }}>Clear saved data</Button><Button onClick={onLogout}>Log out</Button></div></section></Layout>;
}