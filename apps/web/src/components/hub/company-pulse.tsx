import type { FeedArticle } from "@tulmek/core/domain";

interface CompanyPulseProps {
  readonly articles: FeedArticle[];
  readonly onCompanyClick: (company: string) => void;
}

/**
 * Dynamically discovers entities being discussed using frequency analysis.
 * ZERO hardcoded companies — extracts capitalized multi-word phrases
 * and proper nouns from article titles, then ranks by mention frequency
 * weighted by engagement score.
 *
 * Think Google News "Full Coverage" — pure content-driven discovery.
 */
export function CompanyPulse({ articles, onCompanyClick }: CompanyPulseProps) {
  // Extract capitalized words/phrases from titles (likely company/product names)
  const entityScores = new Map<string, { count: number; totalScore: number }>();

  // Common words to skip (not entities)
  const STOP_WORDS = new Set([
    "the", "a", "an", "i", "my", "me", "we", "our", "you", "your",
    "how", "what", "why", "when", "who", "which", "where", "this",
    "that", "these", "those", "is", "are", "was", "were", "be", "been",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "can", "may", "might", "must", "shall", "need", "want",
    "new", "old", "big", "small", "good", "bad", "best", "worst",
    "first", "last", "next", "just", "not", "no", "yes", "all", "any",
    "some", "every", "each", "much", "many", "more", "most", "few",
    "here", "there", "now", "then", "today", "yet", "still", "also",
    "too", "very", "really", "actually", "finally", "recently", "ever",
    "never", "always", "often", "sometimes", "already", "after", "before",
    "about", "from", "into", "with", "for", "and", "but", "or", "so",
    "if", "to", "of", "in", "on", "at", "by", "up", "as",
    // Common interview/tech words (not company names)
    "interview", "coding", "system", "design", "data", "software",
    "engineer", "developer", "career", "job", "offer", "salary",
    "remote", "senior", "junior", "staff", "principal", "tech",
    "question", "answer", "problem", "solution", "algorithm",
    "experience", "practice", "preparation", "learning", "study",
    "tips", "advice", "guide", "review", "discussion", "thread",
    "anyone", "everyone", "someone", "people", "company", "companies",
    "year", "years", "month", "months", "week", "day", "days",
    "work", "working", "life", "time", "don", "didn", "doesn",
    "won", "isn", "aren", "wasn", "weren", "haven", "hasn",
    "show", "ask", "tell", "get", "got", "make", "take",
    "like", "think", "know", "feel", "see", "look", "find",
    "give", "want", "use", "try", "help", "start", "stop",
    "going", "doing", "being", "having", "getting", "making",
    "programming", "web", "app", "api", "ux", "ui", "dev",
  ]);

  for (const article of articles) {
    // Extract capitalized words from title that could be entity names
    const words = article.title.split(/\s+/);
    const seen = new Set<string>();

    for (const word of words) {
      // Clean punctuation
      const clean = word.replace(/[^a-zA-Z0-9/+#.'-]/g, "");
      if (clean.length < 2) continue;

      // Must start with uppercase (likely proper noun / entity)
      const firstChar = clean.charAt(0);
      if (firstChar !== firstChar.toUpperCase() || firstChar === firstChar.toLowerCase()) continue;

      const lower = clean.toLowerCase();
      if (STOP_WORDS.has(lower)) continue;

      // Use original casing for display
      if (!seen.has(lower)) {
        seen.add(lower);
        const existing = entityScores.get(clean) ?? { count: 0, totalScore: 0 };
        entityScores.set(clean, {
          count: existing.count + 1,
          totalScore: existing.totalScore + article.score,
        });
      }
    }
  }

  // Merge case variants (e.g., "FAANG" and "Faang")
  const merged = new Map<string, { display: string; count: number; totalScore: number }>();
  for (const [name, stats] of entityScores) {
    const key = name.toLowerCase();
    const existing = merged.get(key);
    if (existing) {
      existing.count += stats.count;
      existing.totalScore += stats.totalScore;
      // Keep the version with higher count as display
      if (stats.count > existing.count) existing.display = name;
    } else {
      merged.set(key, { display: name, ...stats });
    }
  }

  const topEntities = [...merged.values()]
    .filter((v) => v.count >= 3) // Must appear in 3+ articles
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 12);

  if (topEntities.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">Trending Mentions</h2>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          Live
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Most discussed companies, tools & topics — discovered from content
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {topEntities.map(({ display, count }) => (
          <button
            key={display}
            onClick={() => onCompanyClick(display)}
            className="flex min-h-[36px] items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-card-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            {display}
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
