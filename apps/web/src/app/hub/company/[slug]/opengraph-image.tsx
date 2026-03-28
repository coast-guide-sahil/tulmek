import { ImageResponse } from "next/og";
import type { FeedArticle } from "@tulmek/core/domain";
import { getCategoryMeta } from "@tulmek/core/domain";
import feedData from "@tulmek/content/hub/feed";

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

export const alt = "TULMEK Interview Prep";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
  const name = COMPANY_DISPLAY[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
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

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #09090b 100%)",
          padding: "48px 56px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#fafafa" }}>TULMEK</div>
            <div style={{ fontSize: "14px", color: "#71717a", background: "#27272a", padding: "4px 12px", borderRadius: "20px" }}>
              Knowledge Hub
            </div>
          </div>
          <div style={{ fontSize: "14px", color: "#22c55e", display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e" }} />
            {freshnessText}
          </div>
        </div>

        {/* Company name */}
        <div style={{ marginTop: "40px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "56px", fontWeight: 800, color: "#fafafa", lineHeight: 1.1 }}>
            {name}
          </div>
          <div style={{ fontSize: "24px", color: "#a1a1aa", marginTop: "8px" }}>
            Interview Prep Intelligence
          </div>
        </div>

        {/* Stats row */}
        <div style={{ marginTop: "auto", display: "flex", gap: "32px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "40px", fontWeight: 800, color: "#3b82f6" }}>
              {companyArticles.length}
            </div>
            <div style={{ fontSize: "14px", color: "#71717a" }}>Articles</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "40px", fontWeight: 800, color: "#3b82f6" }}>
              {sources.size}
            </div>
            <div style={{ fontSize: "14px", color: "#71717a" }}>Sources</div>
          </div>
          {topCategories.map((cat) => (
            <div key={cat.label} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "40px", fontWeight: 800, color: "#fafafa" }}>
                {cat.count}
              </div>
              <div style={{ fontSize: "14px", color: "#71717a" }}>{cat.label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
