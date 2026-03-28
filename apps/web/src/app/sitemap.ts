import type { MetadataRoute } from "next";
import type { FeedArticle } from "@tulmek/core/domain";
import feedData from "@tulmek/content/hub/feed";
import { MIN_ARTICLES_FOR_LANDING_PAGE } from "@tulmek/config/constants";

export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://tulmek.vercel.app";

const _articles = feedData as unknown as FeedArticle[];

const COMPANIES = [
  "google", "amazon", "meta", "apple", "microsoft", "netflix", "uber", "airbnb",
  "stripe", "coinbase", "nvidia", "tesla", "openai", "anthropic", "palantir",
  "databricks", "snowflake", "linkedin", "salesforce", "oracle", "adobe",
  "bloomberg", "jpmorgan", "goldman", "flipkart", "atlassian", "shopify",
  "spotify", "dropbox", "doordash", "pinterest", "samsung", "ibm",
  "paypal", "cloudflare", "datadog", "mongodb", "vercel", "github",
];

const CATEGORIES = [
  "dsa", "system-design", "ai-ml", "behavioral",
  "interview-experience", "compensation", "career", "general",
];

function getCompanyArticles(slug: string): FeedArticle[] {
  const lower = slug.toLowerCase();
  return _articles.filter((a) => {
    const text = `${a.title} ${a.excerpt}`.toLowerCase();
    if (a.title.includes("|")) {
      const first = a.title.split("|")[0]!.trim().toLowerCase();
      if (first === lower) return true;
    }
    return text.includes(lower);
  });
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/hub`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/hub/pulse`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/hub/report`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/hub/compare`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/hub/saved`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE_URL}/hub/settings`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/progress`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/progress/dsa`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/progress/hld`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/progress/lld`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/progress/behavioral`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  // Company intelligence pages — each can rank for "[Company] interview prep"
  const companyPages: MetadataRoute.Sitemap = COMPANIES.map((slug) => ({
    url: `${BASE_URL}/hub/company/${slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Category filter pages — shareable URLs via nuqs
  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${BASE_URL}/hub?category=${cat}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  // Company × category landing pages — only combos with sufficient articles
  const companyCategoryPages: MetadataRoute.Sitemap = [];
  for (const slug of COMPANIES) {
    const companyArticles = getCompanyArticles(slug);
    for (const cat of CATEGORIES) {
      const count = companyArticles.filter((a) => a.category === cat).length;
      if (count >= MIN_ARTICLES_FOR_LANDING_PAGE) {
        companyCategoryPages.push({
          url: `${BASE_URL}/hub/company/${slug}/${cat}`,
          lastModified: now,
          changeFrequency: "daily" as const,
          priority: 0.7,
        });
      }
    }
  }

  return [...staticPages, ...companyPages, ...categoryPages, ...companyCategoryPages];
}
