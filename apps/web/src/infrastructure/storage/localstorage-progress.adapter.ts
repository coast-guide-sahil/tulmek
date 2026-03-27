import type {
  ProgressStore,
} from "@tulmek/core/ports";
import type { ProgressEntry, ProgressMap } from "@tulmek/core/domain";
import { STORAGE_KEYS } from "@tulmek/config/constants";

const STORAGE_KEY = STORAGE_KEYS.progress;

/**
 * LocalStorage adapter for progress persistence.
 *
 * Stores a JSON map of slug → ProgressEntry in localStorage.
 * Swap this by creating another adapter implementing the ProgressStore port.
 */
export class LocalStorageProgressStore implements ProgressStore {
  private cache: ProgressMap | null = null;
  private storageHandler: ((e: StorageEvent) => void) | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.storageHandler = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY) {
          // Another tab changed progress — invalidate cache and notify
          const updated: ProgressMap = e.newValue
            ? (JSON.parse(e.newValue) as ProgressMap)
            : {};
          this.cache = updated;
          this.notifyListeners(updated);
        }
      };
      window.addEventListener("storage", this.storageHandler);
    }
  }

  /** Removes the cross-tab sync listener. Call when the adapter is no longer needed. */
  dispose(): void {
    if (this.storageHandler && typeof window !== "undefined") {
      window.removeEventListener("storage", this.storageHandler);
      this.storageHandler = null;
    }
  }

  async getAll(): Promise<ProgressMap> {
    if (this.cache) return this.cache;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.cache = raw ? (JSON.parse(raw) as ProgressMap) : {};
      return this.cache;
    } catch {
      return {};
    }
  }

  async get(slug: string): Promise<ProgressEntry | null> {
    const all = await this.getAll();
    return all[slug] ?? null;
  }

  async set(slug: string, entry: ProgressEntry): Promise<void> {
    const all = await this.getAll();
    const updated = { ...all, [slug]: entry };
    this.cache = updated;
    this.persist(updated);
    this.notifyListeners(updated);
  }

  async remove(slug: string): Promise<void> {
    const all = await this.getAll();
    const rest = Object.fromEntries(
      Object.entries(all).filter(([key]) => key !== slug),
    );
    this.cache = rest;
    this.persist(rest);
    this.notifyListeners(rest);
  }

  async clear(): Promise<void> {
    this.cache = {};
    localStorage.removeItem(STORAGE_KEY);
    this.notifyListeners({});
  }

  private listeners = new Set<(progress: ProgressMap) => void>();

  subscribe(listener: (progress: ProgressMap) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(progress: ProgressMap): void {
    for (const listener of this.listeners) {
      listener(progress);
    }
  }

  private persist(data: ProgressMap): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage full — silently fail (data is in cache)
    }
  }
}
