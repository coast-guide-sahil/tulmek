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
 * Swap this for OPFS, Turso, or a cloud API adapter.
 * idb-keyval is ~600 bytes — zero config IndexedDB wrapper.
 */
export class IDBNoteStore implements NoteStore {
  async get(slug: string): Promise<Note | null> {
    const note = await get<Note>(PREFIX + slug);
    return note ?? null;
  }

  async set(slug: string, content: string): Promise<void> {
    const note: Note = {
      itemSlug: slug,
      content,
      updatedAt: new Date().toISOString(),
    };
    await set(PREFIX + slug, note);
  }

  async remove(slug: string): Promise<void> {
    await del(PREFIX + slug);
  }

  async getAll(): Promise<Note[]> {
    const allEntries = await entries<string, Note>();
    return allEntries
      .filter(([key]) => key.startsWith(PREFIX))
      .map(([, value]) => value);
  }

  async has(slug: string): Promise<boolean> {
    const note = await get(PREFIX + slug);
    return note !== undefined;
  }
}
