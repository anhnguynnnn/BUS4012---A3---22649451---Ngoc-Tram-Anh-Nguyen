const PREFIX = "muse";

// Current authenticated user ID. When set, all storage keys are scoped to this user.
let activeUserId: string | null = null;

/** Returns the current user-scoped key prefix. */
function keyPrefix(): string {
  return activeUserId ? `${PREFIX}:${activeUserId}:` : `${PREFIX}:`;
}

/**
 * Set the active user ID for localStorage scoping.
 * All subsequent storage reads/writes will be namespaced under this user.
 * Pass null to clear (used on logout).
 */
export function setActiveUserId(userId: string | null): void {
  activeUserId = userId;
}

/**
 * Returns the storage keys scoped to the current active user.
 * The keys change dynamically based on the active user ID.
 */
export const STORAGE_KEYS = {
  get user() { return `${keyPrefix()}user`; },
  get loggedIn() { return `${keyPrefix()}loggedIn`; },
  get onboarding() { return `${keyPrefix()}onboarding`; },
  get savedPosts() { return `${keyPrefix()}savedPosts`; },
  get albums() { return `${keyPrefix()}albums`; },
  get appPreferences() { return `${keyPrefix()}appPreferences`; },
  get accessToken() { return `${PREFIX}AccessToken`; },
  get refreshToken() { return `${PREFIX}RefreshToken`; },
  entryPopupSeen: "muse_has_seen_entry_popup",
} as const;

export function saveToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? (JSON.parse(rawValue) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function removeFromStorage(key: string): void {
  localStorage.removeItem(key);
}

export function clearMuseStorage(): void {
  Object.keys(localStorage)
    .filter((key) => key.startsWith(`${PREFIX}:`))
    .forEach((key) => localStorage.removeItem(key));
}

export function clearAuthTokens(): void {
  removeFromStorage(STORAGE_KEYS.accessToken);
  removeFromStorage(STORAGE_KEYS.refreshToken);
}