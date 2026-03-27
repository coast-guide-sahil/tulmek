"use client";

import { useState, useEffect } from "react";
import type { FeedArticle } from "@tulmek/core/domain";

const LAST_VISIT_KEY = "tulmek:hub:lastVisit";

interface WhatsNewBannerProps {
  readonly articles: FeedArticle[];
}

/**
 * Shows how many new articles appeared since the user's last visit.
 * Creates urgency and FOMO — "12 new articles since yesterday!"
 * Dismissible, updates last visit timestamp on dismiss.
 */
export function WhatsNewBanner({ articles }: WhatsNewBannerProps) {
  const [newCount, setNewCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    if (lastVisit) {
      const lastTime = new Date(lastVisit).getTime();
      const count = articles.filter(
        (a) => new Date(a.aggregatedAt).getTime() > lastTime
      ).length;
      // Use startTransition to avoid cascading render warning
      requestAnimationFrame(() => setNewCount(count));
    }
    // Update last visit
    localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
  }, [articles]);

  if (newCount === 0 || dismissed) return null;

  return (
    <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/5 px-4 py-2.5">
      <p className="text-sm text-foreground">
        <span className="font-semibold text-success">{newCount} new</span>
        {" "}article{newCount !== 1 ? "s" : ""} since your last visit
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="min-h-[36px] rounded-md px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        Dismiss
      </button>
    </div>
  );
}
