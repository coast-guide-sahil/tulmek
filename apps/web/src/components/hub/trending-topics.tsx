import type { FeedArticle } from "@tulmek/core/domain";

interface TrendingTopicsProps {
  readonly articles: FeedArticle[];
  readonly onTopicClick: (query: string) => void;
}

/**
 * Extracts trending topics from article tags and titles.
 * Shows the most frequently appearing interview-relevant keywords.
 */
export function TrendingTopics({ articles, onTopicClick }: TrendingTopicsProps) {
  // Count tag frequency across all articles, weighted by engagement
  const tagScores = new Map<string, number>();
  const SKIP_TAGS = new Set([
    "story", "author", "show_hn", "ask_hn", "video",
    "cscareerquestions", "leetcode", "programming",
    "experienceddevs", "machinelearning", "artificial",
    "datascience", "systemdesign",
  ]);

  for (const article of articles) {
    const weight = 1 + Math.log10(Math.max(1, article.score));
    for (const tag of article.tags) {
      const normalized = tag.toLowerCase().replace(/[_-]/g, " ");
      if (SKIP_TAGS.has(normalized) || normalized.length < 3) continue;
      tagScores.set(normalized, (tagScores.get(normalized) ?? 0) + weight);
    }
  }

  const topTopics = [...tagScores.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([tag, score]) => ({ tag, score }));

  if (topTopics.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">Hot topics:</span>
      {topTopics.map(({ tag }) => (
        <button
          key={tag}
          onClick={() => onTopicClick(tag)}
          className="min-h-[32px] rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-card-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
