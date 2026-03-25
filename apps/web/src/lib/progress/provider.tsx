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
import type { ProgressStore, NoteStore } from "@tulmek/core/ports";
import { createProgressStore, type UseProgressStore } from "./store";
import { LocalStorageProgressStore } from "@/infrastructure/storage/localstorage-progress.adapter";
import { IDBNoteStore } from "@/infrastructure/storage/idb-note.adapter";

type ProgressStoreApi = ReturnType<typeof createProgressStore>;

const ProgressContext = createContext<ProgressStoreApi | null>(null);

/**
 * Default adapters — the ONLY place concrete implementations are chosen.
 * Swap these to change storage backends.
 */
const defaultDeps: { progressStore: ProgressStore; noteStore: NoteStore } = {
  progressStore: new LocalStorageProgressStore(),
  noteStore: new IDBNoteStore(),
};

interface ProgressProviderProps {
  children: ReactNode;
  /** Override adapters for testing or alternative backends */
  deps?: { progressStore: ProgressStore; noteStore: NoteStore };
}

/**
 * Provider that creates and hydrates the progress store.
 *
 * Adapters are configurable via `deps` prop for testability.
 * Default adapters: LocalStorage (progress) + IndexedDB (notes).
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
      {children}
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
