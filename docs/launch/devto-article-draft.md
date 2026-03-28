# How I Built an AI-Powered Content Ranking Algorithm for Interview Prep

---
title: How I Built an AI-Powered Content Ranking Algorithm for Interview Prep
published: false
description: Deep dive into TCRA — a multi-signal ranking algorithm that uses exponential decay, per-source normalization, trending detection, and MMR diversity to rank 931 interview prep articles from 8 sources.
tags: algorithms, ai, typescript, webdev
cover_image:
---

If you're preparing for tech interviews, you already know the problem: the best content is scattered across Reddit, Hacker News, LeetCode, DEV, Medium, YouTube, GitHub, and newsletters. You can spend more time *finding* the right article than actually learning from it.

I built [TULMEK](https://tulmek.vercel.app) — an open-source career intelligence platform that aggregates 931 articles from 8 sources and ranks them using a custom algorithm called **TCRA** (Time-Corrected Relevance Algorithm). It runs entirely client-side with zero backend. No auth, no database, no server costs.

This post walks through the ranking system: every signal, every weight, every design decision — with real TypeScript from the codebase.

## Why Naive Ranking Fails for Aggregated Content

Before building TCRA, I tried every obvious approach. Each one broke in a predictable way.

**Sort by upvotes?** Reddit posts routinely hit 500+ upvotes while a deeply technical LeetCode editorial might have 12. Source bias completely distorts engagement metrics. A mediocre "I got into FAANG" post outranks a precise analysis of Dijkstra's algorithm variants.

**Sort by date?** Chronological ordering has zero quality signal. A new "hello world" tutorial outranks a timeless system design guide. You end up scrolling past noise to find signal.

**Keyword matching?** It misses semantic nuance. An article titled "My Amazon Interview" could be about warehouse jobs or L5 SDE loops. Keywords can't distinguish between them — and they can't tell you whether the content is actionable or purely anecdotal.

I needed a system that weighs *multiple signals simultaneously*, normalizes across sources, and actively prevents any single source from dominating the feed.

## TCRA v3: Time-Corrected Relevance Algorithm

TCRA computes a composite score for every article using this formula:

```
TulmekScore = CRS * FreshnessDecay * (1 + CombinedTrending) * PersonalizationBoost
```

Then it reranks the sorted results using Maximal Marginal Relevance (MMR) to inject diversity. Let me break down each component.

### 1. Content Relevance Score (CRS) — 6 Weighted Signals

The CRS is a weighted sum of six signals, each normalized to [0, 1]:

```typescript
function computeCRS(
  article: FeedArticle,
  sourcePercentiles: Map<string, number[]>,
): number {
  return (
    0.25 * categoryConfidence(article) +
    0.20 * normalizedEngagement(article, sourcePercentiles) +
    0.15 * discussionDepth(article) +
    0.15 * sourceCredibility(article) +
    0.10 * contentRichness(article) +
    0.15 * semanticRichness(article)
  );
}
```

Here's what each signal does:

**Category Relevance (0.25)** — Not all content is equally valuable for interview prep. DSA and system design articles get a weight of 1.0, while general content gets 0.3. This maps directly to what matters in a technical interview loop.

```typescript
const CATEGORY_WEIGHT = {
  dsa: 1.0,
  "system-design": 1.0,
  behavioral: 0.95,
  "interview-experience": 0.9,
  "ai-ml": 0.85,
  compensation: 0.7,
  career: 0.6,
  general: 0.3,
} as const satisfies Record<HubCategory, number>;
```

**Normalized Engagement (0.20)** — This is the key insight that prevents source bias. Instead of comparing raw upvotes across sources, I compute each article's *percentile rank within its own source*. A Reddit post in the 90th percentile of Reddit scores is equivalent to a LeetCode discussion in the 90th percentile of LeetCode scores. The percentile is then passed through a sigmoid for smooth compression:

```typescript
function normalizedEngagement(
  article: FeedArticle,
  sourcePercentiles: Map<string, number[]>,
): number {
  const sourceScores = sourcePercentiles.get(article.source);
  if (!sourceScores || sourceScores.length === 0) return 0.5;

  let rank = 0;
  for (const s of sourceScores) {
    if (article.score > s) rank++;
  }
  const percentile = rank / sourceScores.length;
  return sigmoid(6 * (percentile - 0.5));
}
```

**Discussion Depth (0.15)** — Comment count alone is noisy. A viral meme gets lots of comments with no substance. Discussion depth combines log-scaled volume with the comment-to-score ratio, which captures *how much discussion an article generates relative to its popularity*:

```typescript
function discussionDepth(article: FeedArticle): number {
  const ratio = article.commentCount / Math.max(1, article.score);
  const volume = Math.log(1 + article.commentCount) / Math.log(1 + 1000);
  const depth = Math.min(1, ratio * 10);
  return 0.6 * volume + 0.4 * depth;
}
```

**Source Credibility (0.15)** — A baseline trust score per source. LeetCode (0.9) and newsletters from known authors (0.88) rank higher than Medium (0.65) or Reddit (0.6), reflecting the general signal-to-noise ratio of each platform.

**Content Richness (0.10)** — Regex-based detection of high-value signals in the title and excerpt: code snippets, complexity analysis, company mentions, specific interview round details, and outcome data. An article mentioning "O(n log n)" and "Google onsite" scores higher than a generic career tip.

**Semantic Richness (0.15)** — Derived from AI enrichment fields. Articles with extracted topics, difficulty levels, sentiment, and high actionability scores get boosted. This degrades gracefully to 0 for non-enriched articles, so the system works with or without AI.

### 2. Freshness Decay — Per-Category Exponential with Floors

Not all content ages at the same rate. A DSA article about binary search is evergreen. A compensation post about Q1 2026 offers is stale in weeks.

TCRA uses per-category exponential decay with a floor (minimum score that prevents good old content from vanishing entirely):

```typescript
function freshnessDecay(article: FeedArticle, nowMs: number): number {
  const ageHours =
    (nowMs - new Date(article.publishedAt).getTime()) / MS_PER_HOUR;
  let halfLife = HALF_LIVES[article.category] ?? 14 * 24;
  const floor = DECAY_FLOORS[article.category] ?? 0.05;

  return floor + (1 - floor) * Math.pow(2, -ageHours / halfLife);
}
```

The half-lives span three orders of magnitude:

| Category | Half-Life | Floor | Rationale |
|---|---|---|---|
| DSA | 720 days | 0.40 | Algorithms don't change |
| Behavioral | 360 days | 0.35 | Leadership principles are stable |
| System Design | 180 days | 0.25 | Principles stable, stacks shift |
| Career | 90 days | 0.10 | Job market advice evolves |
| AI/ML | 45 days | 0.10 | LLM landscape changes monthly |
| Interview Experience | 30 days | 0.05 | Hiring loops change quarterly |
| Compensation | 14 days | 0.03 | TC data goes stale fast |

There's also adaptive decay: salary-related content (`$120k`, `total comp`, `offer letter`) gets its half-life capped at 14 days regardless of category, and "just happened" posts (`this week`, `today I`, `got my offer`) cap at 21 days.

### 3. Trending Detection — Velocity + Multi-Source Convergence

TCRA detects trending content through two complementary signals, combined at 60/40 weighting.

**Article-level velocity** measures how fast an article accumulates engagement relative to its age. It compares the article's score-per-hour against the median velocity for its source, then applies a 12-hour recency amplifier so only fresh bursts get boosted:

```typescript
function trendingBonus(
  article: FeedArticle,
  sourceMedianVelocities: Map<string, number>,
  nowMs: number,
): number {
  const ageHours =
    (nowMs - new Date(article.publishedAt).getTime()) / MS_PER_HOUR;
  if (ageHours > 72) return 0; // Only recent articles can trend

  const velocity = article.score / Math.max(1, ageHours);
  const sourceMedian = sourceMedianVelocities.get(article.source) ?? 1;
  const velocityRatio = velocity / Math.max(0.01, sourceMedian);

  const commentVelocity = article.commentCount / Math.max(1, ageHours);
  const burstScore = Math.sqrt(velocityRatio * Math.max(1, commentVelocity));
  const recencyAmplifier = Math.pow(2, -ageHours / 12);

  return Math.min(2.0, burstScore * recencyAmplifier * 0.3);
}
```

**Topic-level convergence** is the more interesting signal. It detects when *multiple sources* start discussing the same topic within a 48-hour window. If "system design interviews at OpenAI" appears on Reddit, Hacker News, and a newsletter simultaneously, that convergence is a strong signal that something meaningful is happening:

```typescript
// Multi-source convergence scoring
const sourceSignal = Math.min(1.0, (sourceCount - 1) / 3);
const volumeSignal = Math.min(1.0, Math.log2(1 + articleCount) / Math.log2(1 + 10));
const bonus = 0.6 * sourceSignal + 0.4 * volumeSignal;
```

A topic needs at least 2 distinct sources to register as trending. At 4+ sources, it hits maximum convergence signal.

### 4. MMR Diversity Reranking

After scoring, the top results tend to cluster: five DSA articles from LeetCode, then three system design posts from Hacker News. This is technically correct ranking but terrible user experience.

TCRA uses Maximal Marginal Relevance (MMR) to rerank the top 50 results with a lambda of 0.7 — 70% relevance, 30% diversity:

```typescript
function mmrDiverseRerank(
  articles: FeedArticle[],
  scores: Map<string, number>,
  lambda: number = 0.7,
  topK: number = 50,
): FeedArticle[] {
  // For each position, select the article that maximizes:
  // MMR(a) = lambda * score(a) - (1 - lambda) * max_similarity_to_selected(a)

  // Structural similarity uses category + source + domain overlap
  // as a proxy for embedding similarity
  let sim = 0;
  if (a.category === sel.category) sim += 0.5;
  if (a.source === sel.source) sim += 0.3;
  if (a.domain === sel.domain) sim += 0.2;
  // ...
}
```

Without embeddings available at render time, I use structural similarity (category, source, domain) as a proxy. This is fast, deterministic, and effective. The remaining articles after position 50 keep their original score order.

### 5. Personalization — Implicit Signals, No Tracking

TCRA builds a user profile entirely from local reading behavior — articles read and bookmarked. No server, no cookies, no tracking pixels.

Bookmarks are weighted 3x compared to reads. The profile goes through Laplace smoothing (adding 1 to each category) to avoid cold-start extremes, and personalization strength ramps from 0 to 1 over the first 20 interactions:

```typescript
const strength = Math.min(1.0, profile.readCount / 20);
```

There's also a 10% epsilon-greedy exploration mechanism that injects articles from *underexplored* categories into the feed. If you've only been reading DSA content, it will surface system design and behavioral articles to prevent filter bubbles.

## The AI Enrichment Pipeline

Raw articles from APIs come with titles, scores, and comments — but no semantic understanding. TCRA's `semanticRichness` signal needs richer data.

I built a unified enrichment pipeline using Google's Gemini 2.5 Flash-Lite model. A single API call per batch of 20 articles returns six fields:

- **Category** (AI classification replacing keyword matching)
- **Summary** (2-3 sentences focused on interview prep value)
- **Topics** (specific sub-topics like "distributed caching", "TC negotiation")
- **Difficulty** (beginner / intermediate / advanced)
- **Sentiment** (positive / negative / neutral)
- **Actionability** (0.0-1.0 scale)

The pipeline uses structured JSON output with a Zod-like schema enforced at the API level, so parsing never fails. An enrichment cache prevents re-processing articles whose titles haven't changed between runs.

Cost: approximately $3/month for 931 articles refreshed every 3 hours. Flash-Lite is absurdly cheap for structured extraction.

## Results

The system currently ranks **931 unique articles** from **8 sources** across **8 categories**, refreshed every 3 hours via GitHub Actions.

Some numbers from the live system:

- **312 articles** from Reddit, **179** from newsletters, **163** from DEV, **122** from Hacker News — yet no single source dominates the feed thanks to per-source normalization and MMR
- **74 tests** covering all ranking signals, edge cases, and the diversity reranker
- **Cross-source corroboration** identifies articles where multiple sources discuss the same company, adding a trust signal
- **Topic trending** surfaces emerging interview topics before they go viral on any single platform

The whole ranking algorithm is ~640 lines of TypeScript with zero dependencies. It runs client-side in under 50ms for the full corpus.

## What I Learned

**Diversity is as important as relevance.** Pure relevance ranking creates terrible feeds. Users don't want five articles about the same topic in a row, even if those are the five "best" articles. MMR reranking was the single biggest UX improvement.

**Per-source normalization is non-negotiable.** The moment you aggregate from sources with different engagement scales, raw scores become meaningless. Percentile ranking within each source is simple and effective.

**AI enrichment provides signals keyword matching can't.** Keyword classification gets you 70% of the way there. The last 30% — distinguishing an "Amazon warehouse" article from an "Amazon SDE L5" article, or scoring actionability — requires language understanding. At $3/month, it's a no-brainer.

**Exponential decay with floors > linear decay.** Floors prevent the "old but gold" problem where a canonical system design article disappears because it's three months old. Different half-lives per category model how quickly knowledge actually ages in each domain.

**Client-side ranking is underrated.** With no server, there's no latency, no infrastructure cost, and no privacy concerns. The 931-article corpus fits comfortably in a single JSON file, and ranking completes in milliseconds.

## Try It

- **Live**: [tulmek.vercel.app](https://tulmek.vercel.app)
- **Source**: [github.com/coast-guide-sahil/tulmek](https://github.com/coast-guide-sahil/tulmek)
- **License**: MIT — contributions welcome

The ranking algorithm lives in [`packages/core/src/domain/ranking.ts`](https://github.com/coast-guide-sahil/tulmek/blob/main/packages/core/src/domain/ranking.ts). Every weight, every half-life, and every design decision is in that single file.

If you're building a content aggregator, I'd love to hear what ranking approaches work for your domain. And if you're prepping for interviews — give the feed a try and let me know if the ranking feels right.

---

*TULMEK is built with Next.js 16, Tauri v2, and React Native. The core ranking logic is shared across all three platforms via a zero-dependency TypeScript package.*
