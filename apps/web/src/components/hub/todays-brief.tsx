"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { FeedArticle, HubCategory } from "@tulmek/core/domain";
import { useHub, useHubActions } from "@/lib/hub/provider";
import { getCategoryConfig } from "./hub-utils";

const emptySubscribe = () => () => {};

interface TodaysBriefProps {
  readonly articles: FeedArticle[];
  readonly nowMs: number;
  readonly onCategoryClick: (category: HubCategory) => void;
}

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

interface CategoryDigest {
  category: HubCategory;
  total: number;
  unread: number;
  topArticle: FeedArticle;
}

/**
 * "Today's Brief" — a compact daily digest that gives users
 * a clear starting point when they open the hub.
 *
 * Shows per-category breakdown with unread counts and the top
 * article from each active category. Drives daily return visits
 * by making users feel they're missing content if they skip a day.
 */
export function TodaysBrief({ articles, nowMs, onCategoryClick }: TodaysBriefProps) {
  const readIds = useHub((s) => s.readIds);
  const { markAsRead } = useHubActions();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const digest = useMemo(() => {
    const recent = articles.filter(
      (a) => nowMs - new Date(a.publishedAt).getTime() < TWENTY_FOUR_HOURS
    );

    if (recent.length < 3) return null;

    // Group by category, compute unread, pick top article
    const grouped = new Map<HubCategory, FeedArticle[]>();
    for (const a of recent) {
      const list = grouped.get(a.category) ?? [];
      list.push(a);
      grouped.set(a.category, list);
    }

    const categories: CategoryDigest[] = [];
    for (const [category, items] of grouped) {
      // Sort by score descending to pick the top article
      const sorted = [...items].sort((a, b) => b.score - a.score);
      const unread = items.filter((a) => !readIds.has(a.id)).length;
      categories.push({
        category,
        total: items.length,
        unread,
        topArticle: sorted[0]!,
      });
    }

    // Sort categories by unread count (most unread first)
    categories.sort((a, b) => b.unread - a.unread);

    const totalNew = recent.length;
    const totalUnread = recent.filter((a) => !readIds.has(a.id)).length;

    return { categories, totalNew, totalUnread };
  }, [articles, nowMs, readIds]);

  if (!mounted || !digest || digest.categories.length < 2) return null;

  return (
    <div className="section-enter rounded-xl border border-border bg-card p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-card-foreground sm:text-base">
            Today&apos;s Brief
          </h2>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {digest.totalNew} new
          </span>
        </div>
        {digest.totalUnread > 0 && (
          <span className="text-xs text-muted-foreground">
            {digest.totalUnread} unread
          </span>
        )}
      </div>

      {/* Category digest grid */}
      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {digest.categories.slice(0, 4).map((item) => {
          const config = getCategoryConfig(item.category);
          return (
            <button
              key={item.category}
              onClick={() => onCategoryClick(item.category)}
              className="group flex flex-col gap-1.5 rounded-lg border border-border p-3 text-left transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
                  {config.label}
                </span>
                {item.unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                    {item.unread}
                  </span>
                )}
              </div>
              <p className="line-clamp-2 text-xs leading-snug text-muted-foreground group-hover:text-card-foreground">
                {item.topArticle.title}
              </p>
              <span className="mt-auto text-xs text-muted-foreground/60">
                {item.total} article{item.total !== 1 ? "s" : ""}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick action: mark today's articles as read */}
      {digest.totalUnread > 5 && (
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <button
            onClick={() => {
              const recent = articles.filter(
                (a) => nowMs - new Date(a.publishedAt).getTime() < TWENTY_FOUR_HOURS
              );
              for (const a of recent) {
                if (!readIds.has(a.id)) markAsRead(a.id);
              }
            }}
            className="min-h-[44px] inline-flex items-center text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Mark all today&apos;s as read
          </button>
          <span className="text-xs text-muted-foreground/40">
            ({digest.totalUnread} articles)
          </span>
        </div>
      )}
    </div>
  );
}
