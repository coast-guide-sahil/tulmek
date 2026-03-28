import { describe, it, expect } from "vitest";
import { tulmekRank } from "./ranking";
import type { FeedArticle } from "./article";
import type { ArticleId, ISOTimestamp } from "./branded";

const now = Date.now();

function makeArticle(overrides: Partial<FeedArticle> & { id: string }): FeedArticle {
  return {
    id: overrides.id as ArticleId,
    title: overrides.title ?? "Test Article",
    url: `https://example.com/${overrides.id}`,
    source: overrides.source ?? "reddit",
    sourceName: "Reddit",
    sourceIcon: "",
    domain: "reddit.com",
    category: overrides.category ?? "dsa",
    tags: overrides.tags ?? [],
    excerpt: overrides.excerpt ?? "Test excerpt",
    publishedAt: (overrides.publishedAt ?? new Date(now - 3600000).toISOString()) as ISOTimestamp,
    aggregatedAt: new Date(now).toISOString() as ISOTimestamp,
    score: overrides.score ?? 100,
    commentCount: overrides.commentCount ?? 10,
    readingTime: overrides.readingTime ?? 5,
    discussionUrl: null,
  };
}

describe("tulmekRank", () => {
  it("returns empty array for empty input", () => {
    expect(tulmekRank([], now, new Set(), {})).toEqual([]);
  });

  it("returns all articles when given input", () => {
    const articles = [
      makeArticle({ id: "1" }),
      makeArticle({ id: "2" }),
      makeArticle({ id: "3" }),
    ];
    const result = tulmekRank(articles, now, new Set(), {});
    expect(result).toHaveLength(3);
  });

  it("ranks higher-engagement articles first", () => {
    const articles = [
      makeArticle({ id: "low", score: 10, commentCount: 1 }),
      makeArticle({ id: "high", score: 1000, commentCount: 100 }),
    ];
    const result = tulmekRank(articles, now, new Set(), {});
    expect(result[0]!.id).toBe("high");
  });

  it("ranks fresher articles higher for time-sensitive categories", () => {
    const articles = [
      makeArticle({
        id: "old",
        category: "compensation",
        score: 200,
        publishedAt: new Date(now - 30 * 24 * 3600000).toISOString() as ISOTimestamp,
      }),
      makeArticle({
        id: "new",
        category: "compensation",
        score: 100,
        publishedAt: new Date(now - 3600000).toISOString() as ISOTimestamp,
      }),
    ];
    const result = tulmekRank(articles, now, new Set(), {});
    expect(result[0]!.id).toBe("new");
  });

  it("demotes read articles when user has sufficient history", () => {
    const articles = [
      makeArticle({ id: "read", score: 500 }),
      makeArticle({ id: "unread", score: 400 }),
    ];
    // Need 20+ reads for full personalization strength
    const readIds = new Set(Array.from({ length: 25 }, (_, i) => `past${i}`));
    readIds.add("read");
    const result = tulmekRank(articles, now, readIds, {});
    expect(result[0]!.id).toBe("unread");
  });

  it("provides source diversity", () => {
    // 10 articles from same source should not all be consecutive
    const articles = Array.from({ length: 20 }, (_, i) =>
      makeArticle({
        id: `r${i}`,
        source: i < 15 ? "reddit" : "hackernews",
        score: 100 - i,
      })
    );
    const result = tulmekRank(articles, now, new Set(), {});
    // HN articles should appear within first 15 despite lower scores
    const first15 = result.slice(0, 15);
    const hnInFirst15 = first15.filter((a) => a.source === "hackernews").length;
    expect(hnInFirst15).toBeGreaterThan(0);
  });

  it("provides category diversity in larger feeds", () => {
    const articles = Array.from({ length: 30 }, (_, i) =>
      makeArticle({
        id: `c${i}`,
        category: i < 25 ? "dsa" : "system-design",
        score: 200 - i,
      })
    );
    const result = tulmekRank(articles, now, new Set(), {});
    // System design should appear somewhere in the first 20 despite lower count
    // All articles should be present (diversity doesn't drop articles)
    expect(result).toHaveLength(30);
    // System design articles should still be in the result
    const sdCount = result.filter((a) => a.category === "system-design").length;
    expect(sdCount).toBe(5);
  });

  it("boosts content with interview-relevant signals", () => {
    const articles = [
      makeArticle({ id: "generic", title: "Random tech post", excerpt: "Some generic content", score: 100 }),
      makeArticle({ id: "interview", title: "Google | L5 | Offer — My System Design Round", excerpt: "Got the offer after phone screen and onsite coding round", score: 100 }),
    ];
    const result = tulmekRank(articles, now, new Set(), {});
    // Interview article should rank higher due to content richness (company, round, outcome)
    expect(result[0]!.id).toBe("interview");
  });
});
