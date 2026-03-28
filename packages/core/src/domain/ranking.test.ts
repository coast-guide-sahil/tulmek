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
    interviewQuestions: overrides.interviewQuestions ?? [],
    interviewFormats: overrides.interviewFormats ?? [],
    sourceCorroboration: overrides.sourceCorroboration ?? 0,
    topics: overrides.topics ?? [],
    difficulty: overrides.difficulty ?? "",
    sentiment: overrides.sentiment ?? "",
    actionability: overrides.actionability ?? 0,
  };
}

/** Returns a readIds set large enough for full personalisation strength (readCount >= 20). */
function fullReadHistory(extra: string[] = []): Set<string> {
  const ids = new Set(Array.from({ length: 25 }, (_, i) => `past${i}`));
  for (const id of extra) ids.add(id);
  return ids;
}

describe("tulmekRank", () => {
  // ── Edge cases ──────────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("returns empty array for empty input", () => {
      expect(tulmekRank([], now, new Set(), {})).toEqual([]);
    });

    it("returns the single article unchanged", () => {
      const article = makeArticle({ id: "solo" });
      const result = tulmekRank([article], now, new Set(), {});
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe("solo");
    });

    it("preserves all articles — no article is dropped", () => {
      const articles = Array.from({ length: 50 }, (_, i) =>
        makeArticle({
          id: `a${i}`,
          source: i % 2 === 0 ? "reddit" : "hackernews",
        }),
      );
      const result = tulmekRank(articles, now, new Set(), {});
      expect(result).toHaveLength(50);
      const ids = new Set(result.map((a) => a.id));
      for (const a of articles) expect(ids.has(a.id)).toBe(true);
    });

    it("returns all articles when given two articles", () => {
      const articles = [makeArticle({ id: "1" }), makeArticle({ id: "2" })];
      const result = tulmekRank(articles, now, new Set(), {});
      expect(result).toHaveLength(2);
    });
  });

  // ── Basic ordering ───────────────────────────────────────────────────────────

  describe("basic ordering", () => {
    it("ranks higher-engagement articles first", () => {
      const articles = [
        makeArticle({ id: "low", score: 10, commentCount: 1 }),
        makeArticle({ id: "high", score: 1000, commentCount: 100 }),
      ];
      const result = tulmekRank(articles, now, new Set(), {});
      expect(result[0]!.id).toBe("high");
    });

    it("ranking is deterministic — same input produces same output", () => {
      const articles = Array.from({ length: 10 }, (_, i) =>
        makeArticle({ id: `a${i}`, score: 100 + i * 10 }),
      );
      const result1 = tulmekRank(articles, now, new Set(), {});
      const result2 = tulmekRank(articles, now, new Set(), {});
      expect(result1.map((a) => a.id)).toEqual(result2.map((a) => a.id));
    });
  });

  // ── Freshness / time decay ────────────────────────────────────────────────────

  describe("freshness decay", () => {
    it("newer articles rank above older ones for time-sensitive categories (compensation)", () => {
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

    it("newer articles rank above older ones for interview-experience category", () => {
      const articles = [
        makeArticle({
          id: "old",
          category: "interview-experience",
          score: 500,
          publishedAt: new Date(now - 60 * 24 * 3600000).toISOString() as ISOTimestamp,
        }),
        makeArticle({
          id: "new",
          category: "interview-experience",
          score: 100,
          publishedAt: new Date(now - 2 * 3600000).toISOString() as ISOTimestamp,
        }),
      ];
      const result = tulmekRank(articles, now, new Set(), {});
      expect(result[0]!.id).toBe("new");
    });

    it("evergreen categories (dsa) retain score even when old", () => {
      // DSA decay floor is 0.4 — a year-old high-engagement DSA article should
      // comfortably outrank a brand-new minimal-quality general article.
      const oldDsa = makeArticle({
        id: "old-dsa",
        category: "dsa",
        score: 1000,
        commentCount: 200,
        publishedAt: new Date(now - 365 * 24 * 3600000).toISOString() as ISOTimestamp,
      });
      const newGeneral = makeArticle({
        id: "new-general",
        category: "general",
        score: 5,
        commentCount: 0,
        publishedAt: new Date(now - 3600000).toISOString() as ISOTimestamp,
      });
      const result = tulmekRank([oldDsa, newGeneral], now, new Set(), {});
      expect(result[0]!.id).toBe("old-dsa");
    });

    it("score decays over time — a very old article scores lower than a fresh equivalent", () => {
      // Both have identical base attributes; only publishedAt differs.
      const fresh = makeArticle({
        id: "fresh",
        category: "compensation",
        score: 100,
        publishedAt: new Date(now - 1 * 3600000).toISOString() as ISOTimestamp,
      });
      const stale = makeArticle({
        id: "stale",
        category: "compensation",
        score: 100,
        publishedAt: new Date(now - 90 * 24 * 3600000).toISOString() as ISOTimestamp,
      });
      const result = tulmekRank([stale, fresh], now, new Set(), {});
      expect(result[0]!.id).toBe("fresh");
    });
  });

  // ── Source credibility ────────────────────────────────────────────────────────

  describe("source credibility", () => {
    it("hackernews outranks reddit when all other signals equal", () => {
      const articles = [
        makeArticle({ id: "hn", source: "hackernews", score: 100, commentCount: 10 }),
        makeArticle({ id: "rd", source: "reddit", score: 100, commentCount: 10 }),
      ];
      const result = tulmekRank(articles, now, new Set(), {});
      expect(result[0]!.id).toBe("hn");
    });

    it("leetcode outranks medium when all other signals equal", () => {
      const articles = [
        makeArticle({ id: "lc", source: "leetcode", score: 100, commentCount: 10 }),
        makeArticle({ id: "md", source: "medium", score: 100, commentCount: 10 }),
      ];
      const result = tulmekRank(articles, now, new Set(), {});
      expect(result[0]!.id).toBe("lc");
    });

    it("newsletter outranks devto when all other signals equal", () => {
      const articles = [
        makeArticle({ id: "nl", source: "newsletter", score: 100, commentCount: 10 }),
        makeArticle({ id: "dt", source: "devto", score: 100, commentCount: 10 }),
      ];
      const result = tulmekRank(articles, now, new Set(), {});
      expect(result[0]!.id).toBe("nl");
    });

    it("credibility ordering: leetcode > hackernews > newsletter > github > devto > youtube > medium > reddit", () => {
      // All articles have identical engagement — only credibility differs.
      const orderedSources: FeedArticle["source"][] = [
        "leetcode",
        "hackernews",
        "newsletter",
        "github",
        "devto",
        "youtube",
        "medium",
        "reddit",
      ];
      const articles = orderedSources.map((source) =>
        makeArticle({ id: source, source, score: 100, commentCount: 10 }),
      );
      // Shuffle input to remove any positional bias
      const shuffled = [...articles].reverse();
      const result = tulmekRank(shuffled, now, new Set(), {});
      expect(result[0]!.source).toBe("leetcode");
      expect(result[result.length - 1]!.source).toBe("reddit");
    });
  });

  // ── Trending boost ───────────────────────────────────────────────────────────

  describe("trending boost", () => {
    it("a recent high-velocity article is boosted above an older equivalent", () => {
      // Both articles have the same raw score. The one published 2 h ago is
      // bursting; the one published 48 h ago has no velocity burst.
      const trending = makeArticle({
        id: "trending",
        score: 500,
        commentCount: 200,
        publishedAt: new Date(now - 2 * 3600000).toISOString() as ISOTimestamp,
      });
      const older = makeArticle({
        id: "older",
        score: 500,
        commentCount: 50,
        publishedAt: new Date(now - 48 * 3600000).toISOString() as ISOTimestamp,
      });
      const result = tulmekRank([older, trending], now, new Set(), {});
      expect(result[0]!.id).toBe("trending");
    });

    it("trending boost does not apply to articles older than 72 hours", () => {
      // trendingBonus returns 0 when ageHours > 72.
      // Both articles are present; neither should be dropped.
      const outsideWindow = makeArticle({
        id: "outside",
        score: 9999,
        commentCount: 5000,
        publishedAt: new Date(now - 80 * 3600000).toISOString() as ISOTimestamp,
      });
      const insideWindow = makeArticle({
        id: "inside",
        score: 100,
        commentCount: 50,
        publishedAt: new Date(now - 1 * 3600000).toISOString() as ISOTimestamp,
      });
      const result = tulmekRank([outsideWindow, insideWindow], now, new Set(), {});
      expect(result).toHaveLength(2);
      const ids = result.map((a) => a.id);
      expect(ids).toContain("outside");
      expect(ids).toContain("inside");
    });
  });

  // ── Personalization ───────────────────────────────────────────────────────────

  describe("personalization", () => {
    it("demotes read articles when user has sufficient history (20+ reads)", () => {
      const articles = [
        makeArticle({ id: "read", score: 500 }),
        makeArticle({ id: "unread", score: 400 }),
      ];
      const result = tulmekRank(articles, now, fullReadHistory(["read"]), {});
      expect(result[0]!.id).toBe("unread");
    });

    it("does not strongly demote read articles with cold-start profile (< 5 reads)", () => {
      // Only 1 read total — personalization strength = 1/20 = 0.05 (near-zero).
      // A much higher-scored read article still outranks a tiny unread one.
      const articles = [
        makeArticle({ id: "read", score: 2000, commentCount: 500 }),
        makeArticle({ id: "unread", score: 10, commentCount: 1 }),
      ];
      const result = tulmekRank(articles, now, new Set(["read"]), {});
      expect(result[0]!.id).toBe("read");
    });

    it("read articles are demoted but still appear in results (not removed)", () => {
      const articles = [
        makeArticle({ id: "read", score: 500 }),
        makeArticle({ id: "unread1", score: 400 }),
        makeArticle({ id: "unread2", score: 300 }),
      ];
      const result = tulmekRank(articles, now, fullReadHistory(["read"]), {});
      expect(result).toHaveLength(3);
      const ids = result.map((a) => a.id);
      expect(ids).toContain("read");
    });

    it("read demotion multiplier is 0.15 — a modest score gap is overcome", () => {
      // score ratio is 500:400 (1.25x). With readDemotion 0.15 and full strength,
      // the read article's effective score drops below the unread one.
      const articles = [
        makeArticle({ id: "read", score: 500 }),
        makeArticle({ id: "unread", score: 400 }),
      ];
      const result = tulmekRank(articles, now, fullReadHistory(["read"]), {});
      expect(result[0]!.id).toBe("unread");
    });

    it("bookmarked articles are not penalised — they remain in the ranked output", () => {
      const articles = [
        makeArticle({ id: "bookmarked", score: 300 }),
        makeArticle({ id: "normal", score: 300 }),
      ];
      const bookmarks = {
        bookmarked: { articleId: "bookmarked", savedAt: new Date().toISOString() },
      };
      const result = tulmekRank(articles, now, fullReadHistory(), bookmarks);
      const ids = result.map((a) => a.id);
      expect(ids).toContain("bookmarked");
    });

    it("bookmarking boosts category preference — bookmarked article is not ranked lower", () => {
      // A bookmarked DSA article (weight += 3 in profile) vs plain general article.
      // dsa has higher category weight (1.0) + bookmark boost → should outrank general.
      const articles = [
        makeArticle({ id: "bookmarked", score: 100, category: "dsa" }),
        makeArticle({ id: "plain", score: 100, category: "general" }),
      ];
      const bookmarks = {
        bookmarked: { articleId: "bookmarked", savedAt: new Date().toISOString() },
      };
      const result = tulmekRank(articles, now, fullReadHistory(), bookmarks);
      expect(result[0]!.id).toBe("bookmarked");
    });
  });

  // ── Category weights ─────────────────────────────────────────────────────────

  describe("category weights", () => {
    it("dsa articles outrank general articles when other signals are equal", () => {
      const articles = [
        makeArticle({ id: "general", category: "general", score: 100 }),
        makeArticle({ id: "dsa", category: "dsa", score: 100 }),
      ];
      const result = tulmekRank(articles, now, new Set(), {});
      expect(result[0]!.id).toBe("dsa");
    });

    it("system-design articles outrank career articles when other signals are equal", () => {
      const articles = [
        makeArticle({ id: "career", category: "career", score: 100 }),
        makeArticle({ id: "sysdesign", category: "system-design", score: 100 }),
      ];
      const result = tulmekRank(articles, now, new Set(), {});
      expect(result[0]!.id).toBe("sysdesign");
    });

    it("behavioral articles outrank ai-ml articles when other signals are equal", () => {
      const articles = [
        makeArticle({ id: "aiml", category: "ai-ml", score: 100 }),
        makeArticle({ id: "behavioral", category: "behavioral", score: 100 }),
      ];
      const result = tulmekRank(articles, now, new Set(), {});
      expect(result[0]!.id).toBe("behavioral");
    });
  });

  // ── Source diversity ──────────────────────────────────────────────────────────

  describe("source diversity", () => {
    it("articles from minority source appear within first 15 despite lower scores", () => {
      // 15 reddit + 5 hackernews. HN articles have lower scores but diverse-rerank
      // should interleave them early.
      const articles = Array.from({ length: 20 }, (_, i) =>
        makeArticle({
          id: `r${i}`,
          source: i < 15 ? "reddit" : "hackernews",
          score: 100 - i,
        }),
      );
      const result = tulmekRank(articles, now, new Set(), {});
      const first15 = result.slice(0, 15);
      const hnInFirst15 = first15.filter((a) => a.source === "hackernews").length;
      expect(hnInFirst15).toBeGreaterThan(0);
    });

    it("no article is lost due to source diversity reranking", () => {
      const articles = Array.from({ length: 20 }, (_, i) =>
        makeArticle({
          id: `r${i}`,
          source: i < 15 ? "reddit" : "hackernews",
          score: 100 - i,
        }),
      );
      const result = tulmekRank(articles, now, new Set(), {});
      expect(result).toHaveLength(20);
    });

    it("all articles preserved even when all from same source", () => {
      const articles = Array.from({ length: 20 }, (_, i) =>
        makeArticle({ id: `rd${i}`, source: "reddit", score: 200 - i }),
      );
      const result = tulmekRank(articles, now, new Set(), {});
      expect(result).toHaveLength(20);
    });
  });

  // ── Category diversity ────────────────────────────────────────────────────────

  describe("category diversity", () => {
    it("preserves all articles even when categories are heavily skewed", () => {
      const articles = Array.from({ length: 30 }, (_, i) =>
        makeArticle({
          id: `c${i}`,
          category: i < 25 ? "dsa" : "system-design",
          score: 200 - i,
        }),
      );
      const result = tulmekRank(articles, now, new Set(), {});
      expect(result).toHaveLength(30);
      expect(result.filter((a) => a.category === "system-design")).toHaveLength(5);
    });

    it("category diversity limits same-category clustering — catMult degrades at 4+ in window", () => {
      // Feed entirely of dsa articles — the diversity pass runs without dropping articles.
      const articles = Array.from({ length: 15 }, (_, i) =>
        makeArticle({ id: `d${i}`, category: "dsa", score: 300 - i * 10 }),
      );
      const result = tulmekRank(articles, now, new Set(), {});
      expect(result).toHaveLength(15);
    });

    it("minority category articles still appear in the result set", () => {
      // Even heavily minority categories are never excluded by the diversity pass.
      const articles = Array.from({ length: 30 }, (_, i) =>
        makeArticle({
          id: `c${i}`,
          category: i < 25 ? "dsa" : "system-design",
          score: 200 - i,
        }),
      );
      const result = tulmekRank(articles, now, new Set(), {});
      const sdArticles = result.filter((a) => a.category === "system-design");
      expect(sdArticles).toHaveLength(5);
    });
  });

  // ── Content richness signals ──────────────────────────────────────────────────

  describe("content richness", () => {
    it("boosts articles mentioning specific interview stages and company names", () => {
      const articles = [
        makeArticle({
          id: "generic",
          title: "Random tech post",
          excerpt: "Some generic content",
          score: 100,
        }),
        makeArticle({
          id: "interview",
          title: "Google | L5 | Offer — My System Design Round",
          excerpt: "Got the offer after phone screen and onsite coding round",
          score: 100,
        }),
      ];
      const result = tulmekRank(articles, now, new Set(), {});
      expect(result[0]!.id).toBe("interview");
    });

    it("boosts articles with complexity analysis keywords over plain-language content", () => {
      // "shallow" must not trigger ANY contentRichness keyword.
      // "deep" triggers "time complex" (+0.2) and "algorithm" (+0.25).
      const articles = [
        makeArticle({
          id: "shallow",
          title: "Two Sum problem",
          excerpt: "A helpful overview of the topic",
          score: 100,
        }),
        makeArticle({
          id: "deep",
          title: "Two Sum",
          excerpt: "O(n) time complexity using a hash map algorithm",
          score: 100,
        }),
      ];
      const result = tulmekRank(articles, now, new Set(), {});
      expect(result[0]!.id).toBe("deep");
    });

    it("boosts articles with salary/compensation data signals", () => {
      // "vague" has no trigger words. "specific" triggers "$\d{2,3}k" (+0.2).
      const articles = [
        makeArticle({
          id: "vague",
          title: "I got an offer",
          excerpt: "Happy to share my experience",
          score: 100,
        }),
        makeArticle({
          id: "specific",
          title: "Got the offer from Amazon",
          excerpt: "TC: $350k, 4 rounds, system design + 3 coding",
          score: 100,
        }),
      ];
      const result = tulmekRank(articles, now, new Set(), {});
      expect(result[0]!.id).toBe("specific");
    });

    it("boosts articles with code implementation signals (algorithm keyword)", () => {
      // "theory" has no trigger words. "impl" triggers "algorithm" (+0.25).
      const articles = [
        makeArticle({
          id: "theory",
          title: "Binary Search Explained",
          excerpt: "A conceptual overview of searching",
          score: 100,
        }),
        makeArticle({
          id: "impl",
          title: "Binary Search",
          excerpt: "Hash map based algorithm with O(log n) analysis",
          score: 100,
        }),
      ];
      const result = tulmekRank(articles, now, new Set(), {});
      expect(result[0]!.id).toBe("impl");
    });
  });

  // ── Combined signals ──────────────────────────────────────────────────────────

  describe("combined signals", () => {
    it("freshness dominates for compensation — very stale high-score article loses to fresh low-score", () => {
      // compensation half-life = 14 days; decay floor = 0.03.
      // A 45-day-old article is near its floor; a fresh article wins.
      const articles = [
        makeArticle({
          id: "old-high",
          category: "compensation",
          score: 2000,
          commentCount: 500,
          publishedAt: new Date(now - 45 * 24 * 3600000).toISOString() as ISOTimestamp,
        }),
        makeArticle({
          id: "new-low",
          category: "compensation",
          score: 50,
          commentCount: 5,
          publishedAt: new Date(now - 1 * 3600000).toISOString() as ISOTimestamp,
        }),
      ];
      const result = tulmekRank(articles, now, new Set(), {});
      expect(result[0]!.id).toBe("new-low");
    });

    it("source diversity does not displace the clear #1 article", () => {
      // A vastly superior article must remain at position 0 regardless of
      // how many articles from the same source exist.
      const best = makeArticle({
        id: "best",
        source: "leetcode",
        category: "dsa",
        score: 9999,
        commentCount: 500,
        publishedAt: new Date(now - 1 * 3600000).toISOString() as ISOTimestamp,
        title: "Implement LRU Cache — Google L5 phone screen — O(1) algorithm",
        excerpt: "Class-based O(1) time complexity with Big O analysis",
      });
      const others = Array.from({ length: 15 }, (_, i) =>
        makeArticle({ id: `other${i}`, source: "leetcode", score: 100, category: "dsa" }),
      );
      const result = tulmekRank([...others, best], now, new Set(), {});
      expect(result[0]!.id).toBe("best");
    });

    it("read demotion is effective — a modest score advantage is not enough to overcome it", () => {
      // score gap is 500:400 (1.25x). readDemotion 0.15 at full strength reduces
      // the read article's effective score to well below the unread one.
      const articles = [
        makeArticle({ id: "read", score: 500 }),
        makeArticle({ id: "unread", score: 400 }),
      ];
      const result = tulmekRank(articles, now, fullReadHistory(["read"]), {});
      expect(result[0]!.id).toBe("unread");
    });
  });
});
