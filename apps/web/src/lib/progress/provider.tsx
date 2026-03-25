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
import { createProgressStore, type UseProgressStore } from "./store";
import { LocalStorageProgressStore } from "@/infrastructure/storage/localstorage-progress.adapter";
import { IDBNoteStore } from "@/infrastructure/storage/idb-note.adapter";

type ProgressStoreApi = ReturnType<typeof createProgressStore>;

const ProgressContext = createContext<ProgressStoreApi | null>(null);

/**
 * Provider that creates and hydrates the progress store.
 *
 * Adapters are instantiated here — swap implementations by changing
 * these two lines. The rest of the app doesn't care.
 */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [store] = useState<ProgressStoreApi>(() =>
    createProgressStore({
      progressStore: new LocalStorageProgressStore(),
      noteStore: new IDBNoteStore(),
    }),
  );

  useEffect(() => {
    store.getState().hydrate();

    // Request persistent storage so browser doesn't evict our data
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
 * Hook to access progress store state.
 * Uses Zustand's useStore with a selector for optimal re-renders.
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
 * Hook to access progress store actions (stable references, no re-renders).
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
