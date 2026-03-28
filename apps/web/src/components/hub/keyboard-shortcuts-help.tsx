"use client";

import { useState, useEffect } from "react";

const SHORTCUTS = [
  { key: "/", desc: "Focus search" },
  { key: "Esc", desc: "Clear search / close menus" },
  { key: "j", desc: "Next article" },
  { key: "k", desc: "Previous article" },
  { key: "o", desc: "Open article" },
  { key: "b", desc: "Toggle bookmark" },
  { key: "s", desc: "Share article" },
  { key: "r", desc: "Mark as read" },
  { key: "n", desc: "Next category" },
  { key: "Home", desc: "Scroll to top" },
  { key: "?", desc: "Show this help" },
] as const;

/**
 * Keyboard shortcuts help overlay.
 * Press "?" anywhere (outside inputs) or click the floating "?" button
 * to open a modal listing all available keyboard shortcuts.
 */
export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) return;
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      {/* Floating trigger button */}
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-xs font-bold text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Show keyboard shortcuts"
          aria-expanded={open}
        >
          ?
        </button>
      </div>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setOpen(false)}
        >
          <div
            className="mx-4 max-w-sm w-full rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-card-foreground">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {SHORTCUTS.map(({ key, desc }) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-6"
                >
                  <span className="text-sm text-muted-foreground">{desc}</span>
                  <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs font-bold text-card-foreground">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
