import { create } from "zustand";
import type { ProgressStore, NoteStore } from "@tulmek/core/ports";
import type { ProgressEntry, ProgressMap } from "@tulmek/core/domain";

interface ProgressState {
  /** All progress entries keyed by slug */
  progress: ProgressMap;
  /** Whether the store has been hydrated from persistence */
  hydrated: boolean;
  /** Note slugs that have content (for showing indicators) */
  noteSlugs: Set<string>;
}

interface ProgressActions {
  /** Initialize store — loads progress from persistence layer */
  hydrate: () => Promise<void>;
  /** Toggle an item's completion state */
  toggle: (slug: string) => Promise<void>;
  /** Check if an item is completed */
  isCompleted: (slug: string) => boolean;
  /** Count completed items from a list of slugs */
  countCompleted: (slugs: string[]) => number;
  /** Get a note for an item */
  getNote: (slug: string) => Promise<string | null>;
  /** Save a note for an item */
  saveNote: (slug: string, content: string) => Promise<void>;
  /** Delete a note */
  deleteNote: (slug: string) => Promise<void>;
  /** Check if a note exists */
  hasNote: (slug: string) => boolean;
}

type ProgressStore_ = ProgressState & ProgressActions;

/**
 * Factory that creates the Zustand store with injected dependencies.
 * This is the composition point — ports are injected, not imported.
 */
export function createProgressStore(deps: {
  progressStore: ProgressStore;
  noteStore: NoteStore;
}) {
  return create<ProgressStore_>()((set, get) => ({
    progress: {},
    hydrated: false,
    noteSlugs: new Set(),

    hydrate: async () => {
      const progress = await deps.progressStore.getAll();
      const allNotes = await deps.noteStore.getAll();
      const noteSlugs = new Set(allNotes.map((n) => n.itemSlug));
      set({ progress, hydrated: true, noteSlugs });
    },

    toggle: async (slug: string) => {
      const current = get().progress[slug];
      const isCompleted = current?.completed ?? false;

      const entry: ProgressEntry = isCompleted
        ? { completed: false, completedAt: null }
        : { completed: true, completedAt: new Date().toISOString() };

      // Optimistic update
      set((state) => ({
        progress: { ...state.progress, [slug]: entry },
      }));

      // Persist
      if (entry.completed) {
        await deps.progressStore.set(slug, entry);
      } else {
        await deps.progressStore.remove(slug);
      }
    },

    isCompleted: (slug: string) => {
      return get().progress[slug]?.completed ?? false;
    },

    countCompleted: (slugs: string[]) => {
      const progress = get().progress;
      return slugs.filter((s) => progress[s]?.completed).length;
    },

    getNote: async (slug: string) => {
      const note = await deps.noteStore.get(slug);
      return note?.content ?? null;
    },

    saveNote: async (slug: string, content: string) => {
      await deps.noteStore.set(slug, content);
      set((state) => {
        const updated = new Set(state.noteSlugs);
        if (content.trim()) {
          updated.add(slug);
        } else {
          updated.delete(slug);
        }
        return { noteSlugs: updated };
      });
    },

    deleteNote: async (slug: string) => {
      await deps.noteStore.remove(slug);
      set((state) => {
        const updated = new Set(state.noteSlugs);
        updated.delete(slug);
        return { noteSlugs: updated };
      });
    },

    hasNote: (slug: string) => {
      return get().noteSlugs.has(slug);
    },
  }));
}

export type UseProgressStore = ReturnType<typeof createProgressStore>;
