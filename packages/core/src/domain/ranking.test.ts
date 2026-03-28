import { describe, it, expect } from "vitest";
import { tulmekRank, getTrendingTopics } from "./ranking";
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

  // ── Semantic richness (TCRA v3) ───────────────────────────────────────────────

  describe("semantic richness", () => {
    it("fully enriched article ranks above a plain article when other signals are equal", () => {
      // Enriched article has topics (3+), difficulty, sentiment, and high actionability.
      const articles = [
        makeArticle({
          id: "plain",
          score: 100,
          topics: [],
          difficulty: "",
          sentiment: "",
          actionability: 0,
        }),
        makeArticle({
          id: "enriched",
          score: 100,
          topics: ["distributed systems", "consistent hashing", "load balancing"],
          difficulty: "intermediate",
          sentiment: "positive",
          actionability: 0.8,
        }),
      ];
      const result = tulmekRank(articles, now, new Set(), {});
      expect(result[0]!.id).toBe("enriched");
    });

    it("partial enrichment (topics only) still boosts an article over a plain one", () => {
      const articles = [
        makeArticle({
          id: "plain",
          score: 100,
          topics: [],
          difficulty: "",
          sentiment: "",
          actionability: 0,
        }),
        makeArticle({
          id: "partial",
          score: 100,
          topics: ["dynamic programming"],
          difficulty: "",
          sentiment: "",
          actionability: 0,
        }),
      ];
      const result = tulmekRank(articles, now, new Set(), {});
      expect(result[0]!.id).toBe("partial");
    });

    it("no enrichment fields produce zero semantic boost — article is not penalised", () => {
      // Empty enrichment should not hurt ranking; both articles equal → score tie
      // resolved by other signals (source credibility here is the tie-breaker).
      const articles = [
        makeArticle({
          id: "no-enrich",
          source: "leetcode",
          score: 100,
          topics: [],
          difficulty: "",
          sentiment: "",
          actionability: 0,
        }),
        makeArticle({
          id: "reddit-enrich",
          source: "reddit",
          score: 100,
          topics: ["binary search"],
          difficulty: "beginner",
          sentiment: "neutral",
          actionability: 0.6,
        }),
      ];
      const result = tulmekRank(articles, now, new Set(), {});
      // Both articles must be present regardless of enrichment
      const ids = result.map((a) => a.id);
      expect(ids).toContain("no-enrich");
      expect(ids).toContain("reddit-enrich");
    });

    it("high actionability (>0.5) contributes to semantic score", () => {
      const articles = [
        makeArticle({
          id: "low-action",
          score: 100,
          topics: [],
          difficulty: "",
          sentiment: "",
          actionability: 0.2,
        }),
        makeArticle({
          id: "high-action",
          score: 100,
          topics: [],
          difficulty: "",
          sentiment: "",
          actionability: 0.9,
        }),
      ];
      const result = tulmekRank(articles, now, new Set(), {});
      expect(result[0]!.id).toBe("high-action");
    });
  });

  // ── MMR diversity reranking (TCRA v3) ─────────────────────────────────────────

  describe("mmr diversity reranking", () => {
    it("preserves all articles — no article is lost during MMR reranking", () => {
      // 60 articles: MMR selects top 50, remainder appended — all must survive.
      const articles = Array.from({ length: 60 }, (_, i) =>
        makeArticle({
          id: `mmr${i}`,
          source: i % 3 === 0 ? "reddit" : i % 3 === 1 ? "hackernews" : "leetcode",
          category: i % 4 === 0 ? "dsa" : i % 4 === 1 ? "system-design" : i % 4 === 2 ? "behavioral" : "career",
          score: 200 - i,
        }),
      );
      const result = tulmekRank(articles, now, new Set(), {});
      expect(result).toHaveLength(60);
      const ids = new Set(result.map((a) => a.id));
      for (const a of articles) expect(ids.has(a.id)).toBe(true);
    });

    it("top-ranked article (highest TulmekScore) always occupies position 0", () => {
      // The best article is selected first by MMR (pure relevance for slot 0).
      const best = makeArticle({
        id: "best",
        source: "leetcode",
        category: "dsa",
        score: 9999,
        commentCount: 500,
        publishedAt: new Date(now - 1 * 3600000).toISOString() as ISOTimestamp,
        topics: ["sliding window", "two pointers", "hash map"],
        difficulty: "advanced",
        sentiment: "positive",
        actionability: 0.9,
      });
      const others = Array.from({ length: 20 }, (_, i) =>
        makeArticle({
          id: `other${i}`,
          source: i % 2 === 0 ? "reddit" : "hackernews",
          score: 100 + i,
          category: "dsa",
        }),
      );
      const result = tulmekRank([...others, best], now, new Set(), {});
      expect(result[0]!.id).toBe("best");
    });

    it("MMR promotes source diversity — articles from minority source appear early", () => {
      // 25 reddit + 5 leetcode. MMR similarity penalty for source overlap
      // should interleave leetcode articles into the early positions.
      const articles = Array.from({ length: 30 }, (_, i) =>
        makeArticle({
          id: `art${i}`,
          source: i < 25 ? "reddit" : "leetcode",
          score: 200 - i,
          category: "dsa",
        }),
      );
      const result = tulmekRank(articles, now, new Set(), {});
      const first20 = result.slice(0, 20);
      const leetcodeInFirst20 = first20.filter((a) => a.source === "leetcode").length;
      expect(leetcodeInFirst20).toBeGreaterThan(0);
    });

    it("MMR promotes category diversity — same-category clustering is reduced", () => {
      // 20 dsa + 5 system-design. MMR penalises same-category adjacency,
      // so system-design articles should appear within the first 15.
      const articles = Array.from({ length: 25 }, (_, i) =>
        makeArticle({
          id: `cat${i}`,
          source: "hackernews",
          category: i < 20 ? "dsa" : "system-design",
          score: 300 - i,
        }),
      );
      const result = tulmekRank(articles, now, new Set(), {});
      const first15 = result.slice(0, 15);
      const sdInFirst15 = first15.filter((a) => a.category === "system-design").length;
      expect(sdInFirst15).toBeGreaterThan(0);
    });

    it("MMR degrades gracefully for small feeds (≤1 article)", () => {
      const single = makeArticle({ id: "only" });
      expect(tulmekRank([single], now, new Set(), {})).toHaveLength(1);
      expect(tulmekRank([], now, new Set(), {})).toHaveLength(0);
    });
  });

  // ── Topic trending (TCRA v4) ──────────────────────────────────────────────────

  describe("topic trending bonus", () => {
    it("articles without topics receive no topic trending bonus", () => {
      // Both articles identical; the one with topics should rank higher only because
      // of semantic richness — so we isolate by also stripping enrichment fields.
      // When topics are empty, topicTrendingBonus returns 0 with no errors.
      const article = makeArticle({
        id: "no-topics",
        topics: [],
        difficulty: "",
        sentiment: "",
        actionability: 0,
      });
      const result = tulmekRank([article], now, new Set(), {});
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe("no-topics");
    });

    it("article in a multi-source trending topic ranks above an identical article not in that topic", () => {
      // "binary search" is discussed by 4 distinct sources in the last 48 h.
      // The article that covers it should receive a positive topicTrending boost.
      const recentMs = now - 10 * 60 * 60 * 1000; // 10 h ago

      // 4 supporting articles from different sources covering "binary search"
      const supporters = (
        [
          "hackernews",
          "reddit",
          "leetcode",
          "devto",
        ] as FeedArticle["source"][]
      ).map((source, i) =>
        makeArticle({
          id: `support-${i}`,
          source,
          topics: ["binary search"],
          publishedAt: new Date(recentMs).toISOString() as ISOTimestamp,
          score: 50,
        }),
      );

      const trending = makeArticle({
        id: "trending-topic",
        source: "github",
        topics: ["binary search"],
        publishedAt: new Date(recentMs).toISOString() as ISOTimestamp,
        score: 100,
        difficulty: "",
        sentiment: "",
        actionability: 0,
      });

      const plain = makeArticle({
        id: "plain-topic",
        source: "github",
        topics: ["radix sort"], // only 1 source → no trending signal
        publishedAt: new Date(recentMs).toISOString() as ISOTimestamp,
        score: 100,
        difficulty: "",
        sentiment: "",
        actionability: 0,
      });

      const result = tulmekRank([plain, ...supporters, trending], now, new Set(), {});
      const trendingPos = result.findIndex((a) => a.id === "trending-topic");
      const plainPos = result.findIndex((a) => a.id === "plain-topic");
      expect(trendingPos).toBeLessThan(plainPos);
    });

    it("topic trending degrades gracefully when all articles are older than 48 h", () => {
      // Articles published 72 h ago should fall outside the 48 h window — no bonus.
      const oldMs = now - 72 * 60 * 60 * 1000;
      const articles = (["hackernews", "reddit", "leetcode"] as FeedArticle["source"][]).map(
        (source, i) =>
          makeArticle({
            id: `old-${i}`,
            source,
            topics: ["hash map"],
            publishedAt: new Date(oldMs).toISOString() as ISOTimestamp,
            score: 100,
          }),
      );
      // Should not throw and must return all articles
      const result = tulmekRank(articles, now, new Set(), {});
      expect(result).toHaveLength(3);
    });

    it("topic case-insensitivity — 'Hash Map' and 'hash map' are the same trend signal", () => {
      const recentMs = now - 5 * 60 * 60 * 1000;
      const articles = [
        makeArticle({
          id: "upper",
          source: "hackernews",
          topics: ["Hash Map"],
          publishedAt: new Date(recentMs).toISOString() as ISOTimestamp,
          score: 100,
        }),
        makeArticle({
          id: "lower",
          source: "reddit",
          topics: ["hash map"],
          publishedAt: new Date(recentMs).toISOString() as ISOTimestamp,
          score: 100,
        }),
        makeArticle({
          id: "mixed",
          source: "leetcode",
          topics: ["HASH MAP"],
          publishedAt: new Date(recentMs).toISOString() as ISOTimestamp,
          score: 100,
        }),
      ];
      // getTrendingTopics should aggregate all three under a single canonical key
      const trending = getTrendingTopics(articles, now, 10);
      const hashMap = trending.find((t) => t.topic === "hash map");
      expect(hashMap).toBeDefined();
      expect(hashMap!.sourceCount).toBe(3);
      expect(hashMap!.articleCount).toBe(3);
    });
  });

  // ── getTrendingTopics ─────────────────────────────────────────────────────────

  describe("getTrendingTopics", () => {
    it("returns empty array when no articles have topics", () => {
      const articles = [
        makeArticle({ id: "a1", topics: [] }),
        makeArticle({ id: "a2", topics: [] }),
      ];
      expect(getTrendingTopics(articles, now)).toEqual([]);
    });

    it("filters out topics discussed by only one source", () => {
      const recentMs = now - 5 * 60 * 60 * 1000;
      const articles = [
        makeArticle({
          id: "only-one",
          source: "reddit",
          topics: ["singleton topic"],
          publishedAt: new Date(recentMs).toISOString() as ISOTimestamp,
        }),
      ];
      expect(getTrendingTopics(articles, now)).toEqual([]);
    });

    it("includes topics discussed by 2+ sources", () => {
      const recentMs = now - 5 * 60 * 60 * 1000;
      const articles = [
        makeArticle({
          id: "a1",
          source: "reddit",
          topics: ["dynamic programming"],
          publishedAt: new Date(recentMs).toISOString() as ISOTimestamp,
        }),
        makeArticle({
          id: "a2",
          source: "hackernews",
          topics: ["dynamic programming"],
          publishedAt: new Date(recentMs).toISOString() as ISOTimestamp,
        }),
      ];
      const trending = getTrendingTopics(articles, now);
      expect(trending).toHaveLength(1);
      expect(trending[0]!.topic).toBe("dynamic programming");
      expect(trending[0]!.sourceCount).toBe(2);
      expect(trending[0]!.articleCount).toBe(2);
    });

    it("respects the limit parameter", () => {
      const recentMs = now - 5 * 60 * 60 * 1000;
      // Create 6 topics each covered by 2 sources
      const sources = ["hackernews", "reddit"] as FeedArticle["source"][];
      const topics = ["dp", "bfs", "dfs", "greedy", "backtracking", "sliding window"];
      const articles = topics.flatMap((topic, i) =>
        sources.map((source, j) =>
          makeArticle({
            id: `art-${i}-${j}`,
            source,
            topics: [topic],
            publishedAt: new Date(recentMs).toISOString() as ISOTimestamp,
            score: 100,
          }),
        ),
      );
      const trending = getTrendingTopics(articles, now, 3);
      expect(trending).toHaveLength(3);
    });

    it("sorts by sourceCount descending then articleCount descending", () => {
      const recentMs = now - 5 * 60 * 60 * 1000;
      const makeSrc = (id: string, src: FeedArticle["source"], topic: string) =>
        makeArticle({
          id,
          source: src,
          topics: [topic],
          publishedAt: new Date(recentMs).toISOString() as ISOTimestamp,
          score: 100,
        });
      const articles = [
        // "system design" covered by 3 sources
        makeSrc("sd1", "reddit", "system design"),
        makeSrc("sd2", "hackernews", "system design"),
        makeSrc("sd3", "leetcode", "system design"),
        // "graphs" covered by 2 sources but 4 articles
        makeSrc("g1", "reddit", "graphs"),
        makeSrc("g2", "hackernews", "graphs"),
        makeSrc("g3", "reddit", "graphs"),
        makeSrc("g4", "hackernews", "graphs"),
        // "trees" covered by 2 sources and 2 articles
        makeSrc("t1", "devto", "trees"),
        makeSrc("t2", "youtube", "trees"),
      ];
      const trending = getTrendingTopics(articles, now, 10);
      // system design (3 sources) should be first
      expect(trending[0]!.topic).toBe("system design");
      // graphs (2 sources, 4 articles) before trees (2 sources, 2 articles)
      expect(trending[1]!.topic).toBe("graphs");
      expect(trending[2]!.topic).toBe("trees");
    });

    it("excludes articles outside the 48-hour window", () => {
      const oldMs = now - 50 * 60 * 60 * 1000; // 50 h ago
      const articles = [
        makeArticle({
          id: "old1",
          source: "reddit",
          topics: ["stale topic"],
          publishedAt: new Date(oldMs).toISOString() as ISOTimestamp,
        }),
        makeArticle({
          id: "old2",
          source: "hackernews",
          topics: ["stale topic"],
          publishedAt: new Date(oldMs).toISOString() as ISOTimestamp,
        }),
      ];
      expect(getTrendingTopics(articles, now)).toEqual([]);
    });

    it("returns empty array when articles list is empty", () => {
      expect(getTrendingTopics([], now)).toEqual([]);
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
