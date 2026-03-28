"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import type { FeedArticle } from "@tulmek/core/domain";
import { STORAGE_KEYS } from "@tulmek/config/constants";

const LAST_VISIT_KEY = STORAGE_KEYS.hubLastVisit;
const emptySubscribe = () => () => {};

interface NewSinceVisitProps {
  readonly articles: FeedArticle[];
}

/**
 * Variable reward loop — shows how many articles appeared since last visit.
 * FOMO-driven: "12 new articles since your last visit" creates daily return habit.
 *
 * SSR-safe via useSyncExternalStore. Side effects isolated to useEffect.
 * Only renders when there are genuinely new articles (not on first visit).
 */
export function NewSinceVisit({ articles }: NewSinceVisitProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    if (!mounted) return;

    const stored = localStorage.getItem(LAST_VISIT_KEY);
    const lastVisitMs = stored ? new Date(stored).getTime() : null;

    if (lastVisitMs !== null) {
      const count = articles.filter(
        (a) => new Date(a.aggregatedAt).getTime() > lastVisitMs
      ).length;
      // Deferred to avoid cascading-render lint (react-hooks/set-state-in-effect)
      requestAnimationFrame(() => setNewCount(count));
    }

    // Update last visit to now (covers first-visit and subsequent visits)
    localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
  }, [articles, mounted]);

  if (!mounted || newCount === 0) return null;

  return (
    <div className="section-enter flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
      <span
        className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground"
        aria-label={`${newCount > 99 ? "99 or more" : newCount} new articles`}
      >
        {newCount > 99 ? "99+" : newCount}
      </span>
      <span className="text-sm text-foreground">
        new article{newCount !== 1 ? "s" : ""} since your last visit
      </span>
    </div>
  );
}
