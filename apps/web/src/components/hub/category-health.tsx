import type { FeedArticle, HubCategory } from "@tulmek/core/domain";
import { getCategoryConfig } from "./hub-utils";

interface CategoryHealthProps {
  readonly articles: FeedArticle[];
  readonly nowMs: number;
}

/**
 * Shows content freshness per category — helps users understand
 * which categories are actively updated vs stale.
 * Transparency builds trust and sets expectations.
 */
export function CategoryHealth({ articles, nowMs }: CategoryHealthProps) {
  const categories = new Map<string, { total: number; fresh: number; avgAge: number }>();

  for (const article of articles) {
    if (article.category === "general") continue;

    const existing = categories.get(article.category) ?? { total: 0, fresh: 0, avgAge: 0 };
    const ageHours = (nowMs - new Date(article.publishedAt).getTime()) / 3600000;
    existing.total++;
    if (ageHours < 48) existing.fresh++;
    existing.avgAge = (existing.avgAge * (existing.total - 1) + ageHours) / existing.total;
    categories.set(article.category, existing);
  }

  const sorted = [...categories.entries()]
    .map(([cat, stats]) => ({
      category: cat as HubCategory,
      ...stats,
      freshPct: Math.round((stats.fresh / Math.max(1, stats.total)) * 100),
    }))
    .sort((a, b) => b.freshPct - a.freshPct);

  if (sorted.length < 3) return null;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {sorted.map((s) => {
        const config = getCategoryConfig(s.category);
        const healthColor = s.freshPct >= 20 ? "bg-success" : s.freshPct >= 5 ? "bg-amber-400" : "bg-muted-foreground/30";
        return (
          <div key={s.category} className="flex flex-col items-center rounded-lg border border-border bg-card p-2 text-center">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
              {config.label}
            </span>
            <span className="mt-1 text-lg font-bold text-card-foreground">{s.total}</span>
            <div className="mt-1 flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${healthColor}`} />
              <span className="text-xs text-muted-foreground">{s.fresh} fresh</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
