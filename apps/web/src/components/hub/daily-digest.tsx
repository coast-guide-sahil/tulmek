import type { FeedArticle } from "@tulmek/core/domain";
import { getCategoryConfig, formatRelativeTime } from "./hub-utils";

interface DailyDigestProps {
  readonly articles: FeedArticle[];
  readonly refreshedAt: string;
}

/**
 * Daily digest — THE hero section. Newspaper front page experience.
 * Shows the single best article per category with visual hierarchy.
 * This is what users check first every day.
 */
export function DailyDigest({ articles, refreshedAt }: DailyDigestProps) {
  const bestPerCategory = new Map<string, FeedArticle>();
  const sorted = [...articles].sort((a, b) => b.score - a.score);

  for (const article of sorted) {
    if (!bestPerCategory.has(article.category) && article.category !== "general") {
      bestPerCategory.set(article.category, article);
    }
    if (bestPerCategory.size >= 5) break;
  }

  const digest = [...bestPerCategory.values()];
  if (digest.length < 3) return null;

  const dateStr = new Date(refreshedAt).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Feature the top article prominently
  const featured = digest[0]!;
  const rest = digest.slice(1);
  const featuredConfig = getCategoryConfig(featured.category);

  return (
    <div className="section-enter space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-foreground">Today&apos;s Picks</h2>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {dateStr}
          </span>
        </div>
      </div>

      {/* Hero article — the #1 pick */}
      <a
        href={featured.url}
        target="_blank"
        rel="noopener noreferrer"
        className="gradient-shine group block rounded-xl border border-primary/20 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-lg sm:p-6"
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            1
          </span>
          <span className={`rounded-full px-2 py-0.5 font-medium ${featuredConfig.className}`}>
            {featuredConfig.label}
          </span>
          <span>{featured.sourceName}</span>
          <span>{formatRelativeTime(featured.publishedAt)}</span>
        </div>
        <h3 className="mt-2 text-lg font-bold leading-snug text-card-foreground group-hover:text-primary sm:text-xl">
          {featured.title}
        </h3>
        {featured.excerpt && featured.excerpt !== featured.title && (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
            {featured.excerpt}
          </p>
        )}
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          {featured.score > 0 && <span>{featured.score >= 1000 ? `${(featured.score / 1000).toFixed(1)}k` : featured.score} pts</span>}
          {featured.commentCount > 0 && <span>{featured.commentCount} comments</span>}
          <span>{featured.readingTime} min read</span>
        </div>
      </a>

      {/* Rest of digest — compact grid */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {rest.map((article, i) => {
          const config = getCategoryConfig(article.category);
          return (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-xs font-bold">
                  {i + 2}
                </span>
                <span className={`rounded-full px-1.5 py-0.5 font-medium ${config.className}`}>
                  {config.label}
                </span>
              </div>
              <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-card-foreground group-hover:text-primary">
                {article.title}
              </h3>
              <p className="mt-auto pt-2 text-xs text-muted-foreground">
                {article.sourceName} · {article.readingTime} min
              </p>
            </a>
          );
        })}
      </div>
    </div>
  );
}
