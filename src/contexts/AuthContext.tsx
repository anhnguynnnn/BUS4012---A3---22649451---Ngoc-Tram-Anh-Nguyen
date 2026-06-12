import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthError, AuthSession, AuthUser } from "../types";
import {
  clearAuthTokens,
  getMe,
  getStoredAccessToken,
  getStoredRefreshToken,
  login as loginRequest,
  logout as logoutRequest,
  saveAuthTokens,
  signup as signupRequest,
} from "../lib/backendApi";

type AuthContextValue = {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

function normaliseAuthError(error: unknown): AuthError {
  return { message: error instanceof Error ? error.message : "Authentication request failed." };
}

function userFromSignUpResponse(response: Record<string, unknown>): AuthUser | null {
  // When Supabase returns tokens (no email confirmation), user is nested.
  const user = response.user;
  if (typeof user === "object" && user !== null) return user as AuthUser;

  // When Supabase requires email confirmation, the user object is at the top level.
  if (typeof response.id === "string" && typeof response.email === "string") {
    return {
      id: response.id as string,
      email: response.email as string,
      full_name: (response.user_metadata as Record<string, unknown>)?.full_name as string | undefined,
      created_at: response.created_at as string | undefined,
      user_metadata: (response.user_metadata as Record<string, unknown>) || {},
    };
  }

  return null;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const accessToken = getStoredAccessToken();
      const refreshToken = getStoredRefreshToken();

      if (!accessToken || !refreshToken) {
        if (active) setIsLoading(false);
        return;
      }

      try {
        const user = await getMe(accessToken);
        if (active) setSession({ accessToken, refreshToken, user });
      } catch {
        clearAuthTokens();
        if (active) setSession(null);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await loginRequest(email, password);
      saveAuthTokens(response.access_token, response.refresh_token);
      // Fetch the full user profile from /auth/me because the Supabase
      // login/token response does not include custom user_metadata fields
      // like full_name. The /auth/me endpoint enriches the response.
      let profile: AuthUser = response.user;
      try {
        profile = await getMe(response.access_token);
      } catch {
        // Fall back to the user object from the login response.
      }
      setSession({ accessToken: response.access_token, refreshToken: response.refresh_token, user: profile });
    } catch (authError) {
      const normalised = normaliseAuthError(authError);
      setError(normalised);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await signupRequest(email, password, fullName);
      const maybeSession = response as Partial<{ access_token: string; refresh_token: string; user: AuthUser }>;

      if (maybeSession.access_token && maybeSession.refresh_token && maybeSession.user) {
        saveAuthTokens(maybeSession.access_token, maybeSession.refresh_token);
        // Fetch the full user profile from /auth/me because the Supabase
        // signup response may not include custom user_metadata fields.
        let profile: AuthUser = maybeSession.user;
        try {
          profile = await getMe(maybeSession.access_token);
        } catch {
          // Fall back to the user object from the signup response.
        }
        setSession({ accessToken: maybeSession.access_token, refreshToken: maybeSession.refresh_token, user: profile });
      } else {
        const pendingUser = userFromSignUpResponse(response);
        setSession(pendingUser ? { accessToken: "", refreshToken: "", user: pendingUser } : null);
      }
    } catch (authError) {
      const normalised = normaliseAuthError(authError);
      setError(normalised);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    const accessToken = session?.accessToken || getStoredAccessToken();
    setIsLoading(true);
    setError(null);

    try {
      if (accessToken) await logoutRequest(accessToken);
    } catch {
      // Even if the remote session is already expired, clear local state so the UI is safe.
    } finally {
      clearAuthTokens();
      setSession(null);
      setIsLoading(false);
    }
  }, [session?.accessToken]);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    session,
    isLoading,
    error,
    isAuthenticated: Boolean(session?.accessToken),
    signIn,
    signUp,
    signOut,
    clearError,
  }), [clearError, error, isLoading, session, signIn, signOut, signUp]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}