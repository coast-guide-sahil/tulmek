"use client";

import type { FeedArticle } from "@tulmek/core/domain";
import { getCategoryConfig, formatRelativeTime } from "./hub-utils";

interface FeaturedPicksProps {
  readonly articles: FeedArticle[];
  readonly nowMs?: number;
}

/**
 * Curated "Top Picks" section showing the highest-quality articles.
 * Uses a combination of engagement score and discussion activity
 * to surface the most valuable content.
 */
export function FeaturedPicks({ articles, nowMs }: FeaturedPicksProps) {
  const now = nowMs ?? 0;
  // Score = engagement + discussion bonus + recency bonus
  const scored = articles.map((a) => {
    const ageHours = now > 0 ? (now - new Date(a.publishedAt).getTime()) / 3600000 : 48;
    const recencyBonus = ageHours < 24 ? 200 : ageHours < 72 ? 100 : 0;
    const discussionBonus = a.commentCount > 50 ? 150 : a.commentCount > 20 ? 50 : 0;
    return { article: a, quality: a.score + recencyBonus + discussionBonus };
  });

  const picks = scored
    .sort((a, b) => b.quality - a.quality)
    .slice(0, 3)
    .map((s) => s.article);

  if (picks.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">Top Picks</h2>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          Curated
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {picks.map((article, index) => (
          <FeaturedCard key={article.id} article={article} rank={index + 1} />
        ))}
      </div>
    </div>
  );
}

function FeaturedCard({ article, rank }: { article: FeedArticle; rank: number }) {
  const config = getCategoryConfig(article.category);
  const time = formatRelativeTime(article.publishedAt);

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col rounded-xl border border-primary/20 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
    >
      {/* Rank badge */}
      <span className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {rank}
      </span>

      {/* Source + time */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium">{article.sourceName}</span>
        <span>{time}</span>
      </div>

      {/* Title */}
      <h3 className="mt-1.5 text-sm font-semibold leading-snug text-card-foreground group-hover:text-primary">
        {article.title}
      </h3>

      {/* Footer */}
      <div className="mt-auto flex items-center gap-2 pt-3">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
          {config.label}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {article.score > 0 && `${article.score >= 1000 ? `${(article.score / 1000).toFixed(1)}k` : article.score} pts`}
        </span>
      </div>
    </a>
  );
}
