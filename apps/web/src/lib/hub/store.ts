import { create } from "zustand";
import type { BookmarkStore } from "@tulmek/core/ports";
import type { BookmarkMap, FeedArticle } from "@tulmek/core/domain";
import type { OramaHubSearchEngine, HubSearchParams } from "@/infrastructure/hub/orama-hub-search.adapter";
import type { HubFacetedResult } from "@tulmek/core/domain";

interface HubState {
  /** All bookmarks keyed by article ID */
  bookmarks: BookmarkMap;
  /** Whether the store has been hydrated from persistence */
  hydrated: boolean;
  /** Current search/filter results */
  searchResults: HubFacetedResult | null;
  /** Whether a search is in progress */
  searching: boolean;
}

interface HubActions {
  /** Initialize store — loads bookmarks from persistence */
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
}

type HubStore = HubState & HubActions;

/**
 * Factory that creates the Zustand store with injected dependencies.
 * Follows the same composition pattern as the progress store.
 */
export function createHubStore(deps: {
  bookmarkStore: BookmarkStore;
  searchEngine: OramaHubSearchEngine;
}) {
  return create<HubStore>()((set, get) => ({
    bookmarks: {},
    hydrated: false,
    searchResults: null,
    searching: false,

    hydrate: async () => {
      const bookmarks = await deps.bookmarkStore.getAll();
      set({ bookmarks, hydrated: true });
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
  }));
}

export type UseHubStore = ReturnType<typeof createHubStore>;
