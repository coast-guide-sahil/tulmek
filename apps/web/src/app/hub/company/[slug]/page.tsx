import type { Metadata } from "next";
import type { FeedArticle, HubCategory } from "@tulmek/core/domain";
import { tulmekRank, getCategoryMeta, formatRelativeTime, getSourceLabel } from "@tulmek/core/domain";
import { APP_NAME, TRENDING_SCORE_THRESHOLD } from "@tulmek/config/constants";
import feedData from "@tulmek/content/hub/feed";
import Link from "next/link";

const articles = feedData as unknown as FeedArticle[];

// Known companies with display names
const COMPANY_DISPLAY: Record<string, string> = {
  google: "Google", amazon: "Amazon", meta: "Meta", apple: "Apple",
  microsoft: "Microsoft", netflix: "Netflix", uber: "Uber", airbnb: "Airbnb",
  stripe: "Stripe", coinbase: "Coinbase", nvidia: "NVIDIA", tesla: "Tesla",
  openai: "OpenAI", anthropic: "Anthropic", palantir: "Palantir",
  databricks: "Databricks", snowflake: "Snowflake", linkedin: "LinkedIn",
  salesforce: "Salesforce", oracle: "Oracle", adobe: "Adobe",
  bloomberg: "Bloomberg", jpmorgan: "JPMorgan", goldman: "Goldman Sachs",
  flipkart: "Flipkart", atlassian: "Atlassian", shopify: "Shopify",
  spotify: "Spotify", dropbox: "Dropbox", doordash: "DoorDash",
  pinterest: "Pinterest", samsung: "Samsung", ibm: "IBM",
  paypal: "PayPal", cloudflare: "Cloudflare", datadog: "Datadog",
  mongodb: "MongoDB", vercel: "Vercel", github: "GitHub",
};

function getCompanyArticles(slug: string): FeedArticle[] {
  const lower = slug.toLowerCase();
  return articles.filter((a) => {
    const text = `${a.title} ${a.excerpt}`.toLowerCase();
    // Match pipe-separated company name or keyword in text
    if (a.title.includes("|")) {
      const first = a.title.split("|")[0]!.trim().toLowerCase();
      if (first === lower) return true;
    }
    return text.includes(lower);
  });
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = COMPANY_DISPLAY[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
  const count = getCompanyArticles(slug).length;
  return {
    title: `${name} Interview Prep`,
    description: `${count} interview prep articles about ${name} — experiences, compensation, system design, and more. Curated by ${APP_NAME}.`,
  };
}

export async function generateStaticParams() {
  return Object.keys(COMPANY_DISPLAY).map((slug) => ({ slug }));
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  const name = COMPANY_DISPLAY[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
  const companyArticles = getCompanyArticles(slug);
  const nowMs = new Date(feedData[0]?.aggregatedAt ?? new Date().toISOString()).getTime();
  const ranked = tulmekRank(companyArticles, nowMs, new Set(), {});

  // Category breakdown
  const catCounts: Record<string, number> = {};
  for (const a of companyArticles) {
    catCounts[a.category] = (catCounts[a.category] ?? 0) + 1;
  }

  // Source breakdown
  const srcCounts: Record<string, number> = {};
  for (const a of companyArticles) {
    srcCounts[a.source] = (srcCounts[a.source] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground">
        <Link href="/hub" className="hover:text-foreground">Hub</Link>
        <span className="mx-2">›</span>
        <span className="text-foreground">{name}</span>
      </nav>

      {/* Company header */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">
          {name} Interview Prep
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {companyArticles.length} articles from {Object.keys(srcCounts).length} sources
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(catCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 4)
          .map(([cat, count]) => {
            const meta = getCategoryMeta(cat);
            return (
              <div key={cat} className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs font-medium text-muted-foreground">{meta.label}</p>
                <p className="mt-1 text-xl font-bold text-card-foreground">{count}</p>
              </div>
            );
          })}
      </div>

      {/* Article list */}
      <div className="space-y-3">
        {ranked.length > 0 ? (
          ranked.map((article) => {
            const relTime = formatRelativeTime(article.publishedAt);
            const source = getSourceLabel(article.source);
            const catMeta = getCategoryMeta(article.category);
            const isTrending = article.score >= TRENDING_SCORE_THRESHOLD;

            return (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="hub-card group block rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
                    {catMeta.label}
                  </span>
                  <span>{source}</span>
                  <span>{relTime}</span>
                  {isTrending && (
                    <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 font-medium text-destructive">
                      TRENDING
                    </span>
                  )}
                </div>
                <h3 className="mt-2 text-sm font-semibold text-card-foreground group-hover:text-primary sm:text-base">
                  {article.title}
                </h3>
                {article.excerpt !== article.title && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground/80">
                    {article.excerpt}
                  </p>
                )}
                <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                  {article.score > 0 && <span>▲ {article.score >= 1000 ? `${(article.score / 1000).toFixed(1)}k` : article.score}</span>}
                  {article.commentCount > 0 && <span>💬 {article.commentCount}</span>}
                  <span>{article.readingTime} min</span>
                </div>
              </a>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-border py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No articles found for {name}. Content refreshes every 3 hours.
            </p>
            <Link href="/hub" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
              Browse all articles
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
