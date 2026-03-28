"use client";

import { useMemo, useState } from "react";
import type { FeedArticle } from "@tulmek/core/domain";
import { getTrendingTopics } from "@tulmek/core/domain";

interface TrendingTopicsProps {
  readonly articles: FeedArticle[];
  readonly onTopicClick?: (query: string) => void;
}

/**
 * Trending Topics — shows the hottest topics across sources in the last 48h.
 * A topic qualifies when at least 2 distinct sources cover it.
 * Chips are clickable when onTopicClick is provided (e.g. inside the feed).
 *
 * nowMs is captured via a lazy state initializer so Date.now() never runs
 * directly in the render body, satisfying the React compiler's purity rules.
 */
export function TrendingTopics({ articles, onTopicClick }: TrendingTopicsProps) {
  const [nowMs] = useState(() => Date.now());

  const trending = useMemo(
    () => getTrendingTopics(articles, nowMs, 8),
    [articles, nowMs],
  );

  if (trending.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-bold text-card-foreground">Trending Topics</span>
        <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
          Live
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {trending.map(({ topic, sourceCount, articleCount }) =>
          onTopicClick ? (
            <button
              key={topic}
              onClick={() => onTopicClick(topic)}
              className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              <span className="font-medium text-card-foreground capitalize">{topic}</span>
              <span className="text-xs text-muted-foreground">
                {sourceCount}s · {articleCount}
              </span>
            </button>
          ) : (
            <div
              key={topic}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm"
            >
              <span className="font-medium text-card-foreground capitalize">{topic}</span>
              <span className="text-xs text-muted-foreground">
                {sourceCount}s · {articleCount}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
