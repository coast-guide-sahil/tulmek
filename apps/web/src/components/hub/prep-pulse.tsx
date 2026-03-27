import type { FeedArticle } from "@tulmek/core/domain";
import { formatRelativeTime } from "./hub-utils";

interface PrepPulseProps {
  readonly articles: FeedArticle[];
}

/**
 * Shows latest activity across the hub — newest articles from each source.
 * Creates a sense of "the hub is alive and updating".
 */
export function PrepPulse({ articles }: PrepPulseProps) {
  // Get the most recent article from each source
  const latestBySource = new Map<string, FeedArticle>();
  const sorted = [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  for (const article of sorted) {
    if (!latestBySource.has(article.source)) {
      latestBySource.set(article.source, article);
    }
    if (latestBySource.size >= 4) break;
  }

  const latest = [...latestBySource.values()];
  if (latest.length === 0) return null;

  return (
    <div className="flex items-center gap-3 overflow-x-auto text-xs text-muted-foreground">
      <span className="flex shrink-0 items-center gap-1.5 font-medium">
        <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
        Latest:
      </span>
      {latest.map((a) => (
        <a
          key={a.id}
          href={a.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 truncate hover:text-foreground"
          title={a.title}
        >
          <span className="font-medium">{a.sourceName}</span>
          {" — "}
          <span className="max-w-[200px] truncate">{a.title.slice(0, 50)}{a.title.length > 50 ? "..." : ""}</span>
          {" "}
          <span className="text-muted-foreground/60">{formatRelativeTime(a.publishedAt)}</span>
        </a>
      ))}
    </div>
  );
}
