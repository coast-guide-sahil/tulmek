"use client";

import { useMemo } from "react";
import type { FeedArticle } from "@tulmek/core/domain";
import { getCategoryConfig } from "./hub-utils";

interface RelatedArticlesProps {
  readonly article: FeedArticle;
  readonly allArticles: FeedArticle[];
}

export function RelatedArticles({ article, allArticles }: RelatedArticlesProps) {
  const related = useMemo(() => {
    return allArticles
      .filter((a) => a.id !== article.id)
      .map((a) => {
        let score = 0;
        // Same category = strong signal
        if (a.category === article.category) score += 3;
        // Shared topics
        if (article.topics.length > 0 && a.topics.length > 0) {
          const shared = article.topics.filter((t) =>
            a.topics.some((at) => at.toLowerCase() === t.toLowerCase())
          );
          score += shared.length * 2;
        }
        // Same source = weak signal
        if (a.source === article.source) score += 1;
        // Company overlap (check title for pipe-separated company names)
        if (article.title.includes("|") && a.title.includes("|")) {
          const comp1 = article.title.split("|")[0]!.trim().toLowerCase();
          const comp2 = a.title.split("|")[0]!.trim().toLowerCase();
          if (comp1 === comp2) score += 4;
        }
        return { article: a, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((r) => r.article);
  }, [article, allArticles]);

  if (related.length === 0) return null;

  return (
    <div className="mt-3 border-t border-border/50 pt-3">
      <span className="text-xs font-medium text-muted-foreground">Related</span>
      <div className="mt-1.5 space-y-1.5">
        {related.map((r) => {
          const config = getCategoryConfig(r.category);
          return (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex items-center gap-2 rounded-lg p-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${config.className}`}
              >
                {config.label}
              </span>
              <span className="line-clamp-1">{r.title}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
