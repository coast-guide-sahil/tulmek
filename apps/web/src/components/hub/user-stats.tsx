"use client";

import { useHub } from "@/lib/hub/provider";

/**
 * Shows the user's personal engagement stats.
 * Makes investment visible — sunk cost effect drives retention.
 * "I've read 47 articles and saved 12 — I can't switch now."
 */
export function UserStats() {
  const readCount = useHub((s) => s.readIds.size);
  const bookmarkCount = useHub((s) => Object.keys(s.bookmarks).length);
  const hydrated = useHub((s) => s.hydrated);

  if (!hydrated || (readCount === 0 && bookmarkCount === 0)) return null;

  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      {readCount > 0 && (
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {readCount} read
        </span>
      )}
      {bookmarkCount > 0 && (
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 2h14a1 1 0 011 1v19.143a.5.5 0 01-.766.424L12 18.03l-7.234 4.536A.5.5 0 014 22.143V3a1 1 0 011-1z" />
          </svg>
          {bookmarkCount} saved
        </span>
      )}
    </div>
  );
}
