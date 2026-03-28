"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { FeedArticle } from "@tulmek/core/domain";

interface CompanyFilterProps {
  readonly articles: FeedArticle[];
  readonly activeCompany: string | null;
  readonly onCompanyClick: (company: string | null) => void;
}

// Known tech companies to extract from titles
const KNOWN_COMPANIES = new Set([
  "google", "amazon", "meta", "apple", "microsoft", "netflix", "uber",
  "airbnb", "stripe", "coinbase", "robinhood", "lyft", "twitter", "x",
  "snap", "snapchat", "tiktok", "bytedance", "nvidia", "tesla", "openai",
  "anthropic", "palantir", "databricks", "snowflake", "figma", "notion",
  "linkedin", "salesforce", "oracle", "adobe", "intuit", "bloomberg",
  "jpmorgan", "goldman", "citadel", "two sigma", "jane street",
  "flipkart", "swiggy", "zomato", "razorpay", "phonepe", "cred",
  "atlassian", "canva", "shopify", "spotify", "dropbox", "slack",
  "doordash", "instacart", "pinterest", "reddit", "discord",
  "samsung", "sony", "ibm", "cisco", "vmware", "paypal", "square",
  "block", "twilio", "cloudflare", "datadog", "mongodb", "elastic",
  "hashicorp", "vercel", "supabase", "github", "gitlab",
]);

function extractCompany(title: string): string | null {
  // Try pipe-separated format first: "Google | L4 | Offer"
  if (title.includes("|")) {
    const first = title.split("|")[0]!.trim();
    if (first.length <= 25 && first.length >= 2) {
      return first;
    }
  }

  // Try matching known companies in title
  const lower = title.toLowerCase();
  for (const company of KNOWN_COMPANIES) {
    if (lower.includes(company)) {
      return company.charAt(0).toUpperCase() + company.slice(1);
    }
  }

  return null;
}

export function CompanyFilter({ articles, activeCompany, onCompanyClick }: CompanyFilterProps) {
  const companies = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of articles) {
      const company = extractCompany(a.title);
      if (company) {
        const normalized = company.toLowerCase();
        counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
        if (!counts.has(normalized + ":display")) {
          counts.set(normalized + ":display", 0);
          counts.set(normalized + ":name:" + company, 0);
        }
      }
    }

    // Build sorted list
    const result: { name: string; count: number }[] = [];
    for (const [key, count] of counts) {
      if (!key.includes(":") && count >= 2) {
        // Find display name
        const displayKey = [...counts.keys()].find((k) => k.startsWith(key + ":name:"));
        const displayName = displayKey ? displayKey.replace(key + ":name:", "") : key;
        result.push({ name: displayName, count });
      }
    }

    return result.sort((a, b) => b.count - a.count).slice(0, 12);
  }, [articles]);

  if (companies.length < 3) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="flex items-center text-xs font-medium text-muted-foreground">Companies:</span>
      {activeCompany && (
        <button
          onClick={() => onCompanyClick(null)}
          className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
        >
          {activeCompany} &times;
        </button>
      )}
      {!activeCompany && companies.map(({ name, count }) => (
        <Link
          key={name}
          href={`/hub/company/${name.toLowerCase()}`}
          className="min-h-[32px] inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
        >
          {name} <span className="ml-1 text-muted-foreground/50">{count}</span>
        </Link>
      ))}
    </div>
  );
}

export { extractCompany };
