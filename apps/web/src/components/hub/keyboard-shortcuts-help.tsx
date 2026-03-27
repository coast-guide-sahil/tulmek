"use client";

import { useState } from "react";

const SHORTCUTS = [
  { key: "/", desc: "Focus search" },
  { key: "Esc", desc: "Clear search & blur" },
  { key: "Home", desc: "Scroll to top" },
  { key: "←→", desc: "Navigate categories" },
];

/**
 * Floating keyboard shortcuts help badge.
 * Shows "?" button that expands to show all shortcuts.
 * Power users love keyboard shortcuts — this teaches them.
 */
export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {open && (
        <div className="mb-2 rounded-xl border border-border bg-card p-4 shadow-lg">
          <h3 className="text-sm font-semibold text-card-foreground">Keyboard Shortcuts</h3>
          <div className="mt-2 space-y-1.5">
            {SHORTCUTS.map((s) => (
              <div key={s.key} className="flex items-center justify-between gap-6 text-xs">
                <span className="text-muted-foreground">{s.desc}</span>
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-xs font-bold text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
        aria-label={open ? "Hide keyboard shortcuts" : "Show keyboard shortcuts"}
      >
        ?
      </button>
    </div>
  );
}
