"use client";

import { useMemo } from "react";
import type { FeedArticle } from "@tulmek/core/domain";
import { useHub } from "@/lib/hub/provider";
import { getCategoryConfig, formatRelativeTime } from "./hub-utils";

interface SimilarToSavedProps {
  readonly articles: FeedArticle[];
}

/**
 * Content-based recommendations similar to bookmarked articles.
 * Uses tag overlap + same category as similarity signals.
 * "Because you saved [article], you might like these..."
 */
export function SimilarToSaved({ articles }: SimilarToSavedProps) {
  const bookmarks = useHub((s) => s.bookmarks);
  const readIds = useHub((s) => s.readIds);
  const hydrated = useHub((s) => s.hydrated);

  const recommendations = useMemo(() => {
    const savedIds = Object.keys(bookmarks);
    if (savedIds.length === 0) return [];

    const savedArticles = articles.filter((a) => savedIds.includes(a.id));
    if (savedArticles.length === 0) return [];

    // Build tag profile from saved articles
    const tagWeights = new Map<string, number>();
    const categoryWeights = new Map<string, number>();

    for (const saved of savedArticles) {
      for (const tag of saved.tags) {
        tagWeights.set(tag, (tagWeights.get(tag) ?? 0) + 1);
      }
      categoryWeights.set(saved.category, (categoryWeights.get(saved.category) ?? 0) + 1);
    }

    // Score unsaved, unread articles by similarity
    return articles
      .filter((a) => !savedIds.includes(a.id) && !readIds.has(a.id))
      .map((a) => {
        let similarity = 0;
        for (const tag of a.tags) {
          similarity += tagWeights.get(tag) ?? 0;
        }
        similarity += (categoryWeights.get(a.category) ?? 0) * 2;
        return { article: a, similarity };
      })
      .filter((s) => s.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 4)
      .map((s) => s.article);
  }, [articles, bookmarks, readIds]);

  if (!hydrated || recommendations.length < 2) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">Similar to Saved</h2>
        <span className="text-xs text-muted-foreground">Based on your bookmarks</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {recommendations.map((a) => {
          const config = getCategoryConfig(a.category);
          return (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-lg border border-border bg-background p-3 transition-all hover:border-primary/30"
            >
              <p className="line-clamp-2 text-xs font-semibold leading-snug text-card-foreground group-hover:text-primary sm:text-sm">
                {a.title}
              </p>
              <div className="mt-auto flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                <span className={`rounded-full px-1.5 py-0.5 ${config.className}`}>{config.label}</span>
                <span>{formatRelativeTime(a.publishedAt)}</span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
