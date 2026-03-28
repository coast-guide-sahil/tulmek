import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://tulmek.com";

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

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/hub`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/hub/pulse`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/hub/report`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/hub/saved`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
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

  return [...staticPages, ...companyPages, ...categoryPages];
}
