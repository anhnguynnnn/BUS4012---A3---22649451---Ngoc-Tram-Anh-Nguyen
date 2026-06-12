import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";

type ProtectedRouteProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

export default function ProtectedRoute({ children, fallback = null }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="px-6 py-20 text-center text-sm text-neutral-500">Checking your session…</div>;
  }

  return isAuthenticated ? <>{children}</> : <>{fallback}</>;
}