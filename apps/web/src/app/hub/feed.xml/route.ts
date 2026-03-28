export const dynamic = "force-static";

import type { FeedArticle } from "@tulmek/core/domain";
import { tulmekRank, getSourceLabel, getCategoryMeta } from "@tulmek/core/domain";
import { APP_NAME } from "@tulmek/config/constants";
import feedData from "@tulmek/content/hub/feed";

const articles = feedData as unknown as FeedArticle[];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const nowMs = new Date(articles[0]?.aggregatedAt ?? new Date().toISOString()).getTime();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  // Top 20 articles from this week, ranked by TCRA
  const thisWeek = articles.filter(
    (a) => nowMs - new Date(a.publishedAt).getTime() < weekMs
  );
  const top = tulmekRank(thisWeek, nowMs, new Set(), {}).slice(0, 20);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tulmek.vercel.app";
  const buildDate = new Date().toUTCString();

  const items = top.map((a) => {
    const cat = getCategoryMeta(a.category);
    const source = getSourceLabel(a.source);
    return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${escapeXml(a.url)}</link>
      <guid isPermaLink="false">${escapeXml(a.id)}</guid>
      <pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>
      <description>${escapeXml(a.excerpt)}</description>
      <category>${escapeXml(cat.label)}</category>
      <source url="${escapeXml(baseUrl)}/hub">${source}</source>
    </item>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${APP_NAME} Knowledge Hub</title>
    <link>${baseUrl}/hub</link>
    <description>Top interview prep articles from 8 sources, ranked by TCRA. Updated every 3 hours.</description>
    <language>en</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/hub/feed.xml" rel="self" type="application/rss+xml"/>
    <ttl>180</ttl>
${items.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=10800",
    },
  });
}
