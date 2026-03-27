import type { FeedArticle } from "@tulmek/core/domain";
import { getCategoryConfig } from "./hub-utils";

interface StatsBannerProps {
  readonly articles: FeedArticle[];
  readonly lastRefreshedAt: string;
}

export function StatsBanner({ articles, lastRefreshedAt }: StatsBannerProps) {
  // Compute stats
  const sourceCount = new Set(articles.map((a) => a.source)).size;
  const trendingCount = articles.filter((a) => a.score >= 500).length;
  const oneDayAgo = new Date(lastRefreshedAt).getTime() - 86400000;
  const newTodayCount = articles.filter(
    (a) => new Date(a.publishedAt).getTime() > oneDayAgo
  ).length;

  // Top 3 categories by count
  const categoryCounts: Record<string, number> = {};
  for (const a of articles) {
    categoryCounts[a.category] = (categoryCounts[a.category] ?? 0) + 1;
  }
  const topCategories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      <StatCard
        label="New Today"
        value={String(newTodayCount)}
        detail={`of ${articles.length} total`}
      />
      <StatCard
        label="Trending Now"
        value={String(trendingCount)}
        detail={`From ${sourceCount} sources`}
      />
      <StatCard
        label="Categories"
        value={String(Object.keys(categoryCounts).length)}
        detail={topCategories.slice(0, 2).map(([cat]) => getCategoryConfig(cat).label).join(", ") + " & more"}
      />
      <StatCard
        label="Last Refresh"
        value={new Date(lastRefreshedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
        detail={new Date(lastRefreshedAt).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  small = false,
}: {
  label: string;
  value: string;
  detail: string;
  small?: boolean;
}) {
  return (
    <div className="section-enter rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm sm:p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`number-pop mt-1 font-bold text-card-foreground ${small ? "text-sm" : "text-xl sm:text-2xl"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
