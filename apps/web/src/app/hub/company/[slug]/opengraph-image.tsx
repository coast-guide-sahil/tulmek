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

// Category dot color — mapped from known categories to bright accent colors
const CATEGORY_COLORS: Record<string, string> = {
  "interview-experience":  "#3b82f6",
  "system-design":         "#a855f7",
  "algorithms":            "#f59e0b",
  "data-structures":       "#22c55e",
  "behavioral":            "#f97316",
  "compensation":          "#ec4899",
  "career":                "#14b8a6",
  "coding":                "#6366f1",
};

function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? "#71717a";
}

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = getCompanyName(slug);
  const companyArticles = getCompanyArticles(slug);

  // Category breakdown — top 5
  const catCounts: Record<string, number> = {};
  for (const a of companyArticles) {
    catCounts[a.category] = (catCounts[a.category] ?? 0) + 1;
  }
  const topCategories = Object.entries(catCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([cat, count]) => ({ cat, label: getCategoryMeta(cat).label, count }));

  // Unique sources
  const sources = [...new Set(companyArticles.map((a) => a.source))];

  // Freshness
  const latestArticle = companyArticles[0];
  const hoursAgo = latestArticle
    ? Math.round((Date.now() - new Date(latestArticle.publishedAt).getTime()) / 3600000)
    : 0;
  const freshnessText =
    hoursAgo < 1 ? "Updated just now" :
    hoursAgo < 24 ? `Updated ${hoursAgo}h ago` :
    `Updated ${Math.round(hoursAgo / 24)}d ago`;

  // Largest category percentage for progress bar fill
  const total = companyArticles.length;
  const maxCount = topCategories[0]?.count ?? 1;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#09090b",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background accent blobs */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-120px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-80px",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.14) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Top bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "32px 52px 0",
          }}
        >
          {/* TULMEK branding */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {/* Logo mark — geometric T */}
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "22px", height: "4px", background: "#fff", borderRadius: "2px", display: "flex" }} />
                <div style={{ width: "4px", height: "14px", background: "#fff", borderRadius: "2px", display: "flex" }} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", display: "flex" }}>
                TULMEK
              </div>
              <div style={{ fontSize: "11px", color: "#71717a", letterSpacing: "1px", display: "flex" }}>
                KNOWLEDGE HUB
              </div>
            </div>
          </div>

          {/* Freshness pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              background: "#18181b",
              border: "1px solid #27272a",
              borderRadius: "24px",
              padding: "7px 16px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#22c55e",
                display: "flex",
              }}
            />
            <div style={{ fontSize: "13px", color: "#22c55e", fontWeight: 600, display: "flex" }}>
              {freshnessText}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flex: 1, padding: "28px 52px 0" }}>
          {/* Left column — company + stats */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            {/* Interview prep label */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#3b82f6",
                  letterSpacing: "2px",
                  display: "flex",
                }}
              >
                INTERVIEW PREP
              </div>
            </div>

            {/* Company name */}
            <div
              style={{
                fontSize: name.length > 12 ? "62px" : "72px",
                fontWeight: 900,
                color: "#fafafa",
                lineHeight: 1.05,
                letterSpacing: "-2px",
                display: "flex",
              }}
            >
              {name}
            </div>

            {/* Article + source count strip */}
            <div style={{ display: "flex", alignItems: "center", gap: "24px", marginTop: "18px" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: "42px", fontWeight: 800, color: "#3b82f6", lineHeight: 1, display: "flex" }}>
                  {total}
                </div>
                <div style={{ fontSize: "13px", color: "#71717a", marginTop: "2px", display: "flex" }}>
                  articles curated
                </div>
              </div>
              <div
                style={{
                  width: "1px",
                  height: "48px",
                  background: "#27272a",
                  display: "flex",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: "42px", fontWeight: 800, color: "#a855f7", lineHeight: 1, display: "flex" }}>
                  {sources.length}
                </div>
                <div style={{ fontSize: "13px", color: "#71717a", marginTop: "2px", display: "flex" }}>
                  sources
                </div>
              </div>
              <div
                style={{
                  width: "1px",
                  height: "48px",
                  background: "#27272a",
                  display: "flex",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: "42px", fontWeight: 800, color: "#22c55e", lineHeight: 1, display: "flex" }}>
                  {topCategories.length}
                </div>
                <div style={{ fontSize: "13px", color: "#71717a", marginTop: "2px", display: "flex" }}>
                  categories
                </div>
              </div>
            </div>

            {/* Source chips (up to 5) */}
            {sources.length > 0 && (
              <div style={{ display: "flex", gap: "8px", marginTop: "20px", flexWrap: "wrap" }}>
                {sources.slice(0, 5).map((src) => (
                  <div
                    key={src}
                    style={{
                      display: "flex",
                      padding: "5px 12px",
                      background: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "20px",
                      fontSize: "12px",
                      color: "#a1a1aa",
                      fontWeight: 500,
                    }}
                  >
                    {src}
                  </div>
                ))}
                {sources.length > 5 && (
                  <div
                    style={{
                      display: "flex",
                      padding: "5px 12px",
                      background: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "20px",
                      fontSize: "12px",
                      color: "#52525b",
                    }}
                  >
                    +{sources.length - 5} more
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right column — category breakdown */}
          {topCategories.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "320px",
                marginLeft: "48px",
                background: "#111113",
                border: "1px solid #1f1f23",
                borderRadius: "20px",
                padding: "24px",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#52525b", letterSpacing: "1.5px", marginBottom: "16px", display: "flex" }}>
                TOP CATEGORIES
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {topCategories.map(({ cat, label, count }) => {
                  const pct = Math.round((count / maxCount) * 100);
                  const color = categoryColor(cat);
                  return (
                    <div key={cat} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "2px",
                              background: color,
                              display: "flex",
                            }}
                          />
                          <div style={{ fontSize: "13px", color: "#d4d4d8", fontWeight: 500, display: "flex" }}>
                            {label}
                          </div>
                        </div>
                        <div style={{ fontSize: "13px", color: "#52525b", display: "flex" }}>
                          {count}
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div
                        style={{
                          height: "4px",
                          background: "#27272a",
                          borderRadius: "2px",
                          display: "flex",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: color,
                            borderRadius: "2px",
                            display: "flex",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom footer bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 52px 28px",
            marginTop: "auto",
          }}
        >
          <div style={{ fontSize: "13px", color: "#3f3f46", display: "flex" }}>
            tulmek.vercel.app/hub/company/{slug}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              background: "linear-gradient(90deg, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.15) 100%)",
              border: "1px solid rgba(59,130,246,0.25)",
              borderRadius: "20px",
            }}
          >
            <div style={{ fontSize: "13px", color: "#6366f1", fontWeight: 700, display: "flex" }}>
              AI-powered interview prep
            </div>
          </div>
        </div>

        {/* Thin gradient bottom border */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "linear-gradient(90deg, #3b82f6 0%, #a855f7 50%, #6366f1 100%)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
