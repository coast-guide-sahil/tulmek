"use client";

import { useHub, useHubActions } from "@/lib/hub/provider";
import type { FeedArticle } from "@tulmek/core/domain";
import { STORAGE_KEYS } from "@tulmek/config/constants";

interface FeedActionsProps {
  readonly visibleArticles: FeedArticle[];
}

/**
 * Bulk actions for the feed — mark all visible as read, clear history.
 * Power user features that reduce friction and increase engagement.
 */
export function FeedActions({ visibleArticles }: FeedActionsProps) {
  const readCount = useHub((s) => s.readIds.size);
  const { markAsRead } = useHubActions();

  const handleMarkAllRead = () => {
    for (const article of visibleArticles) {
      markAsRead(article.id);
    }
  };

  const handleClearHistory = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.hubRead);
      window.location.reload();
    }
  };

  if (readCount === 0 && visibleArticles.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleMarkAllRead}
        className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Mark page as read
      </button>
      {readCount > 0 && (
        <button
          onClick={handleClearHistory}
          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Clear read history
        </button>
      )}
    </div>
  );
}
