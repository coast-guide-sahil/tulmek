/**
 * TULMEK CORE RANKING ALGORITHM (TCRA)
 *
 * Proprietary multi-signal ranking system that produces interview-prep-optimized
 * content ordering. Runs entirely client-side with zero backend dependency.
 *
 * Components:
 * 1. Content Relevance Score (CRS) — multi-signal composite
 * 2. Freshness Decay — per-category exponential decay with floors
 * 3. Source Diversity — sqrt-proportional quota interleaving
 * 4. Trending Detection — velocity-based burst detection
 * 5. Personalization — client-side preference profiling
 */

import type { FeedArticle } from "@tulmek/core/domain";

// ── Category weights: how relevant is this category to interview prep ──

const CATEGORY_WEIGHT: Record<string, number> = {
  dsa: 1.0,
  "system-design": 1.0,
  behavioral: 0.95,
  "interview-experience": 0.9,
  "ai-ml": 0.85,
  compensation: 0.7,
  career: 0.6,
  general: 0.3,
};

// ── Freshness decay: per-category half-lives (hours) and floors ──

const HALF_LIVES: Record<string, number> = {
  dsa: 720 * 24,
  "system-design": 180 * 24,
  "ai-ml": 60 * 24,
  behavioral: 360 * 24,
  "interview-experience": 45 * 24,
  compensation: 30 * 24,
  career: 90 * 24,
  general: 14 * 24,
};

const DECAY_FLOORS: Record<string, number> = {
  dsa: 0.4,
  "system-design": 0.25,
  "ai-ml": 0.1,
  behavioral: 0.35,
  "interview-experience": 0.05,
  compensation: 0.03,
  career: 0.1,
  general: 0.05,
};

// ── Source credibility baselines ──

const SOURCE_CREDIBILITY: Record<string, number> = {
  hackernews: 0.85,
  leetcode: 0.9,
  github: 0.8,
  devto: 0.75,
  youtube: 0.7,
  medium: 0.65,
  reddit: 0.6,
};

// ── Helper functions ──

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

// ── 1. Content Relevance Score ──

function categoryConfidence(article: FeedArticle): number {
  const weight = CATEGORY_WEIGHT[article.category] ?? 0.3;
  // Higher weight categories get higher base relevance
  return weight;
}

function normalizedEngagement(
  article: FeedArticle,
  sourcePercentiles: Map<string, number[]>,
): number {
  const sourceScores = sourcePercentiles.get(article.source);
  if (!sourceScores || sourceScores.length === 0) return 0.5;

  // Find percentile position within source
  let rank = 0;
  for (const s of sourceScores) {
    if (article.score > s) rank++;
  }
  const percentile = rank / sourceScores.length;

  // Sigmoid compression
  return sigmoid(6 * (percentile - 0.5));
}

function discussionDepth(article: FeedArticle): number {
  const ratio = article.commentCount / Math.max(1, article.score);
  const volume = Math.log(1 + article.commentCount) / Math.log(1 + 1000);
  const depth = Math.min(1, ratio * 10);
  return 0.6 * volume + 0.4 * depth;
}

function sourceCredibility(article: FeedArticle): number {
  return SOURCE_CREDIBILITY[article.source] ?? 0.5;
}

function computeCRS(
  article: FeedArticle,
  sourcePercentiles: Map<string, number[]>,
): number {
  return (
    0.30 * categoryConfidence(article) +
    0.25 * normalizedEngagement(article, sourcePercentiles) +
    0.20 * discussionDepth(article) +
    0.15 * sourceCredibility(article) +
    0.10 * 0.5 // Title relevance placeholder (would need lexicon)
  );
}

// ── 2. Freshness Decay ──

function freshnessDecay(article: FeedArticle, nowMs: number): number {
  const ageHours =
    (nowMs - new Date(article.publishedAt).getTime()) / 3600000;
  const halfLife = HALF_LIVES[article.category] ?? 14 * 24;
  const floor = DECAY_FLOORS[article.category] ?? 0.05;

  return floor + (1 - floor) * Math.pow(2, -ageHours / halfLife);
}

// ── 3. Trending Detection ──

function trendingBonus(
  article: FeedArticle,
  sourceMedianVelocities: Map<string, number>,
  nowMs: number,
): number {
  const ageHours =
    (nowMs - new Date(article.publishedAt).getTime()) / 3600000;
  if (ageHours > 72) return 0;

  const velocity = article.score / Math.max(1, ageHours);
  const sourceMedian = sourceMedianVelocities.get(article.source) ?? 1;
  const velocityRatio = velocity / Math.max(0.01, sourceMedian);

  const commentVelocity = article.commentCount / Math.max(1, ageHours);
  // Use velocity ratio alone (comment velocity needs source median too)
  const burstScore = Math.sqrt(velocityRatio * Math.max(1, commentVelocity));

  const recencyAmplifier = Math.pow(2, -ageHours / 12);

  return Math.min(2.0, burstScore * recencyAmplifier * 0.3);
}

// ── 4. Personalization ──

interface UserProfile {
  categoryWeights: Record<string, number>;
  readCount: number;
}

function buildUserProfile(
  articles: FeedArticle[],
  readIds: Set<string>,
  bookmarks: Record<string, unknown>,
): UserProfile {
  const categoryWeights: Record<string, number> = {};
  let totalWeight = 0;

  for (const article of articles) {
    let weight = 0;
    if (readIds.has(article.id)) weight += 1;
    if (article.id in bookmarks) weight += 3;
    if (weight > 0) {
      categoryWeights[article.category] =
        (categoryWeights[article.category] ?? 0) + weight;
      totalWeight += weight;
    }
  }

  // Laplace smoothing
  const categories = Object.keys(CATEGORY_WEIGHT);
  for (const cat of categories) {
    categoryWeights[cat] = ((categoryWeights[cat] ?? 0) + 1) / (totalWeight + categories.length);
  }

  return { categoryWeights, readCount: readIds.size };
}

function personalizationBoost(
  article: FeedArticle,
  profile: UserProfile,
  readIds: Set<string>,
): number {
  // Cold start: ramp up personalization strength
  const strength = Math.min(1.0, profile.readCount / 20);

  const avgWeight = 1 / Object.keys(CATEGORY_WEIGHT).length;
  const catBoost = (profile.categoryWeights[article.category] ?? avgWeight) / avgWeight;

  const readDemotion = readIds.has(article.id) ? 0.15 : 1.0;

  const rawBoost = catBoost * readDemotion;
  return 1 + strength * (rawBoost - 1);
}

// ── 5. Source Diversity ──

function diverseRerank(articles: FeedArticle[], windowSize = 12): FeedArticle[] {
  if (articles.length <= windowSize) return articles;

  // Compute sqrt-proportional quotas
  const sourceCounts = new Map<string, number>();
  for (const a of articles) {
    sourceCounts.set(a.source, (sourceCounts.get(a.source) ?? 0) + 1);
  }

  const total = articles.length;
  const sqrtProps = new Map<string, number>();
  let sumSqrt = 0;
  for (const [source, count] of sourceCounts) {
    const sp = Math.sqrt(count / total);
    sqrtProps.set(source, sp);
    sumSqrt += sp;
  }

  const quotas = new Map<string, number>();
  for (const [source, sp] of sqrtProps) {
    quotas.set(source, Math.max(1, Math.round(windowSize * sp / sumSqrt)));
  }

  // Greedy diversity-aware reranking
  const result: FeedArticle[] = [];
  const remaining = new Set(articles.map((_, i) => i));

  while (remaining.size > 0) {
    let bestIdx = -1;
    let bestScore = -Infinity;

    // Only check top candidates for performance
    let checked = 0;
    for (const idx of remaining) {
      if (checked >= 50) break;
      checked++;

      const article = articles[idx]!;
      const windowStart = Math.max(0, result.length - windowSize);
      const windowSlice = result.slice(windowStart);
      const sourceInWindow = windowSlice.filter(
        (a) => a.source === article.source,
      ).length;

      const quota = quotas.get(article.source) ?? 1;
      const overrep = sourceInWindow / quota;
      const diversityMult =
        overrep <= 1 ? 1.0 : overrep <= 1.5 ? 0.85 : overrep <= 2 ? 0.6 : 0.3;

      // Use array position as base score (articles already sorted by TulmekScore)
      const baseScore = articles.length - idx;
      const adjusted = baseScore * diversityMult;

      if (adjusted > bestScore) {
        bestScore = adjusted;
        bestIdx = idx;
      }
    }

    if (bestIdx >= 0) {
      result.push(articles[bestIdx]!);
      remaining.delete(bestIdx);
    } else {
      // Fallback: take first remaining
      const first = remaining.values().next().value as number;
      result.push(articles[first]!);
      remaining.delete(first);
    }
  }

  return result;
}

// ── Master Ranking Function ──

export function tulmekRank(
  articles: FeedArticle[],
  nowMs: number,
  readIds: Set<string>,
  bookmarks: Record<string, unknown>,
): FeedArticle[] {
  if (articles.length === 0) return articles;

  // Pre-compute source percentiles
  const sourcePercentiles = new Map<string, number[]>();
  const sourceArticles = new Map<string, FeedArticle[]>();
  for (const a of articles) {
    if (!sourceArticles.has(a.source)) sourceArticles.set(a.source, []);
    sourceArticles.get(a.source)!.push(a);
  }
  for (const [source, arts] of sourceArticles) {
    sourcePercentiles.set(
      source,
      arts.map((a) => a.score).sort((a, b) => a - b),
    );
  }

  // Pre-compute source median velocities for trending
  const sourceMedianVelocities = new Map<string, number>();
  for (const [source, arts] of sourceArticles) {
    const velocities = arts
      .filter(
        (a) =>
          (nowMs - new Date(a.publishedAt).getTime()) / 3600000 <= 168,
      )
      .map(
        (a) =>
          a.score /
          Math.max(1, (nowMs - new Date(a.publishedAt).getTime()) / 3600000),
      );
    sourceMedianVelocities.set(source, median(velocities));
  }

  // Build user profile
  const profile = buildUserProfile(articles, readIds, bookmarks);

  // Score all articles
  const scored = articles.map((article) => {
    const crs = computeCRS(article, sourcePercentiles);
    const freshness = freshnessDecay(article, nowMs);
    const trending = trendingBonus(article, sourceMedianVelocities, nowMs);
    const personal = personalizationBoost(article, profile, readIds);

    const tulmekScore = crs * freshness * (1 + trending) * personal;

    return { article, score: tulmekScore };
  });

  // Sort by TulmekScore
  scored.sort((a, b) => b.score - a.score);

  // Apply source diversity reranking
  const sorted = scored.map((s) => s.article);
  return diverseRerank(sorted);
}
