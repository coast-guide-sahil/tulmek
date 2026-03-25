import type { Note } from "../domain/progress";

/**
 * Port for persisting per-item markdown notes.
 *
 * Adapters: IndexedDBNoteStore, OPFSNoteStore, TursoNoteStore, etc.
 * Notes can be large (markdown with code blocks), so this is separate
 * from progress state which is tiny (booleans).
 */
export interface NoteStore {
  /** Get a note by item slug */
  get(slug: string): Promise<Note | null>;

  /** Save a note (upsert — creates or updates) */
  set(slug: string, content: string): Promise<void>;

  /** Delete a note */
  remove(slug: string): Promise<void>;

  /** Get all notes (for export/sync) */
  getAll(): Promise<Note[]>;

  /** Check if a note exists without loading content */
  has(slug: string): Promise<boolean>;
}
