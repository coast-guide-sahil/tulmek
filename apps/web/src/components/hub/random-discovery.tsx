"use client";

import { useState, useCallback } from "react";
import type { FeedArticle } from "@tulmek/core/domain";
import { useHub } from "@/lib/hub/provider";
import { getCategoryConfig, formatRelativeTime } from "./hub-utils";

interface RandomDiscoveryProps {
  readonly articles: FeedArticle[];
}

/**
 * "Surprise Me" button — shows a random high-quality unread article.
 * Variable Reward (Hook Model): unpredictable discovery creates dopamine.
 * Users click repeatedly because they never know what they'll get.
 */
export function RandomDiscovery({ articles }: RandomDiscoveryProps) {
  const readIds = useHub((s) => s.readIds);
  const [revealed, setRevealed] = useState<FeedArticle | null>(null);

  const handleDiscover = useCallback(() => {
    // Filter to unread, high-quality articles
    const candidates = articles.filter(
      (a) => !readIds.has(a.id) && (a.score >= 50 || a.commentCount >= 10)
    );
    if (candidates.length === 0) return;
    const random = candidates[Math.floor(Math.random() * candidates.length)]!;
    setRevealed(random);
  }, [articles, readIds]);

  return (
    <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 text-center sm:p-5">
      {revealed ? (
        <div className="text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-primary">Discovery</span>
            <button
              onClick={handleDiscover}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Try again
            </button>
          </div>
          <a
            href={revealed.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block text-sm font-semibold text-card-foreground hover:text-primary"
          >
            {revealed.title}
          </a>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`rounded-full px-1.5 py-0.5 ${getCategoryConfig(revealed.category).className}`}>
              {getCategoryConfig(revealed.category).label}
            </span>
            <span>{revealed.sourceName}</span>
            <span>{formatRelativeTime(revealed.publishedAt)}</span>
            <span>{revealed.readingTime} min</span>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Not sure what to read next?
          </p>
          <button
            onClick={handleDiscover}
            className="mt-2 min-h-[44px] rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Surprise Me
          </button>
        </>
      )}
    </div>
  );
}
