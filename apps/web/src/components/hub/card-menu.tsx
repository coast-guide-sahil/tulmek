"use client";

import { useState, useRef, useEffect } from "react";
import { useHubActions } from "@/lib/hub/provider";
import { useToast } from "./toast";
import { getSourceLabel } from "./hub-utils";

interface CardMenuProps {
  readonly articleId: string;
  readonly source: string;
  readonly category: string;
  readonly onDismiss?: (id: string) => void;
}

/**
 * Three-dot overflow menu on article cards.
 * Actions: Hide article, Mute source, Mute category.
 * Undo via toast snackbar.
 */
export function CardMenu({ articleId, source, category, onDismiss }: CardMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toggleMuteSource, toggleMuteCategory } = useHubActions();
  const showToast = useToast();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const sourceLabel = getSourceLabel(source);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground/40 transition-colors hover:text-muted-foreground"
        aria-label="More options"
        aria-expanded={open}
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card py-1 shadow-lg">
          {onDismiss && (
            <button
              onClick={() => { onDismiss(articleId); setOpen(false); showToast("Article hidden"); }}
              className="flex w-full min-h-[40px] items-center px-3 text-sm text-card-foreground hover:bg-muted"
            >
              Hide this article
            </button>
          )}
          <button
            onClick={() => {
              toggleMuteSource(source);
              setOpen(false);
              showToast(`Muted ${sourceLabel}. Undo in settings.`);
            }}
            className="flex w-full min-h-[40px] items-center px-3 text-sm text-card-foreground hover:bg-muted"
          >
            Mute {sourceLabel}
          </button>
          <button
            onClick={() => {
              toggleMuteCategory(category);
              setOpen(false);
              showToast(`Muted category. Undo in settings.`);
            }}
            className="flex w-full min-h-[40px] items-center px-3 text-sm text-card-foreground hover:bg-muted"
          >
            See fewer like this
          </button>
        </div>
      )}
    </div>
  );
}
