import type { FeedArticle } from "@tulmek/core/domain";
import { getSourceLabel } from "./hub-utils";

interface SourceDiversityProps {
  readonly articles: FeedArticle[];
}

const SOURCE_COLORS: Record<string, string> = {
  reddit: "bg-orange-500",
  hackernews: "bg-amber-500",
  devto: "bg-indigo-500",
  youtube: "bg-red-500",
  medium: "bg-green-500",
  github: "bg-gray-500",
};

/**
 * Visual breakdown of content sources — shows feed diversity.
 */
export function SourceDiversity({ articles }: SourceDiversityProps) {
  const sourceCounts = new Map<string, number>();
  for (const a of articles) {
    sourceCounts.set(a.source, (sourceCounts.get(a.source) ?? 0) + 1);
  }

  const total = articles.length;
  const sources = [...sourceCounts.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([source, count]) => ({
      source,
      label: getSourceLabel(source),
      count,
      pct: Math.round((count / total) * 100),
      color: SOURCE_COLORS[source] ?? "bg-gray-400",
    }));

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="font-medium">Sources:</span>
      <div className="flex h-2 flex-1 overflow-hidden rounded-full">
        {sources.map((s) => (
          <div
            key={s.source}
            className={`${s.color} transition-all`}
            style={{ width: `${s.pct}%` }}
            title={`${s.label}: ${s.count} (${s.pct}%)`}
          />
        ))}
      </div>
      <div className="hidden items-center gap-3 sm:flex">
        {sources.map((s) => (
          <span key={s.source} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${s.color}`} />
            {s.label} {s.pct}%
          </span>
        ))}
      </div>
    </div>
  );
}
