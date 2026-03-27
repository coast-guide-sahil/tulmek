"use client";

import { useState, useEffect, useSyncExternalStore } from "react";

import { STORAGE_KEYS } from "@tulmek/config/constants";
const VISITED_KEY = STORAGE_KEYS.hubVisited;
const emptySubscribe = () => () => {};

/**
 * First-visit onboarding — 30-second aha moment.
 * Non-blocking progressive disclosure:
 * Step 1: Welcome banner with key stats
 * Step 2: Tooltip after first scroll (personalization hint)
 *
 * Based on UserGuiding 2026: 90% churn without clear first-visit value.
 * Chameleon 2026: 4 steps = 40.5% completion, 5+ = 21%. Less is more.
 */
export function FirstVisit({ articleCount, sourceCount }: { articleCount: number; sourceCount: number }) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    const visited = localStorage.getItem(VISITED_KEY);
    if (!visited) {
      requestAnimationFrame(() => setIsFirstVisit(true));
      localStorage.setItem(VISITED_KEY, "true");
    }
  }, [mounted]);

  if (!mounted || !isFirstVisit || dismissed) return null;

  return (
    <div className="section-enter rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground sm:text-lg">
            Welcome to TULMEK
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {articleCount} curated articles from {sourceCount} sources, ranked by our algorithm.
            No sign-up needed — bookmark, search, and explore freely.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2.5 py-1">Press <kbd className="font-mono font-bold">/</kbd> to search</span>
            <span className="rounded-full bg-muted px-2.5 py-1">Press <kbd className="font-mono font-bold">j</kbd>/<kbd className="font-mono font-bold">k</kbd> to navigate</span>
            <span className="rounded-full bg-muted px-2.5 py-1">Your feed gets smarter as you read</span>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 text-sm text-muted-foreground hover:text-foreground"
          aria-label="Dismiss welcome"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
