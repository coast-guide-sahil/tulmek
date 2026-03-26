import type { Bookmark, BookmarkMap } from "../domain/article";

/**
 * Port for persisting user bookmarks (saved articles).
 *
 * Adapters implement this interface — swap the storage backend without touching consumers.
 * Bookmarks are lightweight (just article ID + timestamp), stored client-side.
 */
export interface BookmarkStore {
  /** Load all bookmarks */
  getAll(): Promise<BookmarkMap>;

  /** Check if an article is bookmarked */
  has(articleId: string): Promise<boolean>;

  /** Add a bookmark */
  add(articleId: string): Promise<Bookmark>;

  /** Remove a bookmark */
  remove(articleId: string): Promise<void>;

  /** Clear all bookmarks */
  clear(): Promise<void>;

  /** Subscribe to changes (for cross-tab sync) */
  subscribe?(listener: (bookmarks: BookmarkMap) => void): () => void;
}
