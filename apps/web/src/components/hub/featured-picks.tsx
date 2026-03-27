"use client";

import type { FeedArticle } from "@tulmek/core/domain";
import { getCategoryConfig, formatRelativeTime } from "./hub-utils";

interface FeaturedPicksProps {
  readonly articles: FeedArticle[];
  readonly nowMs?: number;
}

export function FeaturedPicks({ articles, nowMs }: FeaturedPicksProps) {
  const now = nowMs ?? 0;
  const scored = articles.map((a) => {
    const ageHours = now > 0 ? (now - new Date(a.publishedAt).getTime()) / 3600000 : 48;
    const recencyBonus = ageHours < 24 ? 200 : ageHours < 72 ? 100 : 0;
    const discussionBonus = a.commentCount > 50 ? 150 : a.commentCount > 20 ? 50 : 0;
    // Category bonus: interview experiences and compensation are highest value content
    const categoryBonus = a.category === "interview-experience" ? 100
      : a.category === "compensation" ? 80
      : a.category === "dsa" || a.category === "system-design" ? 50
      : 0;
    return { article: a, quality: a.score + recencyBonus + discussionBonus + categoryBonus };
  });

  const picks = scored
    .sort((a, b) => b.quality - a.quality)
    .slice(0, 3)
    .map((s) => s.article);

  if (picks.length < 2) return null;

  const hero = picks[0]!;
  const heroConfig = getCategoryConfig(hero.category);
  const side = picks.slice(1);

  return (
    <div className="section-enter grid gap-3 sm:grid-cols-3">
      {/* Hero pick — 2 columns */}
      <a
        href={hero.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="gradient-shine group relative flex flex-col justify-end rounded-xl border border-primary/20 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-lg sm:col-span-2 sm:p-6"
      >
        <span className="absolute -left-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
          1
        </span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={`rounded-full px-2 py-0.5 font-medium ${heroConfig.className}`}>
            {heroConfig.label}
          </span>
          <span>{hero.sourceName}</span>
          <span>{formatRelativeTime(hero.publishedAt)}</span>
        </div>
        <h3 className="mt-2 text-base font-bold leading-snug text-card-foreground group-hover:text-primary sm:text-lg">
          {hero.title}
        </h3>
        {hero.excerpt && hero.excerpt !== hero.title && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {hero.excerpt}
          </p>
        )}
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          {hero.score > 0 && <span>{hero.score >= 1000 ? `${(hero.score / 1000).toFixed(1)}k` : hero.score} pts</span>}
          {hero.commentCount > 0 && <span>{hero.commentCount} comments</span>}
          <span>{hero.readingTime} min</span>
        </div>
      </a>

      {/* Side picks — stacked */}
      <div className="flex flex-col gap-3">
        {side.map((article, i) => {
          const config = getCategoryConfig(article.category);
          return (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="group relative flex flex-1 flex-col rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <span className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                {i + 2}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`rounded-full px-1.5 py-0.5 font-medium ${config.className}`}>
                  {config.label}
                </span>
                <span>{article.sourceName}</span>
              </div>
              <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-card-foreground group-hover:text-primary">
                {article.title}
              </h3>
              <p className="mt-auto pt-2 text-xs text-muted-foreground">
                {formatRelativeTime(article.publishedAt)} · {article.readingTime} min
              </p>
            </a>
          );
        })}
      </div>
    </div>
  );
}
