import type { FeedArticle } from "@tulmek/core/domain";
import { formatRelativeTime } from "./hub-utils";

interface CompensationHighlightsProps {
  readonly articles: FeedArticle[];
}

/**
 * Surfaces compensation-related discussions with highest engagement.
 * Dynamically discovers trending companies and salary discussions
 * without any hardcoded company list.
 */
export function CompensationHighlights({ articles }: CompensationHighlightsProps) {
  const compArticles = articles
    .filter((a) => a.category === "compensation")
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const expArticles = articles
    .filter((a) => a.category === "interview-experience")
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  if (compArticles.length === 0 && expArticles.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Compensation */}
      {compArticles.length > 0 && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Compensation Insights</h2>
            <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-400">
              {compArticles.length} discussions
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Latest salary threads, offer negotiations, and TC discussions from the community
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {compArticles.map((a) => (
              <CompactCard key={a.id} article={a} accentClass="border-l-yellow-500" />
            ))}
          </div>
        </div>
      )}

      {/* Interview Experiences */}
      {expArticles.length > 0 && (
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Interview Experiences</h2>
            <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-700 dark:text-cyan-400">
              {expArticles.length} stories
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Real candidate stories — what to expect, how it went, lessons learned
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {expArticles.map((a) => (
              <CompactCard key={a.id} article={a} accentClass="border-l-cyan-500" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CompactCard({ article, accentClass }: { article: FeedArticle; accentClass: string }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex flex-col rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm border-l-[3px] ${accentClass}`}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="font-medium">{article.sourceName}</span>
        <span>{formatRelativeTime(article.publishedAt)}</span>
      </div>
      <h3 className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-card-foreground group-hover:text-primary sm:text-sm">
        {article.title}
      </h3>
      <div className="mt-auto flex items-center gap-2 pt-2 text-xs text-muted-foreground">
        {article.score > 0 && (
          <span>{article.score >= 1000 ? `${(article.score / 1000).toFixed(1)}k` : article.score} pts</span>
        )}
        {article.commentCount > 0 && (
          <span>{article.commentCount} comments</span>
        )}
      </div>
    </a>
  );
}
