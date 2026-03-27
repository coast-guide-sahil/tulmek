import type { FeedArticle } from "@tulmek/core/domain";
import { getCategoryConfig, formatRelativeTime } from "./hub-utils";

interface WeeklyHighlightsProps {
  readonly articles: FeedArticle[];
  readonly nowMs: number;
}

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Top articles from the past 7 days — the weekly pulse.
 * Engagement-weighted, time-bounded — shows what mattered THIS week.
 */
export function WeeklyHighlights({ articles, nowMs }: WeeklyHighlightsProps) {
  const thisWeek = articles
    .filter((a) => nowMs - new Date(a.publishedAt).getTime() < ONE_WEEK_MS)
    .sort((a, b) => (b.score + b.commentCount * 3) - (a.score + a.commentCount * 3))
    .slice(0, 5);

  if (thisWeek.length < 3) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-foreground">Popular This Week</h2>
      <div className="mt-3 space-y-2">
        {thisWeek.map((article, i) => {
          const config = getCategoryConfig(article.category);
          return (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 rounded-lg p-1.5 transition-colors hover:bg-muted"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug text-card-foreground group-hover:text-primary">
                  {article.title}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`rounded-full px-1.5 py-0.5 ${config.className}`}>{config.label}</span>
                  <span>{article.sourceName}</span>
                  <span>{formatRelativeTime(article.publishedAt)}</span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
