const PREFIX = "muse:";

export const STORAGE_KEYS = {
  user: `${PREFIX}user`,
  loggedIn: `${PREFIX}loggedIn`,
  onboarding: `${PREFIX}onboarding`,
  savedPosts: `${PREFIX}savedPosts`,
  albums: `${PREFIX}albums`,
  appPreferences: `${PREFIX}appPreferences`,
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
    .filter((key) => key.startsWith(PREFIX))
    .forEach((key) => localStorage.removeItem(key));
}
