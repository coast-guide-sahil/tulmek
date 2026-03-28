import { ImageResponse } from "next/og";
import type { FeedArticle } from "@tulmek/core/domain";
import { getCategoryMeta, COMPANY_SLUGS, getCompanyName } from "@tulmek/core/domain";
import feedData from "@tulmek/content/hub/feed";

const articles = feedData as unknown as FeedArticle[];


export const alt = "TULMEK Interview Prep";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  return COMPANY_SLUGS.map((slug) => ({ slug }));
}

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

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = getCompanyName(slug);
  const companyArticles = getCompanyArticles(slug);

  // Category breakdown
  const catCounts: Record<string, number> = {};
  for (const a of companyArticles) {
    catCounts[a.category] = (catCounts[a.category] ?? 0) + 1;
  }
  const topCategories = Object.entries(catCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([cat, count]) => ({ label: getCategoryMeta(cat).label, count }));

  // Source count
  const sources = new Set(companyArticles.map((a) => a.source));

  // Freshness
  const latestArticle = companyArticles[0];
  const hoursAgo = latestArticle
    ? Math.round((Date.now() - new Date(latestArticle.publishedAt).getTime()) / 3600000)
    : 0;
  const freshnessText = hoursAgo < 1 ? "Updated just now" : hoursAgo < 24 ? `Updated ${hoursAgo}h ago` : `Updated ${Math.round(hoursAgo / 24)}d ago`;

  // Build stats as a flat array to avoid conditional rendering issues with Satori
  const stats: { value: string; label: string; color: string }[] = [
    { value: String(companyArticles.length), label: "Articles", color: "#3b82f6" },
    ...(sources.size > 0 ? [{ value: String(sources.size), label: "Sources", color: "#3b82f6" }] : []),
    ...topCategories.map((cat) => ({ value: String(cat.count), label: cat.label, color: "#fafafa" })),
  ];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #09090b 100%)", padding: "48px 56px", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#fafafa", display: "flex" }}>{"TULMEK"}</div>
            <div style={{ fontSize: "14px", color: "#71717a", background: "#27272a", padding: "4px 12px", borderRadius: "20px", display: "flex" }}>{"Knowledge Hub"}</div>
          </div>
          <div style={{ fontSize: "14px", color: "#22c55e", display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", display: "flex" }} />
            <div style={{ display: "flex" }}>{freshnessText}</div>
          </div>
        </div>
        <div style={{ marginTop: "40px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "56px", fontWeight: 800, color: "#fafafa", lineHeight: 1.1, display: "flex" }}>{name}</div>
          <div style={{ fontSize: "24px", color: "#a1a1aa", marginTop: "8px", display: "flex" }}>{"Interview Prep Intelligence"}</div>
        </div>
        <div style={{ marginTop: "auto", display: "flex", gap: "32px", alignItems: "flex-end" }}>
          {stats.map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "40px", fontWeight: 800, color: s.color, display: "flex" }}>{s.value}</div>
              <div style={{ fontSize: "14px", color: "#71717a", display: "flex" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
