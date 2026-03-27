"use client";

import { useMemo } from "react";
import type { FeedArticle } from "@tulmek/core/domain";
import { useHub } from "@/lib/hub/provider";
import { getCategoryConfig, formatRelativeTime } from "./hub-utils";

interface ForYouProps {
  readonly articles: FeedArticle[];
}

/**
 * Personalized recommendations based on reading history.
 * Zero backend — uses localStorage read tracking to build
 * a preference profile and surface relevant unread content.
 *
 * Algorithm: weighted category preference from read history,
 * then score unread articles by preference match × quality.
 */
export function ForYou({ articles }: ForYouProps) {
  const readIds = useHub((s) => s.readIds);
  const hydrated = useHub((s) => s.hydrated);

  const recommendations = useMemo(() => {
    if (readIds.size < 3) return []; // Need at least 3 reads for personalization

    // Build category preference profile from read history
    const categoryPrefs = new Map<string, number>();
    for (const article of articles) {
      if (readIds.has(article.id)) {
        categoryPrefs.set(
          article.category,
          (categoryPrefs.get(article.category) ?? 0) + 1
        );
      }
    }

    if (categoryPrefs.size === 0) return [];

    const totalReads = [...categoryPrefs.values()].reduce((a, b) => a + b, 0);

    // Score unread articles by preference match × quality
    const scored = articles
      .filter((a) => !readIds.has(a.id))
      .map((a) => {
        const prefWeight = (categoryPrefs.get(a.category) ?? 0) / totalReads;
        const qualityScore = Math.log(1 + a.score) + a.commentCount * 0.1;
        return { article: a, score: prefWeight * qualityScore };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    return scored.map((s) => s.article);
  }, [articles, readIds]);

  if (!hydrated || recommendations.length === 0) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">For You</h2>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          Personalized
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Based on your reading history — {readIds.size} articles read
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {recommendations.map((a) => {
          const config = getCategoryConfig(a.category);
          return (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="group flex flex-col rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-medium">{a.sourceName}</span>
                <span>{formatRelativeTime(a.publishedAt)}</span>
              </div>
              <h3 className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-card-foreground group-hover:text-primary sm:text-sm">
                {a.title}
              </h3>
              <div className="mt-auto pt-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
                  {config.label}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
