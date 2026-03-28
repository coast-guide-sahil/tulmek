/**
 * Platform-agnostic Hub store factory.
 * Shared by web (localStorage) and mobile (AsyncStorage).
 *
 * Accepts deps via dependency injection — adapters are platform-specific,
 * store logic is shared. Uses zustand as a peerDependency.
 */

import { create } from "zustand";
import type { BookmarkStore, HubSearchEngine, HubSearchParams, SetStorage } from "../ports";
import type { Bookmark, BookmarkMap, FeedArticle, HubFacetedResult } from "../domain";

/** EMA-based implicit engagement signals for personalization */
export interface ImplicitSignals {
  categoryEngagement: Record<string, number>;
  sourceEngagement: Record<string, number>;
  sessionCount: number;
}

const DEFAULT_SIGNALS: ImplicitSignals = {
  categoryEngagement: {},
  sourceEngagement: {},
  sessionCount: 0,
};

const EMA_ALPHA = 0.3; // Recent actions matter ~3x more than older ones

function updateEMA(current: number, signal: number): number {
  return EMA_ALPHA * signal + (1 - EMA_ALPHA) * current;
}

export interface HubState {
  bookmarks: BookmarkMap;
  hydrated: boolean;
  searchResults: HubFacetedResult | null;
  searching: boolean;
  readIds: Set<string>;
  dismissedIds: Set<string>;
  signals: ImplicitSignals;
}

export interface HubActions {
  hydrate: () => Promise<void>;
  indexArticles: (articles: FeedArticle[]) => Promise<void>;
  search: (params: HubSearchParams) => Promise<void>;
  toggleBookmark: (articleId: string) => Promise<void>;
  isBookmarked: (articleId: string) => boolean;
  getBookmarkedIds: () => string[];
  markAsRead: (articleId: string) => void;
  isRead: (articleId: string) => boolean;
  dismiss: (articleId: string) => void;
  /** Record implicit engagement signal (call on article click/read) */
  recordEngagement: (category: string, source: string) => void;
}

export type HubStoreState = HubState & HubActions;

export interface HubStoreDeps {
  bookmarkStore: BookmarkStore;
  searchEngine: HubSearchEngine;
  setStorage: SetStorage;
  /** Storage keys for persistence — injected from @tulmek/config */
  storageKeys: { readKey: string; dismissedKey: string; signalsKey: string };
}

export function createHubStore(deps: HubStoreDeps) {
  return create<HubStoreState>()((set, get) => ({
    bookmarks: {},
    hydrated: false,
    searchResults: null,
    searching: false,
    readIds: new Set<string>(),
    signals: DEFAULT_SIGNALS,
    dismissedIds: new Set<string>(),

    hydrate: async () => {
      const [bookmarks, readIds, dismissedIds] = await Promise.all([
        deps.bookmarkStore.getAll(),
        deps.setStorage.load(deps.storageKeys.readKey),
        deps.setStorage.load(deps.storageKeys.dismissedKey),
      ]);

      // Load implicit signals
      let signals = DEFAULT_SIGNALS;
      try {
        const signalSet = await deps.setStorage.load(deps.storageKeys.signalsKey);
        const raw = [...signalSet][0]; // Stored as single JSON string in a Set
        if (raw) signals = JSON.parse(raw) as ImplicitSignals;
      } catch { /* use defaults */ }
      signals = { ...signals, sessionCount: signals.sessionCount + 1 };

      set({ bookmarks, readIds, dismissedIds, signals, hydrated: true });
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
            [articleId]: { articleId, savedAt: new Date().toISOString() } as unknown as Bookmark,
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

    isBookmarked: (articleId: string) => articleId in get().bookmarks,
    getBookmarkedIds: () => Object.keys(get().bookmarks),

    markAsRead: (articleId: string) => {
      const readIds = new Set(get().readIds);
      if (readIds.has(articleId)) return;
      readIds.add(articleId);
      set({ readIds });
      void deps.setStorage.save(deps.storageKeys.readKey, readIds);
    },

    isRead: (articleId: string) => get().readIds.has(articleId),

    dismiss: (articleId: string) => {
      const dismissedIds = new Set(get().dismissedIds);
      dismissedIds.add(articleId);
      set({ dismissedIds });
      void deps.setStorage.save(deps.storageKeys.dismissedKey, dismissedIds);
    },

    recordEngagement: (category: string, source: string) => {
      const prev = get().signals;
      const signals: ImplicitSignals = {
        ...prev,
        categoryEngagement: {
          ...prev.categoryEngagement,
          [category]: updateEMA(prev.categoryEngagement[category] ?? 0.5, 1.0),
        },
        sourceEngagement: {
          ...prev.sourceEngagement,
          [source]: updateEMA(prev.sourceEngagement[source] ?? 0.5, 1.0),
        },
      };
      set({ signals });
      // Persist as single JSON string inside a Set
      void deps.setStorage.save(deps.storageKeys.signalsKey, new Set([JSON.stringify(signals)]));
    },
  }));
}

export type UseHubStore = ReturnType<typeof createHubStore>;
