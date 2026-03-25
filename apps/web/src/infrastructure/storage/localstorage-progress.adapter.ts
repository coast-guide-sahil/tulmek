import type {
  ProgressStore,
} from "@tulmek/core/ports";
import type { ProgressEntry, ProgressMap } from "@tulmek/core/domain";

const STORAGE_KEY = "tulmek:progress";

/**
 * LocalStorage adapter for progress persistence.
 *
 * Stores a JSON map of slug → ProgressEntry in localStorage.
 * Swap this out for a Turso/Supabase/API adapter when you need cloud sync.
 */
export class LocalStorageProgressStore implements ProgressStore {
  private cache: ProgressMap | null = null;

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
    const { [slug]: _removed, ...rest } = all;
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
