import type { FeedArticle } from "@tulmek/core/domain";
import { formatRelativeTime, getCategoryConfig } from "./hub-utils";

interface ActiveDiscussionsProps {
  readonly articles: FeedArticle[];
  readonly nowMs: number;
}

/**
 * Shows articles with the highest discussion velocity right now.
 * Not just "most comments ever" but "most comments per hour of life."
 * Creates urgency: "people are talking about this RIGHT NOW."
 */
export function ActiveDiscussions({ articles, nowMs }: ActiveDiscussionsProps) {
  const active = articles
    .filter((a) => a.commentCount >= 5)
    .map((a) => {
      const ageHours = Math.max(1, (nowMs - new Date(a.publishedAt).getTime()) / 3600000);
      return { article: a, velocity: a.commentCount / ageHours };
    })
    .sort((a, b) => b.velocity - a.velocity)
    .slice(0, 4);

  if (active.length < 2) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">Active Discussions</h2>
        <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
          Live
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {active.map(({ article, velocity }) => {
          const config = getCategoryConfig(article.category);
          return (
            <a
              key={article.id}
              href={article.discussionUrl ?? article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
            >
              <div className="flex shrink-0 flex-col items-center rounded-lg bg-muted px-2 py-1">
                <span className="text-sm font-bold text-card-foreground">{article.commentCount}</span>
                <span className="text-xs text-muted-foreground">replies</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug text-card-foreground group-hover:text-primary">
                  {article.title}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`rounded-full px-1.5 py-0.5 ${config.className}`}>{config.label}</span>
                  <span>{article.sourceName}</span>
                  <span>{formatRelativeTime(article.publishedAt)}</span>
                  <span className="text-destructive">{Math.round(velocity)}/hr</span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
