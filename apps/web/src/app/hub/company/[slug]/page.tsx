import type { Metadata } from "next";
import type { FeedArticle, HubCategory } from "@tulmek/core/domain";
import { tulmekRank, getCategoryMeta, formatRelativeTime, getSourceLabel } from "@tulmek/core/domain";
import { APP_NAME, TRENDING_SCORE_THRESHOLD } from "@tulmek/config/constants";
import feedData from "@tulmek/content/hub/feed";
import Link from "next/link";
import { SharePrep } from "@/components/hub/share-prep";

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

  // Hiring signal detection from recent articles
  const recentTexts = companyArticles
    .filter((a) => nowMs - new Date(a.publishedAt).getTime() < 30 * 24 * 60 * 60 * 1000)
    .map((a) => `${a.title} ${a.excerpt}`.toLowerCase());
  const allText = recentTexts.join(" ");

  const layoffSignals = /layoff|laid off|let go|rif|reduction in force|cut.*jobs/i.test(allText);
  const freezeSignals = /hiring freeze|freeze.*hiring|not hiring|paused hiring|headcount freeze/i.test(allText);
  const hiringSignals = /hiring|open role|we.re looking|join.*team|new position|actively recruiting/i.test(allText);
  const interviewSignals = companyArticles.filter((a) =>
    a.category === "interview-experience" &&
    nowMs - new Date(a.publishedAt).getTime() < 14 * 24 * 60 * 60 * 1000
  ).length;

  type HiringStatus = "hiring" | "freeze" | "layoffs" | "unknown";
  const hiringStatus: HiringStatus = layoffSignals ? "layoffs" : freezeSignals ? "freeze" : (hiringSignals || interviewSignals >= 2) ? "hiring" : "unknown";

  const statusConfig: Record<HiringStatus, { label: string; color: string; bg: string }> = {
    hiring: { label: "Actively Hiring", color: "text-success", bg: "bg-success/10" },
    freeze: { label: "Hiring Freeze Reported", color: "text-amber-500", bg: "bg-amber-500/10" },
    layoffs: { label: "Recent Layoffs", color: "text-destructive", bg: "bg-destructive/10" },
    unknown: { label: "Status Unknown", color: "text-muted-foreground", bg: "bg-muted" },
  };
  const status = statusConfig[hiringStatus];

  // Interview profile — extract round types and levels from articles
  const roundTypes: Record<string, number> = {};
  const levelMentions: Record<string, number> = {};
  for (const a of companyArticles) {
    const text = `${a.title} ${a.excerpt}`.toLowerCase();
    // Round types
    const rounds = [
      ["Coding", /coding round|dsa round|leetcode|algorithm/],
      ["System Design", /system design|hld|lld|architecture round/],
      ["Behavioral", /behavioral|googlyness|leadership|star method/],
      ["Phone Screen", /phone screen|screening|recruiter call/],
      ["Onsite", /onsite|on-site|virtual onsite|loop/],
      ["Take-Home", /take-home|take home|assignment|project/],
    ] as const;
    for (const [name, regex] of rounds) {
      if (regex.test(text)) roundTypes[name] = (roundTypes[name] ?? 0) + 1;
    }
    // Levels
    const levelMatch = text.match(/\b(l[3-7]|e[3-7]|sde\s?[1-3]|junior|senior|staff|principal)\b/i);
    if (levelMatch) {
      const level = levelMatch[1]!.toUpperCase();
      levelMentions[level] = (levelMentions[level] ?? 0) + 1;
    }
  }
  const topRounds = Object.entries(roundTypes).sort(([, a], [, b]) => b - a).slice(0, 4);
  const topLevels = Object.entries(levelMentions).sort(([, a], [, b]) => b - a).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${name} Interview Prep`,
          description: `${companyArticles.length} interview prep articles about ${name} from ${Object.keys(srcCounts).length} sources.`,
          url: `https://tulmek.com/hub/company/${slug}`,
          numberOfItems: companyArticles.length,
          breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Hub", item: "https://tulmek.com/hub" },
              { "@type": "ListItem", position: 2, name: `${name} Interview Prep` },
            ],
          },
          ...(topRounds.length > 0 ? {
            mainEntity: {
              "@type": "FAQPage",
              mainEntity: [
                ...(topRounds.length > 0 ? [{
                  "@type": "Question",
                  name: `What interview rounds does ${name} have?`,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: `Based on ${companyArticles.length} recent articles, ${name} interviews commonly include: ${topRounds.map(([r]) => r).join(", ")}.`,
                  },
                }] : []),
                ...(topLevels.length > 0 ? [{
                  "@type": "Question",
                  name: `What levels does ${name} hire for?`,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: `Recent interview experiences mention levels: ${topLevels.map(([l]) => l).join(", ")}.`,
                  },
                }] : []),
              ],
            },
          } : {}),
        }) }}
      />

      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground">
        <Link href="/hub" className="hover:text-foreground">Hub</Link>
        <span className="mx-2">›</span>
        <span className="text-foreground">{name}</span>
      </nav>

      {/* Company header + hiring signal */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">
            {name} Interview Prep
          </h1>
          {hiringStatus !== "unknown" && (
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.color} ${status.bg}`}>
              {status.label}
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {companyArticles.length} articles from {Object.keys(srcCounts).length} sources
          </p>
          <SharePrep companyName={name} companySlug={slug} totalArticles={companyArticles.length} />
        </div>
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

      {/* Interview Profile */}
      {(topRounds.length > 0 || topLevels.length > 0) && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-bold text-card-foreground">Interview Profile</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Extracted from recent articles</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {topRounds.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Common Round Types</p>
                <div className="mt-1.5 space-y-1">
                  {topRounds.map(([round, count]) => (
                    <div key={round} className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/60"
                          style={{ width: `${(count / topRounds[0]![1]) * 100}%` }}
                        />
                      </div>
                      <span className="w-20 text-xs text-card-foreground">{round}</span>
                      <span className="w-6 text-right text-xs text-muted-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {topLevels.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Levels Mentioned</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {topLevels.map(([level, count]) => (
                    <span key={level} className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-card-foreground">
                      {level} <span className="text-muted-foreground">({count})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
      {/* Related companies — internal cross-linking for SEO */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-bold text-card-foreground">Other Companies</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.keys(COMPANY_DISPLAY)
            .filter((s) => s !== slug)
            .slice(0, 8)
            .map((s) => (
              <Link
                key={s}
                href={`/hub/company/${s}`}
                className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              >
                {COMPANY_DISPLAY[s]}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
