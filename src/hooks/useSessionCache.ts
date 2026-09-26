/**
 * A hook for reading and writing session-scoped cache entries in sessionStorage.
 * Used to persist AI-generated outputs (summaries, risk graphs) within the session.
 * @param key - The sessionStorage key for this cache entry.
 */
export function useSessionCache<T>(key: string): {
  get: () => T | null;
  set: (value: T) => void;
  clear: () => void;
} {
  const get = (): T | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  };

  const set = (value: T): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(key, JSON.stringify(value));
  };

  const clear = (): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(key);
  };

  return { get, set, clear };
}
