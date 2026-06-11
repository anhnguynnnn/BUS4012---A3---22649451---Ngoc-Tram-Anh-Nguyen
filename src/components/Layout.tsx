import type { ReactNode } from "react";
import Navigation from "./Navigation";
import type { Page } from "../types";

type LayoutProps = {
  children: ReactNode;
  currentPage?: Page;
  onNavigate?: (page: Page) => void;
  onGetStarted?: () => void;
  isLoggedIn?: boolean;
  onLoginClick?: () => void;
};

export default function Layout({ children, currentPage, onNavigate, onGetStarted, isLoggedIn, onLoginClick }: LayoutProps) {
  return (
    <div className="min-h-screen bg-white text-neutral-950">
      {onNavigate && <Navigation currentPage={currentPage ?? "welcome"} onNavigate={onNavigate} onGetStarted={onGetStarted} isLoggedIn={isLoggedIn} onLoginClick={onLoginClick} />}
      <main>{children}</main>
    </div>
  );
}