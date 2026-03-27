import { create } from "zustand";
import type { BookmarkStore, HubSearchEngine, HubSearchParams } from "@tulmek/core/ports";
import type { BookmarkMap, FeedArticle, HubFacetedResult } from "@tulmek/core/domain";

const READ_STORAGE_KEY = "tulmek:hub:read";

function loadReadSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadSet(readIds: Set<string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...readIds]));
}

interface HubState {
  /** All bookmarks keyed by article ID */
  bookmarks: BookmarkMap;
  /** Whether the store has been hydrated from persistence */
  hydrated: boolean;
  /** Current search/filter results */
  searchResults: HubFacetedResult | null;
  /** Whether a search is in progress */
  searching: boolean;
  /** Set of read article IDs */
  readIds: Set<string>;
}

interface HubActions {
  /** Initialize store — loads bookmarks and read state from persistence */
  hydrate: () => Promise<void>;
  /** Index articles in search engine */
  indexArticles: (articles: FeedArticle[]) => Promise<void>;
  /** Search articles */
  search: (params: HubSearchParams) => Promise<void>;
  /** Toggle bookmark state for an article */
  toggleBookmark: (articleId: string) => Promise<void>;
  /** Check if an article is bookmarked */
  isBookmarked: (articleId: string) => boolean;
  /** Get all bookmarked article IDs */
  getBookmarkedIds: () => string[];
  /** Mark an article as read */
  markAsRead: (articleId: string) => void;
  /** Check if an article has been read */
  isRead: (articleId: string) => boolean;
}

type HubStore = HubState & HubActions;

/**
 * Factory that creates the Zustand store with injected dependencies.
 * Follows the same composition pattern as the progress store.
 */
export function createHubStore(deps: {
  bookmarkStore: BookmarkStore;
  searchEngine: HubSearchEngine;
}) {
  return create<HubStore>()((set, get) => ({
    bookmarks: {},
    hydrated: false,
    searchResults: null,
    searching: false,
    readIds: new Set<string>(),

    hydrate: async () => {
      const bookmarks = await deps.bookmarkStore.getAll();
      const readIds = loadReadSet();
      set({ bookmarks, readIds, hydrated: true });
    },

    indexArticles: async (articles: FeedArticle[]) => {
      await deps.searchEngine.index(articles);
    },

    search: async (params: HubSearchParams) => {
      set({ searching: true });
      const results = await deps.searchEngine.search(params);
      set({ searchResults: results, searching: false });
    },

    toggleBookmark: async (articleId: string) => {
      const previousBookmarks = get().bookmarks;
      const isCurrentlyBookmarked = articleId in previousBookmarks;

      // Optimistic update
      if (isCurrentlyBookmarked) {
        const { [articleId]: _removed, ...rest } = previousBookmarks;
        void _removed;
        set({ bookmarks: rest });
      } else {
        set({
          bookmarks: {
            ...previousBookmarks,
            [articleId]: { articleId, savedAt: new Date().toISOString() },
          },
        });
      }

      // Persist with rollback on failure
      try {
        if (isCurrentlyBookmarked) {
          await deps.bookmarkStore.remove(articleId);
        } else {
          await deps.bookmarkStore.add(articleId);
        }
      } catch (err) {
        set({ bookmarks: previousBookmarks });
        console.error("Failed to persist bookmark:", err);
      }
    },

    isBookmarked: (articleId: string) => {
      return articleId in get().bookmarks;
    },

    getBookmarkedIds: () => {
      return Object.keys(get().bookmarks);
    },

    markAsRead: (articleId: string) => {
      const readIds = new Set(get().readIds);
      if (readIds.has(articleId)) return;
      readIds.add(articleId);
      set({ readIds });
      saveReadSet(readIds);
    },

    isRead: (articleId: string) => {
      return get().readIds.has(articleId);
    },
  }));
}

export type UseHubStore = ReturnType<typeof createHubStore>;
