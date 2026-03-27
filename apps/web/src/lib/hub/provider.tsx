"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/shallow";
import type { FeedArticle } from "@tulmek/core/domain";
import { STORAGE_KEYS } from "@tulmek/config/constants";
import { createHubStore, type UseHubStore, type HubStoreDeps } from "./store";
import { LocalStorageBookmarkStore } from "@/infrastructure/hub/localstorage-bookmark.adapter";
import { LocalStorageSetStorage } from "@/infrastructure/hub/localstorage-set-storage.adapter";
import { OramaHubSearchEngine } from "@/infrastructure/hub/orama-hub-search.adapter";

type HubStoreApi = ReturnType<typeof createHubStore>;

const HubStoreContext = createContext<HubStoreApi | null>(null);
const ArticlesContext = createContext<FeedArticle[]>([]);

/**
 * Default adapters — the ONLY place concrete implementations are chosen.
 * Swap these to change storage/search backends.
 */
const defaultDeps: HubStoreDeps = {
  bookmarkStore: new LocalStorageBookmarkStore(),
  searchEngine: new OramaHubSearchEngine(),
  setStorage: new LocalStorageSetStorage(),
  storageKeys: { readKey: STORAGE_KEYS.hubRead, dismissedKey: STORAGE_KEYS.hubDismissed },
};

interface HubProviderProps {
  children: ReactNode;
  /** Pre-loaded articles (from server component) */
  articles: FeedArticle[];
  /** Override adapters for testing */
  deps?: HubStoreDeps;
}

/**
 * Provider that creates and hydrates the hub store.
 *
 * Adapters are configurable via `deps` prop for testability.
 * Default adapters: LocalStorage (bookmarks) + Orama (search).
 */
export function HubProvider({
  children,
  articles,
  deps = defaultDeps,
}: HubProviderProps) {
  const [store] = useState<HubStoreApi>(() => createHubStore(deps));

  useEffect(() => {
    store.getState().hydrate().catch((err) => {
      console.error("Failed to hydrate hub store:", err);
    });

    store.getState().indexArticles(articles).catch((err) => {
      console.error("Failed to index hub articles:", err);
    });
  }, [store, articles]);

  return (
    <HubStoreContext.Provider value={store}>
      <ArticlesContext.Provider value={articles}>
        {children}
      </ArticlesContext.Provider>
    </HubStoreContext.Provider>
  );
}

/**
 * Hook to access hub store state with a selector.
 */
export function useHub<T>(
  selector: (state: ReturnType<UseHubStore["getState"]>) => T,
): T {
  const store = useContext(HubStoreContext);
  if (!store) {
    throw new Error("useHub must be used within <HubProvider>");
  }
  return useStore(store, selector);
}

/**
 * Hook to access hub store actions (stable references).
 */
export function useHubActions() {
  const store = useContext(HubStoreContext);
  if (!store) {
    throw new Error("useHubActions must be used within <HubProvider>");
  }
  return useStore(
    store,
    useShallow((s) => ({
      toggleBookmark: s.toggleBookmark,
      isBookmarked: s.isBookmarked,
      getBookmarkedIds: s.getBookmarkedIds,
      search: s.search,
      indexArticles: s.indexArticles,
      markAsRead: s.markAsRead,
      isRead: s.isRead,
      dismiss: s.dismiss,
    })),
  );
}

/**
 * Hook to access the pre-loaded articles.
 */
export function useArticles(): FeedArticle[] {
  return useContext(ArticlesContext);
}
