"use client";

import { useMemo } from "react";
import type { FeedArticle } from "@tulmek/core/domain";

interface ExploreCompaniesProps {
  readonly articles: FeedArticle[];
  readonly onCompanyClick: (company: string) => void;
}

// Extract company-like entities: capitalized words that appear frequently
// across multiple articles (likely company names, product names, or tech brands)
const NOISE = new Set([
  "the", "how", "what", "why", "when", "who", "which",
  "new", "best", "top", "just", "got", "get", "one",
  "show", "ask", "tell", "don", "does", "did", "will",
  "interview", "coding", "system", "design", "data",
  "software", "engineer", "career", "job", "offer",
  "salary", "remote", "senior", "junior", "staff",
  "question", "problem", "solution", "algorithm",
  "experience", "practice", "preparation", "learning",
  "anyone", "everyone", "people", "company", "companies",
  "work", "working", "today", "ever", "never",
  "really", "actually", "finally", "recently",
  "programming", "developer", "tech", "web",
  "after", "before", "here", "there", "been",
  "have", "has", "had", "being", "some", "most",
  "first", "last", "next", "much", "many", "more",
  "year", "years", "month", "months", "week", "day",
  "looking", "feel", "help", "start", "want",
  "think", "know", "like", "make", "take", "need",
  "going", "doing", "getting", "making", "time",
  "still", "things", "thing", "good", "bad",
  "turned", "come", "give", "find", "every",
  "superb", "talent", "applying", "open", "roles",
  "straight", "silence", "embarrassed",
  "laid", "layoffs", "reminder", "flying",
  "cracked", "minutes", "studying", "per",
  "insurance", "seen", "applying",
]);

export function ExploreCompanies({ articles, onCompanyClick }: ExploreCompaniesProps) {
  const companies = useMemo(() => {
    const entityCount = new Map<string, number>();

    for (const article of articles) {
      const words = article.title.split(/\s+/);
      const seen = new Set<string>();

      for (const word of words) {
        const clean = word.replace(/[^a-zA-Z0-9]/g, "");
        if (clean.length < 2) continue;

        const first = clean.charAt(0);
        // Must be capitalized (proper noun heuristic)
        if (first !== first.toUpperCase() || first === first.toLowerCase()) continue;

        const lower = clean.toLowerCase();
        if (NOISE.has(lower)) continue;
        if (seen.has(lower)) continue;
        seen.add(lower);

        entityCount.set(clean, (entityCount.get(clean) ?? 0) + 1);
      }
    }

    // Merge case variants
    const merged = new Map<string, { name: string; count: number }>();
    for (const [name, count] of entityCount) {
      const key = name.toLowerCase();
      const existing = merged.get(key);
      if (existing) {
        existing.count += count;
        if (count > existing.count / 2) existing.name = name;
      } else {
        merged.set(key, { name, count });
      }
    }

    return [...merged.values()]
      .filter((e) => e.count >= 4)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [articles]);

  if (companies.length < 3) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-foreground">Explore by Topic</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Auto-discovered from {articles.length} articles — click to explore
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {companies.map(({ name, count }) => (
          <button
            key={name}
            onClick={() => onCompanyClick(name)}
            className="group flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <span className="font-medium">{name}</span>
            <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground group-hover:bg-primary-foreground/20 group-hover:text-primary-foreground">
              {count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
