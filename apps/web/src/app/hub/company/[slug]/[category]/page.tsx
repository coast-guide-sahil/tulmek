import type { Metadata } from "next";
import type { FeedArticle } from "@tulmek/core/domain";
import { tulmekRank, getCategoryMeta, formatRelativeTime, getSourceLabel } from "@tulmek/core/domain";
import { APP_NAME, TRENDING_SCORE_THRESHOLD, MIN_ARTICLES_FOR_LANDING_PAGE, MAX_CROSS_LINKED_COMPANIES } from "@tulmek/config/constants";
import feedData from "@tulmek/content/hub/feed";
import Link from "next/link";

export const dynamic = "force-static";

const articles = feedData as unknown as FeedArticle[];

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

const ALL_CATEGORIES = [
  "dsa", "system-design", "ai-ml", "behavioral",
  "interview-experience", "compensation", "career", "general",
];

function getCompanyArticles(slug: string): FeedArticle[] {
  const lower = slug.toLowerCase();
  return articles.filter((a) => {
    const text = `${a.title} ${a.excerpt}`.toLowerCase();
    if (a.title.includes("|")) {
      const first = a.title.split("|")[0]!.trim().toLowerCase();
      if (first === lower) return true;
    }
    return text.includes(lower);
  });
}

interface Props {
  params: Promise<{ slug: string; category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, category } = await params;
  const name = COMPANY_DISPLAY[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
  const catMeta = getCategoryMeta(category);
  const count = getCompanyArticles(slug).filter((a) => a.category === category).length;
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://tulmek.vercel.app";

  return {
    title: `${name} ${catMeta.label} Interview Prep`,
    description: `${count} ${catMeta.label} articles for ${name} interview prep — curated and ranked by ${APP_NAME}.`,
    alternates: {
      canonical: `${BASE_URL}/hub/company/${slug}/${category}`,
    },
  };
}

export async function generateStaticParams() {
  const params: { slug: string; category: string }[] = [];

  for (const slug of Object.keys(COMPANY_DISPLAY)) {
    const companyArticles = getCompanyArticles(slug);
    for (const category of ALL_CATEGORIES) {
      const count = companyArticles.filter((a) => a.category === category).length;
      if (count >= MIN_ARTICLES_FOR_LANDING_PAGE) {
        params.push({ slug, category });
      }
    }
  }

  return params;
}

export default async function CompanyCategoryPage({ params }: Props) {
  const { slug, category } = await params;
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://tulmek.vercel.app";
  const name = COMPANY_DISPLAY[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
  const catMeta = getCategoryMeta(category);

  const companyArticles = getCompanyArticles(slug);
  const categoryArticles = companyArticles.filter((a) => a.category === category);

  const nowMs = new Date(feedData[0]?.aggregatedAt ?? new Date().toISOString()).getTime();
  const ranked = tulmekRank(categoryArticles, nowMs, new Set(), {});

  // Source breakdown
  const srcCounts: Record<string, number> = {};
  for (const a of categoryArticles) {
    srcCounts[a.source] = (srcCounts[a.source] ?? 0) + 1;
  }

  // Sibling categories — all other categories with article counts
  const siblingCategories = ALL_CATEGORIES
    .filter((cat) => cat !== category)
    .map((cat) => ({
      slug: cat,
      meta: getCategoryMeta(cat),
      count: companyArticles.filter((a) => a.category === cat).length,
    }))
    .filter((c) => c.count >= MIN_ARTICLES_FOR_LANDING_PAGE)
    .sort((a, b) => b.count - a.count);

  // Same category at other companies
  const otherCompanies = Object.keys(COMPANY_DISPLAY)
    .filter((s) => s !== slug)
    .map((s) => ({
      slug: s,
      name: COMPANY_DISPLAY[s]!,
      count: getCompanyArticles(s).filter((a) => a.category === category).length,
    }))
    .filter((c) => c.count >= MIN_ARTICLES_FOR_LANDING_PAGE)
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_CROSS_LINKED_COMPANIES);

  // Date of newest article for dateModified
  const newestArticle = ranked[0];
  const dateModified = newestArticle
    ? new Date(newestArticle.publishedAt).toISOString()
    : new Date().toISOString();

  // Top 10 articles for JSON-LD
  const top10 = ranked.slice(0, 10);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${name} ${catMeta.label} Interview Prep`,
    description: `${categoryArticles.length} ${catMeta.label} articles for ${name} interview prep from ${Object.keys(srcCounts).length} sources.`,
    url: `${BASE_URL}/hub/company/${slug}/${category}`,
    numberOfItems: categoryArticles.length,
    dateModified,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Hub", item: `${BASE_URL}/hub` },
        { "@type": "ListItem", position: 2, name: `${name} Interview Prep`, item: `${BASE_URL}/hub/company/${slug}` },
        { "@type": "ListItem", position: 3, name: `${catMeta.label}` },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: top10.map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: a.url,
        name: a.title,
      })),
    },
  };

  return (
    <div className="space-y-6">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground">
        <Link href="/hub" className="hover:text-foreground">Hub</Link>
        <span className="mx-2">›</span>
        <Link href={`/hub/company/${slug}`} className="hover:text-foreground">{name}</Link>
        <span className="mx-2">›</span>
        <span className="text-foreground">{catMeta.label}</span>
      </nav>

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">
          {name} {catMeta.label} Interview Prep
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {categoryArticles.length} articles · {Object.keys(srcCounts).length} sources
        </p>
      </div>

      {/* Article list */}
      <div className="space-y-3">
        {ranked.length > 0 ? (
          ranked.map((article) => {
            const relTime = formatRelativeTime(article.publishedAt);
            const source = getSourceLabel(article.source);
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
                  <span>{source}</span>
                  <span>{relTime}</span>
                  {isTrending && (
                    <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 font-medium text-destructive">
                      TRENDING
                    </span>
                  )}
                </div>
                <h2 className="mt-2 text-sm font-semibold text-card-foreground group-hover:text-primary sm:text-base">
                  {article.title}
                </h2>
                {article.excerpt !== article.title && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground/80">
                    {article.excerpt}
                  </p>
                )}
                <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                  {article.score > 0 && (
                    <span>▲ {article.score >= 1000 ? `${(article.score / 1000).toFixed(1)}k` : article.score}</span>
                  )}
                  {article.commentCount > 0 && <span>💬 {article.commentCount}</span>}
                  <span>{article.readingTime} min</span>
                </div>
              </a>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-border py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No {catMeta.label} articles found for {name}. Content refreshes every 3 hours.
            </p>
            <Link href={`/hub/company/${slug}`} className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
              View all {name} articles
            </Link>
          </div>
        )}
      </div>

      {/* Sibling categories — More {Company} Interview Prep */}
      {siblingCategories.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-bold text-card-foreground">More {name} Interview Prep</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {siblingCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/hub/company/${slug}/${c.slug}`}
                className="flex min-h-[44px] items-center rounded-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              >
                {c.meta.label}
                <span className="ml-1.5 text-muted-foreground/70">({c.count})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Same category at other companies */}
      {otherCompanies.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-bold text-card-foreground">{catMeta.label} Prep at Other Companies</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {otherCompanies.map((c) => (
              <Link
                key={c.slug}
                href={`/hub/company/${c.slug}/${category}`}
                className="flex min-h-[44px] items-center rounded-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              >
                {c.name}
                <span className="ml-1.5 text-muted-foreground/70">({c.count})</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
