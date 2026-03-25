import { get, set, del, entries } from "idb-keyval";
import type { NoteStore } from "@tulmek/core/ports";
import type { Note } from "@tulmek/core/domain";

const PREFIX = "note:";

/**
 * IndexedDB adapter for note persistence (via idb-keyval).
 *
 * Each note is stored as a separate key-value entry:
 *   "note:two-sum" → { itemSlug, content, updatedAt }
 *
 * All operations are wrapped in try/catch to handle IndexedDB
 * unavailability (private browsing, quota exceeded, corruption).
 */
export class IDBNoteStore implements NoteStore {
  async get(slug: string): Promise<Note | null> {
    try {
      const note = await get<Note>(PREFIX + slug);
      return note ?? null;
    } catch (err) {
      console.warn(`IDBNoteStore.get("${slug}") failed:`, err);
      return null;
    }
  }

  async set(slug: string, content: string): Promise<void> {
    try {
      const note: Note = {
        itemSlug: slug,
        content,
        updatedAt: new Date().toISOString(),
      };
      await set(PREFIX + slug, note);
    } catch (err) {
      console.warn(`IDBNoteStore.set("${slug}") failed:`, err);
    }
  }

  async remove(slug: string): Promise<void> {
    try {
      await del(PREFIX + slug);
    } catch (err) {
      console.warn(`IDBNoteStore.remove("${slug}") failed:`, err);
    }
  }

  async getAll(): Promise<Note[]> {
    try {
      const allEntries = await entries<string, Note>();
      return allEntries
        .filter(([key]) => key.startsWith(PREFIX))
        .map(([, value]) => value);
    } catch (err) {
      console.warn("IDBNoteStore.getAll() failed:", err);
      return [];
    }
  }

  async has(slug: string): Promise<boolean> {
    try {
      const note = await get(PREFIX + slug);
      return note !== undefined;
    } catch {
      return false;
    }
  }
}
