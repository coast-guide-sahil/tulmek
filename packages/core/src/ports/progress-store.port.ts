import type { ProgressEntry, ProgressMap } from "../domain/progress";

/**
 * Port for persisting progress state.
 *
 * Adapters: LocalStorageProgressStore, TursoProgressStore, etc.
 * The consumer doesn't care where progress is stored — localStorage,
 * IndexedDB, SQLite, cloud API — this interface is the contract.
 */
export interface ProgressStore {
  /** Load all progress entries */
  getAll(): Promise<ProgressMap>;

  /** Get progress for a single item */
  get(slug: string): Promise<ProgressEntry | null>;

  /** Set progress for a single item */
  set(slug: string, entry: ProgressEntry): Promise<void>;

  /** Remove progress for a single item */
  remove(slug: string): Promise<void>;

  /** Clear all progress data */
  clear(): Promise<void>;

  /** Subscribe to changes (optional — adapters that don't support this return a no-op) */
  subscribe?(listener: (progress: ProgressMap) => void): () => void;
}
