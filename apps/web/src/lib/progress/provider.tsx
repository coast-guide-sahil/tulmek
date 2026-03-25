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
import type { ProgressStore, NoteStore, SearchEngine } from "@tulmek/core/ports";
import { createProgressStore, type UseProgressStore } from "./store";
import { LocalStorageProgressStore } from "@/infrastructure/storage/localstorage-progress.adapter";
import { IDBNoteStore } from "@/infrastructure/storage/idb-note.adapter";
import { OramaSearchEngine } from "@/infrastructure/search/orama-search.adapter";

type ProgressStoreApi = ReturnType<typeof createProgressStore>;

const ProgressContext = createContext<ProgressStoreApi | null>(null);
const SearchContext = createContext<SearchEngine | null>(null);

/**
 * Default adapters — the ONLY place concrete implementations are chosen.
 * Swap these to change storage/search backends.
 */
const defaultDeps: {
  progressStore: ProgressStore;
  noteStore: NoteStore;
  searchEngine: SearchEngine;
} = {
  progressStore: new LocalStorageProgressStore(),
  noteStore: new IDBNoteStore(),
  searchEngine: new OramaSearchEngine(),
};

interface ProgressProviderProps {
  children: ReactNode;
  /** Override adapters for testing or alternative backends */
  deps?: {
    progressStore: ProgressStore;
    noteStore: NoteStore;
    searchEngine: SearchEngine;
  };
}

/**
 * Provider that creates and hydrates the progress store.
 *
 * Adapters are configurable via `deps` prop for testability.
 * Default adapters: LocalStorage (progress) + IndexedDB (notes) + Orama (search).
 */
export function ProgressProvider({
  children,
  deps = defaultDeps,
}: ProgressProviderProps) {
  const [store] = useState<ProgressStoreApi>(() =>
    createProgressStore(deps),
  );

  useEffect(() => {
    store.getState().hydrate().catch((err) => {
      console.error("Failed to hydrate progress store:", err);
    });

    if (navigator.storage?.persist) {
      navigator.storage.persist();
    }
  }, [store]);

  return (
    <ProgressContext.Provider value={store}>
      <SearchContext.Provider value={deps.searchEngine}>
        {children}
      </SearchContext.Provider>
    </ProgressContext.Provider>
  );
}

/**
 * Hook to access progress store state with a selector.
 */
export function useProgress<T>(
  selector: (state: ReturnType<UseProgressStore["getState"]>) => T,
): T {
  const store = useContext(ProgressContext);
  if (!store) {
    throw new Error("useProgress must be used within <ProgressProvider>");
  }
  return useStore(store, selector);
}

/**
 * Hook to access the injected SearchEngine adapter.
 */
export function useSearchEngine(): SearchEngine {
  const engine = useContext(SearchContext);
  if (!engine) {
    throw new Error("useSearchEngine must be used within <ProgressProvider>");
  }
  return engine;
}

/**
 * Hook to access progress store actions (stable references).
 */
export function useProgressActions() {
  const store = useContext(ProgressContext);
  if (!store) {
    throw new Error(
      "useProgressActions must be used within <ProgressProvider>",
    );
  }
  return useStore(
    store,
    useShallow((s) => ({
      toggle: s.toggle,
      isCompleted: s.isCompleted,
      countCompleted: s.countCompleted,
      getNote: s.getNote,
      saveNote: s.saveNote,
      deleteNote: s.deleteNote,
      hasNote: s.hasNote,
    })),
  );
}
