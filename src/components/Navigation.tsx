import type { Page } from "../types";

type NavigationProps = {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onGetStarted?: () => void;
  isLoggedIn?: boolean;
  onLoginClick?: () => void;
};

const items: { label: string; page: Page }[] = [
  { label: "Home", page: "home" },
  { label: "Style Library", page: "library" },
];

export default function Navigation({ currentPage, onNavigate, onGetStarted, isLoggedIn = false, onLoginClick }: NavigationProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <button onClick={() => onNavigate("home")} className="text-2xl font-semibold tracking-[0.18em]">
          MUSÉ
        </button>
        <nav className="hidden items-center gap-8 md:flex">
          {items.map((item) => {
            const active = currentPage === item.page;

            return (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className={`text-sm font-medium transition ${active ? "text-black" : "text-neutral-500 hover:text-black"}`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        {isLoggedIn ? (
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate("account")} className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-black transition hover:bg-neutral-100">Account</button>
            <button onClick={() => onNavigate("settings")} className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800">Settings</button>
          </div>
        ) : (
          <button onClick={onLoginClick ?? onGetStarted} className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800">Log in</button>
        )}
      </div>
    </header>
  );
}