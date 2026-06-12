import type { AuthUser } from "../types";
import { getFromStorage, removeFromStorage, saveToStorage, STORAGE_KEYS } from "../utils/storage";

// Use relative paths by default so the Vite dev-server proxy forwards API
// requests to the FastAPI backend.  This avoids cross-origin issues and the
// "Could not connect to the server" error when the browser blocks direct
// fetches to localhost:8000.  Set VITE_BACKEND_BASE_URL only if you need to
// bypass the proxy (e.g. in production or for testing).
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || "";

export type BackendUser = Record<string, unknown>;

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
  user: AuthUser;
};

export type SignUpResponse = LoginResponse | Record<string, unknown>;

export type UserProfileResponse = AuthUser;

export type LogoutResponse = {
  message: string;
};

function getErrorMessage(data: unknown): string {
  if (typeof data === "object" && data !== null && "detail" in data) {
    const detail = (data as { detail?: unknown }).detail;

    // FastAPI returns detail as a string for HTTPException errors.
    if (typeof detail === "string") return detail;

    // FastAPI returns detail as an array for Pydantic validation errors (422).
    // Extract the first human-readable message from the array.
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as Record<string, unknown>;
      if (typeof first.msg === "string") return first.msg;
      return "Validation error: please check your input.";
    }

    // Supabase and custom errors return detail as an object with msg or message.
    if (typeof detail === "object" && detail !== null && "msg" in detail) {
      return String((detail as { msg?: unknown }).msg);
    }
    if (typeof detail === "object" && detail !== null && "message" in detail) {
      return String((detail as { message?: unknown }).message);
    }
  }

  if (typeof data === "object" && data !== null && "msg" in data) {
    return String((data as { msg?: unknown }).msg);
  }

  return "MUSÉ backend request failed.";
}

async function requestBackend<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data as T;
}

async function requestBackendWithToken<T>(path: string, accessToken: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data as T;
}

// Standalone helper for future frontend wiring.
// Existing frontend screens are not modified in Phase 1.
export function signup(email: string, password: string, fullName?: string): Promise<SignUpResponse> {
  return requestBackend<SignUpResponse>("/auth/signup", {
    email,
    password,
    full_name: fullName,
  });
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return requestBackend<LoginResponse>("/auth/login", {
    email,
    password,
  });
}

export function getMe(accessToken: string): Promise<UserProfileResponse> {
  return requestBackendWithToken<UserProfileResponse>("/auth/me", accessToken, { method: "GET" });
}

export function logout(accessToken: string): Promise<LogoutResponse> {
  return requestBackendWithToken<LogoutResponse>("/auth/logout", accessToken, { method: "POST" });
}

export function saveAuthTokens(accessToken: string, refreshToken: string): void {
  saveToStorage(STORAGE_KEYS.accessToken, accessToken);
  saveToStorage(STORAGE_KEYS.refreshToken, refreshToken);
}

export function getStoredAccessToken(): string {
  return getFromStorage(STORAGE_KEYS.accessToken, "");
}

export function getStoredRefreshToken(): string {
  return getFromStorage(STORAGE_KEYS.refreshToken, "");
}

export function clearAuthTokens(): void {
  removeFromStorage(STORAGE_KEYS.accessToken);
  removeFromStorage(STORAGE_KEYS.refreshToken);
}

// ---- Phase 5A: Profile persistence ----

export type ProfileResponse = {
  id: string;
  full_name?: string | null;
  onboarding_completed: boolean;
  style_attraction: string[];
  size_range: string[];
  height_range?: string | null;
  fit_preferences: string[];
  styling_direction: string[];
  updated_at?: string | null;
};

export type ProfileUpdatePayload = {
  onboarding_completed?: boolean;
  style_attraction?: string[];
  size_range?: string[];
  height_range?: string;
  fit_preferences?: string[];
  styling_direction?: string[];
};

export function getProfile(accessToken: string): Promise<ProfileResponse> {
  return requestBackendWithToken<ProfileResponse>("/auth/profile", accessToken, { method: "GET" });
}

export function updateProfile(accessToken: string, updates: ProfileUpdatePayload): Promise<ProfileResponse> {
  return requestBackendWithToken<ProfileResponse>("/auth/profile", accessToken, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

// ---- Phase 6: Recommendation Engine ----

export type InteractionType = "view" | "save" | "share" | "album_add";

export function trackInteraction(accessToken: string, postId: string, interactionType: InteractionType): Promise<Record<string, unknown>> {
  return requestBackendWithToken("/interactions", accessToken, {
    method: "POST",
    body: JSON.stringify({ post_id: postId, interaction_type: interactionType }),
  });
}

export type PostData = {
  id: string;
  creator_name?: string | null;
  image_url?: string | null;
  description?: string | null;
  tags?: string[] | null;
  style_category?: string | null;
  style_tags: string[];
  fit_tags: string[];
  gender_style: string[];
  occasion_tags: string[];
  size_range: string[];
  height_range?: string | null;
  body_friendly_label?: string | null;
  match_label_primary?: string | null;
  match_label_secondary?: string | null;
  view_count: number;
  save_count: number;
  share_count: number;
  created_at?: string | null;
};

export type RecommendationItem = {
  post: PostData;
  match_percentage: number;
  match_reason?: string | null;
  match_reason_secondary?: string | null;
  onboarding_score: number;
  behaviour_score: number;
  final_score: number;
};

export function getRecommendations(accessToken: string): Promise<RecommendationItem[]> {
  return requestBackendWithToken<RecommendationItem[]>("/recommendations", accessToken, { method: "GET" });
}

export function getTrendingPosts(): Promise<PostData[]> {
  return fetch(`${BACKEND_BASE_URL}/posts/trending`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch trending posts");
    return res.json();
  });
}

export function getPosts(accessToken?: string, limit = 50): Promise<PostData[]> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return fetch(`${BACKEND_BASE_URL}/posts?limit=${limit}`, {
    method: "GET",
    headers,
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch posts");
    return res.json();
  });
}
