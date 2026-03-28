# ADR-003: AI Curation Architecture — Semantic Content Intelligence Pipeline

## Status
Proposed (2026-03-28)

## Context

TULMEK aggregates 1,107 articles from 12 sources into a static JSON feed, refreshed every 3 hours via GitHub Actions. Classification is keyword-based with optional Gemini 2.5 Flash-Lite override. Ranking uses the TCRA algorithm (multi-signal: engagement, freshness, source credibility, content richness, personalization, diversity). The app is offline-first (Next.js 16 SSG, Tauri, Expo) with no backend server and no database.

**The intelligence gap**: The current system cannot understand semantic meaning, detect emerging trends across sources, cluster related stories, generate cross-source insights, or adapt to the rapidly changing AI/interview landscape beyond simple keyword matching.

**Constraints**:
- No backend server. All AI runs at build time (GitHub Actions).
- `@tulmek/core` must remain zero-dependency.
- Budget: < $20/month total (Gemini Flash-Lite: $0.10/1M input, $0.40/1M output; Gemini Embedding 2: $0.20/1M input).
- Must work without AI (keyword fallback always available).
- All 3 platforms (web, desktop, mobile) consume the same static output.

---

## Decision

### High-Level Architecture

```
                    BUILD TIME (GitHub Actions, every 3h)
  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │  [12 Sources] ──> FETCH ──> DEDUPLICATE ──> AI ENRICHMENT PIPELINE │
  │                                                ├─ Classify          ���
  │                                                ├─ Summarize         │
  │                                                ├─ Extract entities  │
  │                                                ├─ Generate embed.   │
  │                                                ├─ Cluster stories   │
  │                                                ├─ Detect trends     │
  │                                                └─ Generate insights │
  │                                                         │           │
  │                                                         ▼           │
  │                                   ┌──────────────────────────┐      │
  │                                   │  STATIC OUTPUT FILES     │      │
  │                                   │  feed.json               ���      │
  │                                   │  metadata.json           │      │
  │                                   │  clusters.json           │      │
  │                                   │  trends.json             │      │
  │                                   │  insights.json           ���      │
  │                                   │  .embeddings-cache.json  │      │
  │                                   └──────────────────────────┘      │
  └─────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
                    RUNTIME (Static, Offline-first)
  ┌���────────────────────────────────────────────────────────────────────┐
  │  @tulmek/core (zero-dep)          @tulmek/content (static JSON)    │
  │  ├─ domain/ranking.ts (TCRA v2)   ├─ hub/feed.json                │
  │  ├��� domain/clusters.ts            ├─ hub/clusters.json             │
  │  ├─ domain/trends.ts              ├─ hub/trends.json               │
  │  └─ domain/insights.ts            └─ hub/insights.json             ���
  │                                                                     │
  │  apps/web  |  apps/desktop  |  apps/mobile                         │
  │  (all consume same @tulmek/content + @tulmek/core)                 │
  └────────────────────────────────────────────────────────────────────��┘
```

---

## 1. Semantic Content Pipeline

### 1.1 Pipeline Stages

The fetch script (`fetch-hub-content.ts`) evolves from a flat "fetch-classify-write" script into a staged pipeline. Each stage is a pure function that takes articles in and returns enriched articles out. Stages run sequentially because each depends on the previous.

```
FETCH (existing) ──> DEDUP (existing) ──> ENRICH ──> EMBED ──> CLUSTER ──> TREND ──> INSIGHT ──> WRITE
```

#### Stage 1: Fetch + Deduplicate (existing, no changes)
The 12-source fetch and SimHash dedup remain as-is.

#### Stage 2: AI Enrichment (evolves existing classify + summarize)
A single Gemini call per batch that returns structured JSON with all metadata at once, instead of separate classify and summarize calls. This halves the API calls.

```typescript
// Pipeline stage: enrich articles with semantic metadata
interface EnrichmentResult {
  category: HubCategory;
  confidence: number;
  summary: string;
  topics: string[];          // ["binary search", "sliding window", "amazon"]
  entities: EntityMention[];  // [{name: "Google", type: "company"}, ...]
  sentiment: "positive" | "neutral" | "negative";
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  audienceLevel: "student" | "junior" | "mid" | "senior" | "staff";
  actionability: number;     // 0-1: how actionable for interview prep
  contentType: "tutorial" | "experience" | "discussion" | "news" | "resource" | "question";
}

interface EntityMention {
  name: string;
  type: "company" | "technology" | "concept" | "person" | "role";
  normalized: string;  // canonical form: "Meta" not "Facebook", "DSA" not "data structures"
}
```

**Gemini prompt design** (single batch call, structured JSON output):

```typescript
async function enrichBatchWithGemini(
  articles: { title: string; excerpt: string; tags: string[]; source: string }[]
): Promise<EnrichmentResult[]> {
  const prompt = articles
    .map((a, i) => `[${i}] Title: ${a.title}\nSource: ${a.source}\nTags: ${a.tags.join(", ")}\nContent: ${a.excerpt.slice(0, 300)}`)
    .join("\n\n");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: `You are a career intelligence analyst. For each article, extract structured metadata.

${ENRICHMENT_SCHEMA_DESCRIPTION}

Articles:
${prompt}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: ENRICHMENT_JSON_SCHEMA,
    },
  });

  return JSON.parse(response.text ?? "[]");
}
```

**Cost estimate**: 1,100 articles x ~200 tokens/article = 220K input tokens per enrichment. At $0.10/1M input = $0.022 per run. 8 runs/day = $0.18/day = **$5.40/month**. With caching (only new articles need enrichment), actual cost drops to ~$1-2/month.

#### Stage 3: Embedding Generation

Generate semantic embeddings for each article using Gemini Embedding 2. Embeddings enable semantic similarity clustering, dedup, and search.

```typescript
async function generateEmbeddings(
  articles: { id: string; title: string; excerpt: string; category: string }[]
): Promise<Map<string, number[]>> {
  const BATCH_SIZE = 100; // Gemini supports batch embedding
  const embeddings = new Map<string, number[]>();

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    const texts = batch.map(a =>
      `[${a.category}] ${a.title}. ${a.excerpt.slice(0, 200)}`
    );

    const response = await ai.models.embedContent({
      model: "gemini-embedding-2-preview",
      contents: texts,
      config: { taskType: "CLUSTERING" },
    });

    for (let j = 0; j < batch.length; j++) {
      embeddings.set(batch[j]!.id, response.embeddings[j]!.values);
    }
  }

  return embeddings;
}
```

**Cost estimate**: 1,100 articles x ~100 tokens/article = 110K input tokens. At $0.20/1M = $0.022 per run. With aggressive caching (embeddings only regenerate when title/excerpt changes): **$0.50/month**.

**Storage**: Embeddings are NOT shipped to the client. They are stored in `.embeddings-cache.json` (gitignored) and used only at build time for clustering and trend detection. The cluster/trend outputs are lightweight JSON that ships to clients.

#### Stage 4: Story Clustering

Group semantically related articles using cosine similarity on embeddings. This replaces the current SimHash title dedup for near-duplicate detection and adds a new capability: story clustering (same event covered by multiple sources).

```typescript
interface StoryCluster {
  id: string;                    // "cluster:2026-03-28:google-interview-changes"
  label: string;                 // AI-generated: "Google Restructures Interview Process"
  summary: string;               // 2-3 sentence synthesis
  articleIds: string[];           // Articles in this cluster
  primaryArticleId: string;       // Highest-quality article (source credibility x engagement)
  sources: FeedSourceId[];        // Which sources covered this
  categories: HubCategory[];      // Covered categories
  size: number;                   // Number of articles
  avgSimilarity: number;          // Intra-cluster cohesion
  firstSeenAt: string;            // When earliest article appeared
  momentum: number;               // Rate of new articles joining (articles/hour)
}
```

**Algorithm** (build-time, runs in ~2 seconds for 1,100 articles):

```typescript
function clusterArticles(
  articles: FeedArticle[],
  embeddings: Map<string, number[]>,
  threshold: number = 0.82
): StoryCluster[] {
  // 1. Build similarity graph: cosine similarity between all pairs
  //    Optimization: only compute for articles within same/adjacent categories
  //    and within a 7-day window of each other

  // 2. Connected components with threshold
  //    Two articles are connected if cosine_similarity >= threshold
  //    Use Union-Find for O(n*alpha(n)) clustering

  // 3. Filter: only keep clusters with 2+ articles from 2+ sources
  //    Single-source clusters are not "stories", just related content

  // 4. For each cluster, call Gemini to generate a label + synthesis summary
  //    (batched: all clusters in one call)

  // 5. Compute momentum: articles_added_last_6h / total_articles

  return clusters;
}
```

Cosine similarity is a pure function that belongs in `@tulmek/core/domain/vectors.ts` (zero-dep, just math):

```typescript
// packages/core/src/domain/vectors.ts — zero dependencies
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    magA += a[i]! * a[i]!;
    magB += b[i]! * b[i]!;
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
}
```

#### Stage 5: Trend Detection

Detect emerging topics by analyzing the velocity of topic mentions across sources over time windows.

```typescript
interface TrendSignal {
  id: string;                     // "trend:2026-03-28:ai-screening-tools"
  topic: string;                  // "AI-Assisted Interview Screening"
  description: string;            // AI-generated 2-sentence explanation
  velocity: number;               // Articles/hour in last 24h
  acceleration: number;           // Change in velocity vs previous 24h
  sourceCount: number;            // Number of distinct sources mentioning this
  articleIds: string[];            // Related article IDs
  category: HubCategory;          // Primary category
  phase: "emerging" | "growing" | "peaking" | "declining";
  firstSeenAt: string;
  confidence: number;             // 0-1 signal strength
}
```

**Detection algorithm** (build-time):

```typescript
function detectTrends(
  articles: FeedArticle[],
  enrichments: Map<string, EnrichmentResult>,
  previousTrends: TrendSignal[],  // From last run's trends.json
  nowMs: number,
): TrendSignal[] {
  // 1. Extract all topics from enrichment metadata
  //    Build topic frequency map: topic -> [{articleId, publishedAt, source}]

  // 2. For each topic with 3+ mentions across 2+ sources:
  //    a. Compute velocity: mentions in last 24h / 24
  //    b. Compute acceleration: velocity_24h - velocity_previous_24h
  //    c. Source diversity: unique sources / total sources

  // 3. Score = velocity * sqrt(sourceCount) * acceleration_bonus
  //    acceleration_bonus = 1 + max(0, acceleration) * 2

  // 4. Determine phase by comparing to previous run:
  //    - "emerging": new topic not in previous trends
  //    - "growing": velocity increased
  //    - "peaking": velocity stable (within 10%)
  //    - "declining": velocity decreased

  // 5. Filter: confidence >= 0.5, at least 3 articles
  // 6. Return top 20 trends sorted by score

  return trends;
}
```

#### Stage 6: Insight Generation

Generate unique cross-source intelligence that no individual article provides.

```typescript
interface InsightReport {
  generatedAt: string;
  weekOf: string;                 // "2026-W13"

  // Cross-source story synthesis
  topStories: {
    headline: string;             // "3 Sources Report Google Changing L5 Interview Format"
    synthesis: string;            // 3-4 sentence analysis combining all sources
    sources: string[];            // Source names
    articleIds: string[];
    sentiment: "positive" | "neutral" | "negative";
    impactLevel: "low" | "medium" | "high";
  }[];

  // Company intelligence
  companyBriefs: {
    company: string;              // "google"
    displayName: string;          // "Google"
    articleCount: number;
    recentTrends: string[];       // ["Shifting to AI-focused interviews", "New L4 hiring bar"]
    prepAdvice: string;           // AI-generated actionable prep guidance
    sentiment: "positive" | "neutral" | "negative";
  }[];

  // "What to focus on this week"
  weeklyFocus: {
    category: HubCategory;
    reason: string;               // "3 new system design posts about event-driven architecture"
    topArticleIds: string[];
  }[];

  // Market signals
  marketSignals: {
    signal: string;               // "Hiring velocity at FAANG up 15% this week"
    evidence: string[];           // Article excerpts supporting this
    confidence: number;
  }[];
}
```

**Generation** (single Gemini call with full context):

```typescript
async function generateInsights(
  articles: FeedArticle[],
  enrichments: Map<string, EnrichmentResult>,
  clusters: StoryCluster[],
  trends: TrendSignal[],
  previousInsights: InsightReport | null,
): Promise<InsightReport> {
  // Build a compressed context document:
  // - Top 50 articles by TCRA score (title + category + entities + source)
  // - All clusters with 3+ articles
  // - All active trends
  // - Previous week's focus areas (for continuity)

  const context = buildInsightContext(articles, enrichments, clusters, trends);

  // Single Gemini call with structured output
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: `You are TULMEK's career intelligence analyst. Generate a weekly intelligence brief from this content corpus.

${INSIGHT_PROMPT}

Content corpus:
${context}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: INSIGHT_JSON_SCHEMA,
    },
  });

  return JSON.parse(response.text ?? "{}");
}
```

**Cost**: ~2,000 tokens input for compressed context + structured output. At $0.10/1M input: negligible. Run once per day (not every 3h): **$0.10/month**.

### 1.2 Caching Strategy

The AI cache (`.ai-cache.json`) evolves to store all enrichment data:

```typescript
interface AICacheEntry {
  titleHash: string;        // Base64 of title (cache invalidation key)
  enrichment: EnrichmentResult;
  embedding: number[];      // 768-dim vector
  cachedAt: string;         // ISO timestamp
}
```

**Cache invalidation**: An article is re-processed only when its `titleHash` changes. Since most articles are stable after first fetch, the cache hit rate will be 85-95% after the first run, reducing API costs by 10x.

**Cache file management**: `.embeddings-cache.json` and `.ai-cache.json` are gitignored and stored as GitHub Actions artifacts for persistence between runs. This avoids bloating the git history with large embedding vectors.

### 1.3 Fallback Chain

Every AI stage has a keyword/heuristic fallback:

| Stage | AI Path | Fallback |
|-------|---------|----------|
| Classification | Gemini structured output | Keyword scoring (existing) |
| Summarization | Gemini summary | Original excerpt |
| Entity extraction | Gemini entities | Regex (COMPANY_REGEX + tech keywords) |
| Embeddings | Gemini Embedding 2 | SimHash fingerprints (existing) |
| Clustering | Cosine similarity on embeddings | SimHash Hamming distance (existing) |
| Trend detection | Topic velocity from entities | Score velocity (existing trendingBonus) |
| Insights | Gemini synthesis | No insights generated (graceful absence) |

---

## 2. TCRA v2: Semantic Ranking Evolution

### 2.1 New Signals

The ranking algorithm gains three new input signals from the enrichment pipeline:

```typescript
// packages/core/src/domain/ranking.ts additions

// ── Semantic Content Relevance (replaces keyword contentRichness) ──
function semanticRelevance(article: EnrichedFeedArticle): number {
  let score = 0;

  // Actionability score from AI (direct signal)
  score += 0.3 * article.actionability;

  // Difficulty-audience match: advanced content for senior audience = high value
  const difficultyMap = { beginner: 0.3, intermediate: 0.6, advanced: 0.85, expert: 1.0 };
  score += 0.2 * (difficultyMap[article.difficulty] ?? 0.5);

  // Entity richness: articles mentioning specific companies + technologies are more useful
  const entityBonus = Math.min(1, article.entities.length / 5);
  score += 0.2 * entityBonus;

  // Content type: tutorials and experiences are more valuable than news
  const typeMap = { tutorial: 1.0, experience: 0.95, resource: 0.8, question: 0.7, discussion: 0.6, news: 0.4 };
  score += 0.15 * (typeMap[article.contentType] ?? 0.5);

  // Topic specificity: how many topics were identified (more = richer content)
  score += 0.15 * Math.min(1, article.topics.length / 4);

  return Math.min(1.0, score);
}

// ── Cluster Boost: articles in multi-source clusters are trending stories ──
function clusterBoost(
  article: FeedArticle,
  clusters: StoryCluster[],
): number {
  const cluster = clusters.find(c => c.articleIds.includes(article.id));
  if (!cluster) return 0;

  // Primary article in cluster gets full boost
  const isPrimary = cluster.primaryArticleId === article.id;
  const sourceBonus = Math.log2(cluster.sources.length + 1) / Math.log2(10);
  const momentumBonus = Math.min(1, cluster.momentum * 10);

  return isPrimary
    ? 0.3 * sourceBonus + 0.2 * momentumBonus
    : 0.1 * sourceBonus; // Secondary articles get a small boost
}

// ── Trend Alignment: articles matching active trends get boosted ──
function trendAlignment(
  article: EnrichedFeedArticle,
  trends: TrendSignal[],
): number {
  let maxAlignment = 0;
  for (const trend of trends) {
    if (trend.articleIds.includes(article.id)) {
      const phaseMultiplier = {
        emerging: 1.5,   // Emerging trends get highest boost
        growing: 1.2,
        peaking: 0.8,    // Peaking trends start to fade
        declining: 0.3,
      }[trend.phase];
      maxAlignment = Math.max(maxAlignment, trend.confidence * phaseMultiplier);
    }
  }
  return maxAlignment * 0.25; // Cap contribution at 0.25
}
```

### 2.2 Updated TCRA Formula

```typescript
function computeTCRAv2(
  article: EnrichedFeedArticle,
  sourcePercentiles: Map<string, number[]>,
  clusters: StoryCluster[],
  trends: TrendSignal[],
): number {
  // Core signals (existing, reweighted)
  const crs = 0.20 * categoryConfidence(article)
            + 0.15 * normalizedEngagement(article, sourcePercentiles)
            + 0.10 * discussionDepth(article)
            + 0.10 * sourceCredibility(article)
            + 0.20 * semanticRelevance(article)  // NEW: replaces contentRichness
            + 0.10 * clusterBoost(article, clusters)   // NEW
            + 0.15 * trendAlignment(article, trends);   // NEW

  return crs;
}

// Master ranking formula remains multiplicative:
// finalScore = CRS * freshnessDecay * (1 + trending) * personalization * (1 + surpriseFactor)
```

### 2.3 Surprise Factor (Serendipity Engine)

Surface unexpected but relevant content to prevent filter bubbles:

```typescript
function surpriseFactor(
  article: EnrichedFeedArticle,
  profile: UserProfile,
): number {
  // An article is "surprising" if:
  // 1. Its category is underrepresented in the user's reading history
  // 2. But its entities overlap with things the user has engaged with

  const catWeight = profile.categoryWeights[article.category] ?? 0;
  const avgWeight = 1 / Object.keys(CATEGORY_WEIGHT).length;
  const categoryNovelty = Math.max(0, avgWeight - catWeight) / avgWeight;

  // Entity overlap with previously read articles
  const userEntities = profile.engagedEntities ?? new Set<string>();
  const articleEntities = new Set(article.entities.map(e => e.normalized));
  const overlap = [...articleEntities].filter(e => userEntities.has(e)).length;
  const entityBridge = Math.min(1, overlap / 2); // At least 1 shared entity

  // Surprise = novel category BUT familiar entities
  return categoryNovelty * entityBridge * 0.15;
}
```

### 2.4 Backward Compatibility

TCRA v2 is additive, not a rewrite. The new signals (`semanticRelevance`, `clusterBoost`, `trendAlignment`, `surpriseFactor`) default to 0 when enrichment data is not available. This means:
- If `GEMINI_API_KEY` is not set, TCRA runs in v1 mode (keyword `contentRichness` is used).
- If clusters/trends JSON files are empty, those signals are zero.
- The ranking algorithm in `@tulmek/core` remains zero-dependency because it operates on plain data, not API calls.

---

## 3. Data Model Evolution

### 3.1 EnrichedFeedArticle (extends FeedArticle)

The `FeedArticle` type in `@tulmek/core/domain/article.ts` gains optional fields for enrichment data. All new fields are optional so existing consumers are unaffected.

```typescript
/** Enhanced article with AI-generated semantic metadata */
export interface FeedArticle {
  // ... existing fields (unchanged) ...

  // ── AI Enrichment (optional, populated at build time) ──

  /** Extracted topic labels (e.g., ["binary search", "amazon", "phone screen"]) */
  readonly topics?: readonly string[];

  /** Named entities mentioned in the article */
  readonly entities?: readonly EntityMention[];

  /** Sentiment of the article */
  readonly sentiment?: "positive" | "neutral" | "negative";

  /** Technical difficulty level */
  readonly difficulty?: "beginner" | "intermediate" | "advanced" | "expert";

  /** Target audience seniority */
  readonly audienceLevel?: "student" | "junior" | "mid" | "senior" | "staff";

  /** How actionable this content is for interview prep (0-1) */
  readonly actionability?: number;

  /** Content format type */
  readonly contentType?: "tutorial" | "experience" | "discussion" | "news" | "resource" | "question";

  /** Cluster ID if this article belongs to a story cluster */
  readonly clusterId?: string;
}

export interface EntityMention {
  readonly name: string;
  readonly type: "company" | "technology" | "concept" | "person" | "role";
  readonly normalized: string;
}
```

### 3.2 Storage Strategy — No JSON Bloat

The key design decision: **embeddings never ship to the client**. They exist only in the build-time cache and are used to produce lightweight derivative outputs.

| File | Contents | Size Impact | Ships to Client |
|------|----------|-------------|-----------------|
| `feed.json` | Articles + enrichment fields | +15-20% (~8 new fields per article, short strings) | Yes |
| `clusters.json` | Story clusters (label, summary, article IDs) | ~5-15 KB | Yes |
| `trends.json` | Active trend signals | ~3-10 KB | Yes |
| `insights.json` | Weekly intelligence brief | ~5-20 KB | Yes |
| `.embeddings-cache.json` | 768-dim vectors per article | ~6 MB (gitignored) | No |
| `.ai-cache.json` | Full enrichment cache | ~2 MB (gitignored) | No |

**Total client-side increase**: ~30-50 KB of additional JSON. Negligible for SSG.

### 3.3 New Shared Types

These go in `@tulmek/core/domain/` (zero-dep):

```
packages/core/src/domain/
  article.ts          # FeedArticle gains optional enrichment fields
  clusters.ts (NEW)   # StoryCluster type
  trends.ts (NEW)     # TrendSignal type
  insights.ts (NEW)   # InsightReport type
  vectors.ts (NEW)    # cosineSimilarity (pure math, zero-dep)
  ranking.ts          # TCRA v2 (uses new types, still zero-dep)
```

### 3.4 New Content Package Exports

```
packages/content/src/hub/
  feed.json            # Enriched articles
  metadata.json        # Source/category breakdown
  clusters.json (NEW)  # Story clusters
  trends.json (NEW)    # Active trends
  insights.json (NEW)  # Weekly intelligence brief
  subscribers.json     # Newsletter subscriber count
```

---

## 4. AI-Generated Insights — Unique Value Proposition

### 4.1 Cross-Source Story Synthesis

When a story cluster has 3+ articles from 2+ sources, generate a synthesis:

> **"Google Restructures L5 Interview Format"**
> Three sources (Reddit r/cscareerquestions, LeetCode Discuss, Glassdoor) report changes to Google's L5 SWE interview loop. The new format drops one coding round in favor of a "Googleyness + Leadership" behavioral round. Multiple candidates report this starting in Q1 2026. Reddit sentiment is mixed — some see it as positive for experienced candidates, while LeetCode commenters worry about reduced coding focus. *Sources: 2 Reddit posts, 1 LeetCode discussion, 1 Glassdoor review.*

This is generated by a single Gemini call using the cluster context. It runs only for clusters meeting the threshold (3+ articles, 2+ sources), so typically 3-8 synthesis calls per refresh.

### 4.2 Company Intelligence Briefs

Aggregate all articles mentioning a company into an actionable prep guide:

```json
{
  "company": "google",
  "displayName": "Google",
  "articleCount": 47,
  "recentTrends": [
    "New L5 interview format (Q1 2026)",
    "Increased focus on system design for L4+",
    "AI/ML roles now require LLM fine-tuning experience"
  ],
  "prepAdvice": "Focus on system design and behavioral prep. The new format weighs Googleyness more heavily. For AI roles, prepare LLM deployment scenarios.",
  "sentiment": "neutral"
}
```

These are generated at build time and consumed by the existing company intelligence pages (`apps/web/src/app/companies/[slug]/`).

### 4.3 "What to Focus On This Week"

A personalized weekly focus list derived from trend analysis:

```json
{
  "weeklyFocus": [
    {
      "category": "system-design",
      "reason": "5 new articles about event-driven architecture patterns — a frequent interview topic at Amazon and Uber",
      "topArticleIds": ["newsletter:abc123", "hackernews:456"]
    },
    {
      "category": "ai-ml",
      "reason": "Emerging trend: companies asking about RAG pipeline design in system design rounds",
      "topArticleIds": ["reddit:def789"]
    }
  ]
}
```

This ships as static JSON and is displayed in a "This Week's Focus" card on the homepage. No runtime AI needed.

### 4.4 Market Signals

Detect macro hiring signals from article corpus:

```json
{
  "marketSignals": [
    {
      "signal": "Uptick in FAANG interview experience posts (+30% vs last week)",
      "evidence": ["Reddit: 15 new FAANG interview posts", "LeetCode: 8 new compensation discussions"],
      "confidence": 0.82
    }
  ]
}
```

---

## 5. Implementation Roadmap

### Sprint A: Unified Enrichment Pipeline (3-4 days)
**Goal**: Replace separate classify + summarize Gemini calls with a single enrichment call that produces all metadata at once.

**Deliverables**:
- [ ] Refactor `fetch-hub-content.ts`: merge `classifyWithAI` and `summarizeWithAI` into `enrichWithAI`
- [ ] Add new optional fields to `FeedArticle` type in `@tulmek/core/domain/article.ts`
- [ ] Update AI cache schema to store full enrichment result
- [ ] Add `EntityMention` type to `@tulmek/core/domain/article.ts`
- [ ] Update content validation schema (`hub-schema.ts`) for new optional fields
- [ ] Verify keyword fallback still works when `GEMINI_API_KEY` is unset
- [ ] No UI changes — new fields are stored but not yet displayed

**Budget impact**: -$0 (same or fewer API calls due to consolidation)

### Sprint B: Embeddings + Story Clustering (3-4 days)
**Goal**: Generate embeddings, cluster related articles, and surface multi-source stories.

**Deliverables**:
- [ ] Add `packages/core/src/domain/vectors.ts` (cosineSimilarity, zero-dep)
- [ ] Add `packages/core/src/domain/clusters.ts` (StoryCluster type)
- [ ] Add embedding generation stage to fetch pipeline (Gemini Embedding 2)
- [ ] Implement Union-Find clustering algorithm in fetch script
- [ ] Generate cluster labels via Gemini (batched)
- [ ] Write `clusters.json` to `packages/content/src/hub/`
- [ ] Add `.embeddings-cache.json` to `.gitignore`
- [ ] Persist embedding cache as GitHub Actions artifact
- [ ] Add `clusterId` field to articles in `feed.json`
- [ ] UI: "Related Stories" section on article detail / cluster badges

**Budget impact**: +$0.50/month (embedding API)

### Sprint C: Trend Detection + TCRA v2 (2-3 days)
**Goal**: Detect emerging topics and integrate semantic signals into ranking.

**Deliverables**:
- [ ] Add `packages/core/src/domain/trends.ts` (TrendSignal type)
- [ ] Implement `detectTrends` in fetch pipeline (topic velocity analysis)
- [ ] Write `trends.json` to `packages/content/src/hub/`
- [ ] Add `semanticRelevance`, `clusterBoost`, `trendAlignment` to ranking.ts
- [ ] Add `surpriseFactor` to personalization
- [ ] Update TCRA weights (v1 weights preserved when enrichment absent)
- [ ] UI: "Trending Topics" bar on hub page
- [ ] E2E tests for trend display

**Budget impact**: +$0 (trend detection uses existing enrichment data)

### Sprint D: AI Insights + Weekly Brief (2-3 days)
**Goal**: Generate unique cross-source intelligence no single article provides.

**Deliverables**:
- [ ] Add `packages/core/src/domain/insights.ts` (InsightReport type)
- [ ] Implement `generateInsights` in fetch pipeline
- [ ] Write `insights.json` to `packages/content/src/hub/`
- [ ] Update company pages to show AI-generated prep advice from insights
- [ ] UI: "This Week's Focus" card on homepage
- [ ] UI: "Market Signals" section in Today's Brief
- [ ] UI: Cross-source story synthesis cards
- [ ] Conditionally run insights generation once per day (not every 3h)

**Budget impact**: +$0.10/month

### Sprint E: Semantic Search + Personalization (2-3 days)
**Goal**: Use enrichment metadata to improve search and personalization.

**Deliverables**:
- [ ] Orama adapter: index topics, entities, difficulty, audienceLevel as filterable facets
- [ ] Add difficulty/audience level filter chips to hub UI
- [ ] Entity-based search: searching "Google" returns all articles with Google entity, not just title matches
- [ ] Update `UserProfile` in ranking.ts: track `engagedEntities` from read articles
- [ ] Store entity engagement in localStorage (`STORAGE_KEYS.hubSignals`)
- [ ] Surprise factor: surface novel-category articles with familiar entities
- [ ] Mobile + Desktop: verify entity filters and semantic search work

**Budget impact**: +$0 (uses existing enrichment data)

---

## 6. Cost Summary

| Component | Monthly Cost | Notes |
|-----------|-------------|-------|
| Gemini Flash-Lite (enrichment) | ~$2.00 | With 90% cache hit rate |
| Gemini Embedding 2 | ~$0.50 | With embedding cache |
| Gemini Flash-Lite (cluster labels) | ~$0.30 | Only for new clusters |
| Gemini Flash-Lite (insights) | ~$0.10 | Once per day |
| **Total** | **~$3.00/month** | Well under $20 budget |

---

## 7. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Gemini API outage during build | Full keyword fallback chain; build succeeds with degraded intelligence |
| Embedding cache exceeds GitHub Actions artifact limit | Prune entries older than 30 days; LRU eviction |
| Cluster labels hallucinate | Validate cluster has 2+ real sources before generating label |
| Enrichment quality degrades | Log confidence scores; alert when mean confidence drops below 0.6 |
| feed.json size grows too large | Enrichment fields are short strings; monitor gzipped size |
| Cost exceeds budget | Cache aggressively; reduce insight frequency; set Gemini spend alerts |

---

## 8. What This Enables (Future Possibilities)

Once the semantic layer is in place, several advanced features become trivial:

1. **"Prep Me For [Company]"** — pull all entities matching the company, aggregate clusters, generate a personalized study plan from insights data.

2. **Semantic Duplicate Detection** — cosine similarity on embeddings catches paraphrased duplicates that SimHash misses (e.g., "System Design: Rate Limiter" vs "How to Design a Rate Limiting Service").

3. **Content Gap Analysis** — compare topic distribution against ideal interview prep coverage. Identify underrepresented topics and prioritize fetching from those sources.

4. **Notification Triggers** — "Alert me when a new Google interview experience post appears" becomes a topic/entity filter on the trend stream.

5. **Cross-Platform Intelligence** — the same `clusters.json`, `trends.json`, and `insights.json` power web, desktop, and mobile without any platform-specific AI code.

---

## References

- [Gemini 2.5 Flash-Lite: Stable and Generally Available](https://developers.googleblog.com/en/gemini-25-flash-lite-is-now-stable-and-generally-available/)
- [Gemini Embedding 2: Natively Multimodal](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-embedding-2/)
- [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini Embeddings API Documentation](https://ai.google.dev/gemini-api/docs/embeddings)
- [Text Clustering with LLM Embeddings (arXiv)](https://arxiv.org/html/2403.15112v5)
- [NVIDIA Semantic Deduplication (SemDedup)](https://docs.nvidia.com/nemo/curator/25.09/curate-text/process-data/deduplication/semdedup.html)
- [SemHash: Fast Semantic Deduplication](https://github.com/MinishLab/semhash)
- [How to Build a RAG Pipeline from Scratch in 2026](https://www.kapa.ai/blog/how-to-build-a-rag-pipeline-from-scratch-in-2026)
- [Complete Guide to Embeddings in 2026](https://encord.com/blog/complete-guide-to-embeddings-in-2026/)
