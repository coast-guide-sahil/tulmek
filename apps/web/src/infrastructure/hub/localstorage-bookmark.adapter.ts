import type { BookmarkStore } from "@tulmek/core/ports";
import type { Bookmark, BookmarkMap } from "@tulmek/core/domain";
import { STORAGE_KEYS } from "@tulmek/config/constants";

const STORAGE_KEY = STORAGE_KEYS.hubBookmarks;

/**
 * LocalStorage adapter for BookmarkStore port.
 *
 * Stores bookmarks in localStorage with cross-tab sync via storage events.
 * Swap this for IndexedDB, cloud API, etc. without touching consumers.
 */
export class LocalStorageBookmarkStore implements BookmarkStore {
  private getMap(): BookmarkMap {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as BookmarkMap) : {};
    } catch {
      return {};
    }
  }

  private saveMap(map: BookmarkMap): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  }

  async getAll(): Promise<BookmarkMap> {
    return this.getMap();
  }

  async has(articleId: string): Promise<boolean> {
    return articleId in this.getMap();
  }

  async add(articleId: string): Promise<Bookmark> {
    const map = this.getMap();
    const bookmark: Bookmark = {
      articleId,
      savedAt: new Date().toISOString(),
    };
    map[articleId] = bookmark;
    this.saveMap(map);
    return bookmark;
  }

  async remove(articleId: string): Promise<void> {
    const map = this.getMap();
    delete map[articleId];
    this.saveMap(map);
  }

  async clear(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
  }

  subscribe(listener: (bookmarks: BookmarkMap) => void): () => void {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        listener(this.getMap());
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }
}
