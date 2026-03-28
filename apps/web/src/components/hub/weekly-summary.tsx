"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { FeedArticle } from "@tulmek/core/domain";
import { useHub } from "@/lib/hub/provider";
import { getCategoryConfig } from "./hub-utils";
import { STORAGE_KEYS } from "@tulmek/config/constants";

const emptySubscribe = () => () => {};

interface WeeklySummaryProps {
  readonly articles: FeedArticle[];
}

export function WeeklySummary({ articles }: WeeklySummaryProps) {
  const readIds = useHub((s) => s.readIds);
  const bookmarks = useHub((s) => Object.keys(s.bookmarks).length);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [dismissed, setDismissed] = useState(false);

  const stats = useMemo(() => {
    if (!mounted || readIds.size === 0) return null;

    // Category breakdown of read articles
    const catBreakdown = new Map<string, number>();
    for (const a of articles) {
      if (readIds.has(a.id)) {
        catBreakdown.set(a.category, (catBreakdown.get(a.category) ?? 0) + 1);
      }
    }

    const topCategories = [...catBreakdown.entries()]
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    // Get streak from localStorage
    let streakDays = 0;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.hubStreak);
      if (raw) streakDays = (JSON.parse(raw) as { currentStreak: number }).currentStreak;
    } catch { /* ignore */ }

    return { totalRead: readIds.size, bookmarks, topCategories, streakDays };
  }, [articles, readIds, bookmarks, mounted]);

  if (!mounted || !stats || stats.totalRead < 3 || dismissed) return null;

  return (
    <div className="section-enter rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-card-foreground">Your Prep Summary</h2>
        <button
          onClick={() => setDismissed(true)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >✕</button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-2xl font-extrabold text-foreground">{stats.totalRead}</div>
          <div className="text-xs text-muted-foreground">articles read</div>
        </div>
        <div>
          <div className="text-2xl font-extrabold text-foreground">{stats.bookmarks}</div>
          <div className="text-xs text-muted-foreground">bookmarked</div>
        </div>
        <div>
          <div className="text-2xl font-extrabold text-foreground">{stats.streakDays}d</div>
          <div className="text-xs text-muted-foreground">streak</div>
        </div>
      </div>

      {stats.topCategories.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">Top categories:</span>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {stats.topCategories.map(([cat, count]) => {
              const config = getCategoryConfig(cat);
              return (
                <span key={cat} className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
                  {config.label} ({count})
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
