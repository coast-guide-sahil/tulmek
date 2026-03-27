import type { SetStorage } from "@tulmek/core/ports";

/**
 * localStorage adapter for SetStorage port.
 * Persists Set<string> as JSON arrays in localStorage.
 */
export class LocalStorageSetStorage implements SetStorage {
  async load(key: string): Promise<Set<string>> {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(key);
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
      return new Set();
    }
  }

  async save(key: string, data: Set<string>): Promise<void> {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify([...data]));
  }
}
