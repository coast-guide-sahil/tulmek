import type { Metadata } from "next";
import type { FeedArticle } from "@tulmek/core/domain";
import { getCategoryMeta, getSourceLabel } from "@tulmek/core/domain";
import { APP_NAME } from "@tulmek/config/constants";
import feedData from "@tulmek/content/hub/feed";
import metadataJson from "@tulmek/content/hub/metadata";
import type { FeedMetadata } from "@tulmek/core/domain";
import Link from "next/link";

const articles = feedData as unknown as FeedArticle[];
const feedMeta = metadataJson as unknown as FeedMetadata;

export const metadata: Metadata = {
  title: "Interview Market Report",
  description: `Data-driven interview prep market report: ${feedMeta.totalArticles} articles analyzed from ${Object.keys(feedMeta.sourceBreakdown).length} sources. Trends, companies, and insights.`,
};

export default function ReportPage() {
  const nowMs = new Date(articles[0]?.aggregatedAt ?? new Date().toISOString()).getTime();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const dayMs = 24 * 60 * 60 * 1000;

  const thisWeek = articles.filter((a) => nowMs - new Date(a.publishedAt).getTime() < weekMs);
  const today = articles.filter((a) => nowMs - new Date(a.publishedAt).getTime() < dayMs);

  // Category distribution
  const catDist = Object.entries(feedMeta.categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, count]) => ({ ...getCategoryMeta(cat), count, pct: Math.round((count / feedMeta.totalArticles) * 100) }));

  // Source distribution
  const srcDist = Object.entries(feedMeta.sourceBreakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([src, count]) => ({ label: getSourceLabel(src), count, pct: Math.round((count / feedMeta.totalArticles) * 100) }));

  // Top companies
  const companyRegex = /\b(google|amazon|meta|apple|microsoft|netflix|uber|stripe|openai|anthropic|nvidia|flipkart|atlassian)\b/gi;
  const companyCounts: Record<string, number> = {};
  for (const a of thisWeek) {
    const matches = `${a.title} ${a.excerpt}`.match(companyRegex);
    if (matches) for (const m of matches) {
      const name = m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
      companyCounts[name] = (companyCounts[name] ?? 0) + 1;
    }
  }
  const topCompanies = Object.entries(companyCounts).sort(([, a], [, b]) => b - a).slice(0, 10);

  // Engagement stats
  const totalUpvotes = articles.reduce((s, a) => s + a.score, 0);
  const totalComments = articles.reduce((s, a) => s + a.commentCount, 0);
  const avgScore = Math.round(totalUpvotes / articles.length);

  // Content freshness
  const todayPct = Math.round((today.length / articles.length) * 100);
  const weekPct = Math.round((thisWeek.length / articles.length) * 100);

  return (
    <div className="space-y-8">
      <nav className="text-sm text-muted-foreground">
        <Link href="/hub" className="hover:text-foreground">Hub</Link>
        <span className="mx-2">&rsaquo;</span>
        <span className="text-foreground">Market Report</span>
      </nav>

      {/* Hero */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">
          Interview Market Report
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Auto-generated from {feedMeta.totalArticles} articles across {Object.keys(feedMeta.sourceBreakdown).length} sources. Updated every 3 hours.
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Total Articles" value={feedMeta.totalArticles} />
        <MetricCard label="Sources" value={Object.keys(feedMeta.sourceBreakdown).length} />
        <MetricCard label="Companies Tracked" value={Object.keys(companyCounts).length} />
        <MetricCard label="Total Discussions" value={`${(totalComments / 1000).toFixed(1)}k`} />
      </div>

      {/* Freshness */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-bold text-card-foreground">Content Freshness</h2>
        <div className="mt-3 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{today.length}</p>
            <p className="text-xs text-muted-foreground">Today ({todayPct}%)</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">{thisWeek.length}</p>
            <p className="text-xs text-muted-foreground">This Week ({weekPct}%)</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-muted-foreground">{avgScore}</p>
            <p className="text-xs text-muted-foreground">Avg Engagement</p>
          </div>
        </div>
      </section>

      {/* Category distribution */}
      <section>
        <h2 className="text-base font-bold text-foreground">Category Distribution</h2>
        <div className="mt-3 space-y-2">
          {catDist.map((cat) => (
            <div key={cat.label} className="flex items-center gap-3">
              <span className="w-28 text-sm text-muted-foreground">{cat.label}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary/60" style={{ width: `${cat.pct}%` }} />
              </div>
              <span className="w-16 text-right text-sm font-medium text-card-foreground">{cat.count} ({cat.pct}%)</span>
            </div>
          ))}
        </div>
      </section>

      {/* Top companies */}
      <section>
        <h2 className="text-base font-bold text-foreground">Most Discussed Companies (This Week)</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {topCompanies.map(([name, count]) => (
            <Link
              key={name}
              href={`/hub/company/${name.toLowerCase()}`}
              className="rounded-lg border border-border bg-card p-3 text-center transition-colors hover:border-primary/30"
            >
              <p className="text-lg font-bold text-card-foreground">{count}</p>
              <p className="text-xs text-muted-foreground">{name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Source distribution */}
      <section>
        <h2 className="text-base font-bold text-foreground">Source Distribution</h2>
        <div className="mt-3 space-y-2">
          {srcDist.map((src) => (
            <div key={src.label} className="flex items-center gap-3">
              <span className="w-28 text-sm text-muted-foreground">{src.label}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary/40" style={{ width: `${src.pct}%` }} />
              </div>
              <span className="w-16 text-right text-sm font-medium text-card-foreground">{src.count} ({src.pct}%)</span>
            </div>
          ))}
        </div>
      </section>

      {/* Citation */}
      <section className="rounded-xl border border-dashed border-border p-5 text-center">
        <p className="text-sm text-muted-foreground">
          Cite this report: &ldquo;{APP_NAME} Interview Market Report, {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}.
          Based on {feedMeta.totalArticles} articles from {Object.keys(feedMeta.sourceBreakdown).length} sources.&rdquo;
        </p>
        <Link href="/hub" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
          Explore the Knowledge Hub &rarr;
        </Link>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-center">
      <p className="text-2xl font-bold text-card-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
