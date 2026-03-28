"use client";

import { useSyncExternalStore } from "react";
import type { FeedArticle, HubCategory } from "@tulmek/core/domain";
import { useHub } from "@/lib/hub/provider";
import { getCategoryConfig } from "./hub-utils";

const emptySubscribe = () => () => {};

interface PrepCoverageProps {
  readonly articles: FeedArticle[];
}

export function PrepCoverage({ articles }: PrepCoverageProps) {
  const readIds = useHub((s) => s.readIds);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!mounted || readIds.size === 0) return null;

  // Calculate per-category coverage
  const categories = new Map<string, { total: number; read: number }>();
  for (const a of articles) {
    const cat = categories.get(a.category) ?? { total: 0, read: 0 };
    cat.total++;
    if (readIds.has(a.id)) cat.read++;
    categories.set(a.category, cat);
  }

  const totalRead = readIds.size;
  const totalArticles = articles.length;
  const overallPct = Math.round((totalRead / totalArticles) * 100);

  // Sort by coverage percentage (lowest first to encourage completion)
  const catList = [...categories.entries()]
    .map(([cat, { total, read }]) => ({
      category: cat as HubCategory,
      total,
      read,
      pct: Math.round((read / total) * 100),
    }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 6); // Show top 6

  return (
    <div className="section-enter rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-card-foreground">Prep Coverage</h2>
        <span className="text-xs text-muted-foreground">
          {totalRead} / {totalArticles} explored
        </span>
      </div>

      {/* Overall progress bar */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Overall</span>
          <span className="text-xs font-bold text-foreground">{overallPct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

      {/* Per-category mini progress bars */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {catList.map(({ category, pct }) => {
          const config = getCategoryConfig(category);
          return (
            <div key={category} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="truncate text-xs text-muted-foreground">
                  {config.label}
                </span>
                <span className="ml-1 shrink-0 text-xs font-medium text-foreground">
                  {pct}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    backgroundColor: `var(--accent-${category})`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
