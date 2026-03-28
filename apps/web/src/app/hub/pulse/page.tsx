import type { Metadata } from "next";
import type { FeedArticle } from "@tulmek/core/domain";
import { tulmekRank, getCategoryMeta, getSourceLabel, formatRelativeTime } from "@tulmek/core/domain";
import { APP_NAME } from "@tulmek/config/constants";
import feedData from "@tulmek/content/hub/feed";
import Link from "next/link";

const articles = feedData as unknown as FeedArticle[];

export const metadata: Metadata = {
  title: "Interview Market Pulse",
  description: `This week's interview prep highlights — top articles, trending companies, and market signals. Updated every 3 hours by ${APP_NAME}.`,
};

export default function PulsePage() {
  const nowMs = new Date(articles[0]?.aggregatedAt ?? new Date().toISOString()).getTime();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  // This week's articles
  const thisWeek = articles.filter(
    (a) => nowMs - new Date(a.publishedAt).getTime() < weekMs
  );

  // Top 5 by TCRA
  const top5 = tulmekRank(thisWeek, nowMs, new Set(), {}).slice(0, 5);

  // Most discussed (by comments)
  const mostDiscussed = [...thisWeek]
    .sort((a, b) => b.commentCount - a.commentCount)
    .slice(0, 3);

  // Category breakdown
  const catCounts: Record<string, number> = {};
  for (const a of thisWeek) {
    catCounts[a.category] = (catCounts[a.category] ?? 0) + 1;
  }
  const topCategories = Object.entries(catCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([cat, count]) => ({ ...getCategoryMeta(cat), count }));

  // Source breakdown
  const srcCounts: Record<string, number> = {};
  for (const a of thisWeek) {
    srcCounts[a.source] = (srcCounts[a.source] ?? 0) + 1;
  }
  const topSources = Object.entries(srcCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([src, count]) => ({ label: getSourceLabel(src), count }));

  // Trending topics (most common tags)
  const tagCounts: Record<string, number> = {};
  for (const a of thisWeek) {
    for (const tag of a.tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }
  const trendingTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }));

  // Company mentions with proper display names
  const DISPLAY_NAMES: Record<string, string> = {
    google: "Google", amazon: "Amazon", meta: "Meta", apple: "Apple",
    microsoft: "Microsoft", netflix: "Netflix", uber: "Uber", stripe: "Stripe",
    openai: "OpenAI", anthropic: "Anthropic", nvidia: "NVIDIA",
  };
  const companyRegex = /\b(google|amazon|meta|apple|microsoft|netflix|uber|stripe|openai|anthropic|nvidia)\b/gi;
  const companyCounts: Record<string, number> = {};
  for (const a of thisWeek) {
    const matches = `${a.title} ${a.excerpt}`.match(companyRegex);
    if (matches) {
      for (const m of matches) {
        const name = DISPLAY_NAMES[m.toLowerCase()] ?? m;
        companyCounts[name] = (companyCounts[name] ?? 0) + 1;
      }
    }
  }
  const topCompanies = Object.entries(companyCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <nav className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link href="/hub" className="hover:text-foreground">Hub</Link>
          <span>&rsaquo;</span>
          <span className="text-foreground">Market Pulse</span>
          <span className="ml-auto">
            <Link href="/hub/report" className="text-xs font-medium text-primary hover:underline">View Full Report &rarr;</Link>
          </span>
        </nav>
        <h1 className="mt-3 text-2xl font-extrabold text-foreground sm:text-3xl">
          Interview Market Pulse
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This week: {thisWeek.length} articles from {topSources.length} sources
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Articles" value={thisWeek.length} />
        <StatCard label="Sources" value={topSources.length} />
        <StatCard label="Companies" value={Object.keys(companyCounts).length} />
        <StatCard label="Discussions" value={thisWeek.reduce((sum, a) => sum + a.commentCount, 0)} />
      </div>

      {/* Top companies */}
      {topCompanies.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-foreground">Trending Companies</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {topCompanies.map(([name, count]) => (
              <Link
                key={name}
                href={`/hub/company/${name.toLowerCase()}`}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:border-primary/30"
              >
                <span className="font-semibold text-card-foreground">{name}</span>
                <span className="ml-1.5 text-muted-foreground">{count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Category breakdown */}
      <section>
        <h2 className="text-base font-bold text-foreground">Category Breakdown</h2>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {topCategories.map((cat) => (
            <div key={cat.label} className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">{cat.label}</p>
              <p className="mt-1 text-lg font-bold text-card-foreground">{cat.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top 5 articles */}
      <section>
        <h2 className="text-base font-bold text-foreground">Top Articles This Week</h2>
        <div className="mt-3 space-y-3">
          {top5.map((article, i) => (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="hub-card group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">{getSourceLabel(article.source)}</span>
                  <span>{formatRelativeTime(article.publishedAt)}</span>
                  {article.score >= 500 && (
                    <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 font-medium text-destructive">TRENDING</span>
                  )}
                </div>
                <h3 className="mt-1 text-sm font-semibold text-card-foreground group-hover:text-primary sm:text-base">
                  {article.title}
                </h3>
                <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                  {article.score > 0 && <span>&#x25B2; {article.score >= 1000 ? `${(article.score / 1000).toFixed(1)}k` : article.score}</span>}
                  {article.commentCount > 0 && <span>&#x1F4AC; {article.commentCount}</span>}
                  <span>{article.readingTime} min</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Most discussed */}
      {mostDiscussed.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-foreground">Most Discussed</h2>
          <div className="mt-3 space-y-2">
            {mostDiscussed.map((article) => (
              <a
                key={article.id}
                href={article.discussionUrl ?? article.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30"
              >
                <span className="line-clamp-1 text-sm font-medium text-card-foreground">{article.title}</span>
                <span className="ml-2 shrink-0 text-sm font-bold text-primary">{article.commentCount} comments</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Trending topics */}
      {trendingTags.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-foreground">Trending Topics</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {trendingTags.map(({ tag, count }) => (
              <span key={tag} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                {tag} <span className="font-bold">{count}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Source distribution */}
      <section>
        <h2 className="text-base font-bold text-foreground">Source Distribution</h2>
        <div className="mt-2 space-y-1.5">
          {topSources.map(({ label, count }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-24 text-xs text-muted-foreground">{label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/60"
                  style={{ width: `${(count / thisWeek.length) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs font-medium text-muted-foreground">{count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <div className="rounded-xl border border-border bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Content refreshed every 3 hours from {topSources.length} sources.
        </p>
        <Link href="/hub" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
          Browse all {articles.length} articles &rarr;
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-center">
      <p className="text-2xl font-bold text-card-foreground">{value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
