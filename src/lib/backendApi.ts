const BACKEND_BASE_URL = "http://localhost:8000";

export type BackendUser = Record<string, unknown>;

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
  user: BackendUser;
};

export type SignUpResponse = Record<string, unknown>;

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
    throw new Error(typeof data?.detail === "string" ? data.detail : "MUSÉ backend request failed.");
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