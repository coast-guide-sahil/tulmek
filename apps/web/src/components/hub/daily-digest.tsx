import type { FeedArticle } from "@tulmek/core/domain";
import { getCategoryConfig, formatRelativeTime } from "./hub-utils";

interface DailyDigestProps {
  readonly articles: FeedArticle[];
  readonly refreshedAt: string;
}

/**
 * Daily digest — curated best article per category, updated daily.
 * Creates the "newspaper front page" experience that drives daily visits.
 */
export function DailyDigest({ articles, refreshedAt }: DailyDigestProps) {
  // Get best article per category (by engagement)
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

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Daily Digest</h2>
          <p className="text-xs text-muted-foreground">{dateStr} — top pick from each domain</p>
        </div>
      </div>
      <div className="mt-3 divide-y divide-border">
        {digest.map((article) => {
          const config = getCategoryConfig(article.category);
          return (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
                {config.label}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug text-card-foreground group-hover:text-primary">
                  {article.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {article.sourceName} · {formatRelativeTime(article.publishedAt)} · {article.readingTime} min
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
