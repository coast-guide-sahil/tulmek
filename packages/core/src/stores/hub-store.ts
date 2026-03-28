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
  /** Average dwell time in seconds per category */
  avgDwellTime: Record<string, number>;
}

const DEFAULT_SIGNALS: ImplicitSignals = {
  categoryEngagement: {},
  sourceEngagement: {},
  sessionCount: 0,
  avgDwellTime: {},
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
  mutedSources: Set<string>;
  mutedCategories: Set<string>;
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
  /** Start dwell timer when user opens an article */
  startDwellTimer: (articleId: string, category: string) => void;
  /** Stop dwell timer when user returns (page becomes visible) */
  stopDwellTimer: () => void;
  /** Mute/unmute a source */
  toggleMuteSource: (source: string) => void;
  /** Mute/unmute a category */
  toggleMuteCategory: (category: string) => void;
}

export type HubStoreState = HubState & HubActions;

export interface HubStoreDeps {
  bookmarkStore: BookmarkStore;
  searchEngine: HubSearchEngine;
  setStorage: SetStorage;
  /** Storage keys for persistence — injected from @tulmek/config */
  storageKeys: {
    readKey: string;
    dismissedKey: string;
    signalsKey: string;
    mutedSourcesKey: string;
    mutedCategoriesKey: string;
  };
}

export function createHubStore(deps: HubStoreDeps) {
  // Dwell timer state scoped to this store instance (not module-level)
  let dwellStart: number | null = null;
  let dwellCategory: string | null = null;

  return create<HubStoreState>()((set, get) => ({
    bookmarks: {},
    hydrated: false,
    searchResults: null,
    searching: false,
    readIds: new Set<string>(),
    mutedSources: new Set<string>(),
    mutedCategories: new Set<string>(),
    signals: DEFAULT_SIGNALS,
    dismissedIds: new Set<string>(),

    hydrate: async () => {
      const [bookmarks, readIds, dismissedIds, mutedSources, mutedCategories] = await Promise.all([
        deps.bookmarkStore.getAll(),
        deps.setStorage.load(deps.storageKeys.readKey),
        deps.setStorage.load(deps.storageKeys.dismissedKey),
        deps.setStorage.load(deps.storageKeys.mutedSourcesKey),
        deps.setStorage.load(deps.storageKeys.mutedCategoriesKey),
      ]);

      // Load implicit signals
      let signals = DEFAULT_SIGNALS;
      try {
        const signalSet = await deps.setStorage.load(deps.storageKeys.signalsKey);
        const raw = [...signalSet][0]; // Stored as single JSON string in a Set
        if (raw) signals = JSON.parse(raw) as ImplicitSignals;
      } catch { /* use defaults */ }
      signals = { ...signals, sessionCount: signals.sessionCount + 1 };

      set({ bookmarks, readIds, dismissedIds, mutedSources, mutedCategories, signals, hydrated: true });
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

    toggleMuteSource: (source: string) => {
      const mutedSources = new Set(get().mutedSources);
      if (mutedSources.has(source)) mutedSources.delete(source);
      else mutedSources.add(source);
      set({ mutedSources });
      void deps.setStorage.save(deps.storageKeys.mutedSourcesKey, mutedSources);
    },

    toggleMuteCategory: (category: string) => {
      const mutedCategories = new Set(get().mutedCategories);
      if (mutedCategories.has(category)) mutedCategories.delete(category);
      else mutedCategories.add(category);
      set({ mutedCategories });
      void deps.setStorage.save(deps.storageKeys.mutedCategoriesKey, mutedCategories);
    },

    startDwellTimer: (_articleId: string, category: string) => {
      dwellStart = Date.now();
      dwellCategory = category;
    },

    stopDwellTimer: () => {
      if (!dwellStart || !dwellCategory) return;
      const dwellSeconds = Math.round((Date.now() - dwellStart) / 1000);
      const category = dwellCategory;
      dwellStart = null;
      dwellCategory = null;

      // Ignore very short (<3s) or very long (>30min) dwell times
      if (dwellSeconds < 3 || dwellSeconds > 1800) return;

      const prev = get().signals;
      const prevAvg = prev.avgDwellTime[category] ?? 30;
      const newAvg = updateEMA(prevAvg, dwellSeconds);
      const signals: ImplicitSignals = {
        ...prev,
        avgDwellTime: { ...prev.avgDwellTime, [category]: Math.round(newAvg) },
      };
      set({ signals });
      void deps.setStorage.save(deps.storageKeys.signalsKey, new Set([JSON.stringify(signals)]));
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
