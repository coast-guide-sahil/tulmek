/**
 * TULMEK CORE RANKING ALGORITHM (TCRA)
 *
 * Multi-signal ranking system that produces interview-prep-optimized
 * content ordering. Runs entirely client-side with zero backend dependency.
 *
 * Components:
 * 1. Content Relevance Score (CRS) — multi-signal composite
 * 2. Freshness Decay — per-category exponential decay with floors
 * 3. Source Diversity — sqrt-proportional quota interleaving
 * 4. Trending Detection — velocity-based burst detection
 * 5. Personalization — client-side preference profiling
 */

import type { FeedArticle, HubCategory, FeedSourceId } from "./article";

// Time conversion constants (avoid magic numbers)
const MS_PER_HOUR = 3_600_000;
const DIVERSITY_WINDOW = 12;
const TRENDING_WINDOW_HOURS = 168; // 7 days

// ── Category weights: how relevant is this category to interview prep ──

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

// ── Freshness decay: per-category half-lives (hours) and floors ──

const HALF_LIVES = {
  dsa: 720 * 24,              // Evergreen — problems don't change
  "system-design": 180 * 24,  // Principles stable, tech stacks shift
  "ai-ml": 45 * 24,           // Moves extremely fast (LLM landscape monthly)
  behavioral: 360 * 24,       // Leadership principles don't change
  "interview-experience": 30 * 24, // Hiring loops change each quarter
  compensation: 14 * 24,      // TC data stale in weeks
  career: 90 * 24,
  general: 14 * 24,
} as const satisfies Record<HubCategory, number>;

const DECAY_FLOORS = {
  dsa: 0.4,
  "system-design": 0.25,
  "ai-ml": 0.1,
  behavioral: 0.35,
  "interview-experience": 0.05,
  compensation: 0.03,
  career: 0.1,
  general: 0.05,
} as const satisfies Record<HubCategory, number>;

// ── Source credibility baselines ──

const SOURCE_CREDIBILITY = {
  hackernews: 0.85,
  leetcode: 0.9,
  github: 0.8,
  devto: 0.75,
  youtube: 0.7,
  medium: 0.65,
  reddit: 0.6,
  newsletter: 0.88,
  glassdoor: 0.82,
} as const satisfies Record<FeedSourceId, number>;

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

// ── Semantic richness from AI enrichment data ──

/**
 * Boosts articles that have been enriched with specific AI-extracted signals.
 * Degrades gracefully to 0 when enrichment fields are empty.
 */
function semanticRichness(article: FeedArticle): number {
  let score = 0;
  // Topics specificity (from AI enrichment)
  if (article.topics && article.topics.length > 0) score += 0.3;
  if (article.topics && article.topics.length >= 3) score += 0.2;
  // Difficulty signal (enriched articles have this)
  if (article.difficulty) score += 0.15;
  // Sentiment signal
  if (article.sentiment) score += 0.1;
  // Actionability
  if (article.actionability > 0.5) score += 0.25;
  return Math.min(1.0, score);
}

// ── Interview-prep content richness (replaces title relevance placeholder) ──

const COMPANY_REGEX = /\b(google|amazon|meta|apple|microsoft|netflix|uber|airbnb|stripe|coinbase|lyft|nvidia|tesla|openai|anthropic|palantir|databricks|snowflake|linkedin|salesforce|oracle|adobe|bloomberg|jpmorgan|goldman|citadel|jane street|flipkart|swiggy|atlassian|shopify|spotify|dropbox|doordash|pinterest|samsung|ibm|paypal|cloudflare|datadog|mongodb|vercel|github)\b/i;

function contentRichness(article: FeedArticle): number {
  let score = 0;
  const text = `${article.title} ${article.excerpt}`.toLowerCase();

  // Code presence — articles with solutions/implementations are more actionable
  if (/```|solution|implement|function\s|def\s|class\s|algorithm/.test(text)) score += 0.25;
  // Complexity analysis — signals depth
  if (/o\([^)]*\)|time complex|space complex|big o|optimal/.test(text)) score += 0.2;
  // Company mentions — specific company context is high-value
  if (COMPANY_REGEX.test(text)) score += 0.2;
  // Interview round specificity — actionable stage detail
  if (/phone screen|onsite|coding round|system design round|hiring manager|bar raiser/.test(text)) score += 0.15;
  // Outcome + compensation data — real experiences
  if (/got (the )?offer|rejected|accepted|tc[\s:]|\$\d{2,3}k|lpa|ctc/.test(text)) score += 0.2;

  return Math.min(1.0, score);
}

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

// ── 2. Freshness Decay ──

function freshnessDecay(article: FeedArticle, nowMs: number): number {
  const ageHours =
    (nowMs - new Date(article.publishedAt).getTime()) / MS_PER_HOUR;
  let halfLife = HALF_LIVES[article.category] ?? 14 * 24;
  const floor = DECAY_FLOORS[article.category] ?? 0.05;

  // Adaptive decay: salary data and "just happened" posts decay faster
  const text = `${article.title} ${article.excerpt}`.toLowerCase();
  if (/\$\d|tc[\s:]|total comp|salary|offer letter|package/.test(text)) {
    halfLife = Math.min(halfLife, 14 * 24);
  }
  if (/just interviewed|this week|today i|yesterday|got my offer/.test(text)) {
    halfLife = Math.min(halfLife, 21 * 24);
  }

  return floor + (1 - floor) * Math.pow(2, -ageHours / halfLife);
}

// ── 3. Trending Detection ──

function trendingBonus(
  article: FeedArticle,
  sourceMedianVelocities: Map<string, number>,
  nowMs: number,
): number {
  const ageHours =
    (nowMs - new Date(article.publishedAt).getTime()) / MS_PER_HOUR;
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

function diverseRerank(articles: FeedArticle[], windowSize = DIVERSITY_WINDOW): FeedArticle[] {
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

      // Source diversity
      const sourceInWindow = windowSlice.filter(
        (a) => a.source === article.source,
      ).length;
      const quota = quotas.get(article.source) ?? 1;
      const sourceOverrep = sourceInWindow / quota;
      const sourceMult =
        sourceOverrep <= 1 ? 1.0 : sourceOverrep <= 1.5 ? 0.85 : sourceOverrep <= 2 ? 0.6 : 0.3;

      // Category diversity — don't show 5 DSA articles in a row
      const catInWindow = windowSlice.filter(
        (a) => a.category === article.category,
      ).length;
      const catMult = catInWindow <= 2 ? 1.0 : catInWindow <= 3 ? 0.85 : 0.6;

      const diversityMult = sourceMult * catMult;

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

// ── 5b. MMR-Inspired Diversity Reranking ──

/**
 * Maximal Marginal Relevance reranking.
 *
 * For each output position, selects the article that maximises:
 *   MMR(a) = lambda * score(a) - (1 - lambda) * max_similarity_to_selected(a)
 *
 * Similarity is category + source + domain overlap (proxy for embedding
 * similarity when embeddings are not available at runtime).
 *
 * lambda = 0.7 → 70% relevance, 30% diversity push.
 * topK limits how many positions use MMR selection; remaining articles are
 * appended in their original score order.
 */
function mmrDiverseRerank(
  articles: FeedArticle[],
  scores: Map<string, number>,
  lambda: number = 0.7,
  topK: number = 50,
): FeedArticle[] {
  if (articles.length <= 1) return articles;

  const remaining = new Set(articles.map((_, i) => i));
  const selected: number[] = [];

  // First slot: highest-scoring article (pure relevance)
  let bestFirst = -1, bestScore = -Infinity;
  for (const idx of remaining) {
    const s = scores.get(articles[idx]!.id) ?? 0;
    if (s > bestScore) { bestScore = s; bestFirst = idx; }
  }
  selected.push(bestFirst);
  remaining.delete(bestFirst);

  const selectCount = Math.min(topK, articles.length);
  while (selected.length < selectCount && remaining.size > 0) {
    let bestIdx = -1, bestMMR = -Infinity;
    for (const idx of remaining) {
      const a = articles[idx]!;
      const relevance = scores.get(a.id) ?? 0;

      // Structural similarity to the last 10 selected articles
      let maxSim = 0;
      for (const selIdx of selected.slice(-10)) {
        const sel = articles[selIdx]!;
        let sim = 0;
        if (a.category === sel.category) sim += 0.5;
        if (a.source === sel.source) sim += 0.3;
        if (a.domain === sel.domain) sim += 0.2;
        maxSim = Math.max(maxSim, sim);
      }

      const mmr = lambda * relevance - (1 - lambda) * maxSim;
      if (mmr > bestMMR) { bestMMR = mmr; bestIdx = idx; }
    }
    if (bestIdx >= 0) { selected.push(bestIdx); remaining.delete(bestIdx); }
    else break;
  }

  const result = selected.map(i => articles[i]!);
  // Append remaining articles in their original (score-sorted) order
  const remainingArticles = [...remaining].map(i => articles[i]!);
  return [...result, ...remainingArticles];
}

// ── 6. Epsilon-Greedy Exploration ──

/**
 * Injects exploration slots to prevent filter bubbles.
 * Uses a seeded deterministic approach (no Math.random in render).
 */
function epsilonGreedyExplore(
  articles: FeedArticle[],
  profile: UserProfile,
  epsilon: number,
): FeedArticle[] {
  if (articles.length <= 20 || profile.readCount < 5) return articles;

  // Find underexplored categories (engagement < 0.3 average)
  const avgWeight = 1 / Object.keys(CATEGORY_WEIGHT).length;
  const underexplored = new Set(
    Object.keys(CATEGORY_WEIGHT).filter(
      (cat) => (profile.categoryWeights[cat] ?? avgWeight) < avgWeight * 0.7
    )
  );

  if (underexplored.size === 0) return articles;

  const result: FeedArticle[] = [];
  const explorationPool = articles.filter((a) => underexplored.has(a.category));
  let explorationIdx = 0;

  for (let i = 0; i < articles.length; i++) {
    // Every 1/epsilon slots, inject an exploration article
    if (
      i > 0 &&
      i % Math.round(1 / epsilon) === 0 &&
      explorationIdx < explorationPool.length
    ) {
      const exploreArticle = explorationPool[explorationIdx]!;
      // Only inject if not already in result
      if (!result.includes(exploreArticle)) {
        result.push(exploreArticle);
        explorationIdx++;
      }
    }
    // Add the ranked article if not already added via exploration
    if (!result.includes(articles[i]!)) {
      result.push(articles[i]!);
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
          (nowMs - new Date(a.publishedAt).getTime()) / MS_PER_HOUR <= TRENDING_WINDOW_HOURS,
      )
      .map(
        (a) =>
          a.score /
          Math.max(1, (nowMs - new Date(a.publishedAt).getTime()) / MS_PER_HOUR),
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

  // Build score map for MMR reranking
  const scoreMap = new Map<string, number>(scored.map((s) => [s.article.id, s.score]));

  // Apply MMR diversity reranking (replaces legacy diverseRerank)
  const sorted = scored.map((s) => s.article);
  const reranked = mmrDiverseRerank(sorted, scoreMap);

  // Epsilon-greedy exploration: 10% of slots go to underexplored categories
  // Prevents filter bubbles and helps discover new content areas
  return epsilonGreedyExplore(reranked, profile, 0.1);
}
