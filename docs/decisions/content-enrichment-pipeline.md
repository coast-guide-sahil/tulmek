# Content Enrichment Pipeline Specification

**Date:** 2026-03-28
**Status:** Proposed
**Author:** Head of Content Intelligence Research

---

## Executive Summary

This document specifies a multi-stage content enrichment pipeline for tulmek's Knowledge Hub. The pipeline transforms raw aggregated articles (title + excerpt + tags + score) into richly annotated content with structured metadata, enabling superior ranking, filtering, cross-linking, and user experience.

All enrichment runs at **build time** during the 3-hour `fetch-hub-content` cron cycle. Nothing changes at runtime. The pipeline extends `FeedArticle` with an `enrichment` field, keeping the existing schema backwards-compatible.

**Total estimated cost for 1,100 articles:** $0.12-0.25 per run using Gemini 2.5 Flash-Lite Batch API.

---

## Architecture Overview

```
Raw articles (7 sources)
    |
    v
[Stage 0] Dedup + Filter        (existing — SimHash, URL normalization)
    |
    v
[Stage 1] AI Classification     (existing — Gemini Flash-Lite, keyword fallback)
    |
    v
[Stage 2] Entity Extraction     (NEW — Gemini structured output)
    |
    v
[Stage 3] AI Metadata Gen       (NEW — Gemini structured output)
    |
    v
[Stage 4] Quality Scoring       (NEW — deterministic + Gemini hybrid)
    |
    v
[Stage 5] Cross-Article Linking (NEW — deterministic entity/topic overlap)
    |
    v
Enriched feed.json + metadata.json
```

All new stages (2-5) are processed in a **single Gemini Batch API call** using JSONL. One prompt per article, structured output schema enforced server-side. This minimizes cost and maximizes reliability.

---

## Enriched Article Type Extension

Add to `packages/core/src/domain/article.ts`:

```typescript
/** Difficulty level for audience targeting */
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

/** Interview round type */
export type InterviewRound =
  | "phone-screen" | "online-assessment" | "technical" | "system-design"
  | "behavioral" | "hiring-manager" | "bar-raiser" | "onsite" | "take-home";

/** Extracted entity from article content */
export interface ArticleEntities {
  /** Companies mentioned (normalized to COMPANY_SLUGS when possible) */
  readonly companies: readonly string[];
  /** Job titles/levels mentioned */
  readonly jobTitles: readonly string[];
  /** Tech stack/technologies mentioned */
  readonly techStack: readonly string[];
  /** Salary/compensation figures mentioned (raw strings) */
  readonly salaryMentions: readonly string[];
  /** Interview round types detected */
  readonly interviewRounds: readonly InterviewRound[];
  /** Locations/regions mentioned */
  readonly locations: readonly string[];
}

/** AI-generated structured metadata */
export interface ArticleMetadata {
  /** 3 key takeaways for interview prep (1 sentence each) */
  readonly keyTakeaways: readonly [string, string, string];
  /** Target audience */
  readonly targetAudience: DifficultyLevel;
  /** Prerequisite knowledge needed */
  readonly prerequisites: readonly string[];
  /** Single most actionable advice from the article */
  readonly actionableAdvice: string;
  /** Sub-topics within the category (e.g., "distributed caching" within system-design) */
  readonly subTopics: readonly string[];
  /** Sentiment: positive experience, negative experience, neutral/educational */
  readonly sentiment: "positive" | "negative" | "neutral" | "mixed";
}

/** Deterministic quality signals */
export interface QualitySignals {
  /** 0-1 composite quality score */
  readonly qualityScore: number;
  /** Individual signal breakdown */
  readonly signals: {
    readonly depth: number;        // 0-1: analysis depth
    readonly actionability: number; // 0-1: concrete advice present
    readonly specificity: number;   // 0-1: specific examples/data vs generic
    readonly freshness: number;     // 0-1: timely relevance
  };
}

/** Cross-article link */
export interface ArticleLink {
  /** ID of the linked article */
  readonly targetId: string;
  /** Relationship type */
  readonly relation: "same-topic" | "same-company" | "contrasting-view" | "prerequisite" | "follow-up";
  /** Overlap strength 0-1 */
  readonly strength: number;
}

/** Enrichment data attached to each article */
export interface ArticleEnrichment {
  readonly entities: ArticleEntities;
  readonly metadata: ArticleMetadata;
  readonly quality: QualitySignals;
  readonly relatedArticles: readonly ArticleLink[];
}
```

Extend `FeedArticle`:

```typescript
export interface FeedArticle {
  // ... existing fields ...

  /** AI-generated enrichment data (populated at build time) */
  readonly enrichment?: ArticleEnrichment;
}
```

The `enrichment` field is optional for backwards compatibility. Old articles without enrichment continue to work. The Zod schema adds `.optional()` for the enrichment field.

---

## Stage 2: Entity Extraction

### What It Does
Extracts structured entities from article title + excerpt: company names, job titles, tech stacks, salary figures, interview round types, and locations.

### Why It Matters
- **Company pages**: Currently uses regex (`COMPANY_REGEX` in ranking.ts) to detect 38 companies. NER can catch misspellings, abbreviations ("MSFT", "FAANG"), and new companies not in the hardcoded list.
- **Tech stack filtering**: Users preparing for specific stacks (React, Kubernetes, Spark) can filter content.
- **Salary intelligence**: Structured salary extraction enables compensation comparisons.
- **Interview round filtering**: "Show me only system design round experiences" becomes possible.

### Approach: Gemini Structured Output (NOT standalone NER model)

**Why NOT GLiNER/spaCy/dedicated NER:**
- Adding a Python ML dependency (GLiNER, spaCy) to a TypeScript build script creates infrastructure complexity.
- GLiNER requires model download (~500MB) and inference infrastructure.
- For 1,100 articles processed every 3 hours, the overhead is not justified.
- Gemini 2.5 Flash-Lite already runs in the pipeline for classification/summarization. Adding entity extraction to the same prompt costs near-zero additional tokens.

**Why Gemini structured output wins here:**
- Zero additional infrastructure. Same `@google/genai` SDK already in use.
- `responseSchema` guarantees valid JSON with enum constraints.
- Custom entity types (interview rounds, salary formats) are trivially defined.
- Batch API processes all 1,100 articles at 50% cost.

### Gemini Prompt Template

```
Extract structured entities from this interview-prep article.

Title: {title}
Excerpt: {excerpt}
Tags: {tags}

Extract:
- companies: Company names mentioned (use lowercase slug form: "google", "meta", "stripe")
- jobTitles: Job titles or levels (e.g., "Senior SDE", "L5", "Staff Engineer")
- techStack: Technologies, frameworks, languages mentioned
- salaryMentions: Any compensation figures as raw strings (e.g., "$180k base", "40L CTC", "TC $350k")
- interviewRounds: Types of interview rounds discussed
- locations: Cities, regions, or "remote" if mentioned
```

### ResponseSchema

```typescript
{
  type: "object",
  properties: {
    companies: { type: "array", items: { type: "string" } },
    jobTitles: { type: "array", items: { type: "string" } },
    techStack: { type: "array", items: { type: "string" } },
    salaryMentions: { type: "array", items: { type: "string" } },
    interviewRounds: {
      type: "array",
      items: {
        type: "string",
        enum: ["phone-screen", "online-assessment", "technical",
               "system-design", "behavioral", "hiring-manager",
               "bar-raiser", "onsite", "take-home"]
      }
    },
    locations: { type: "array", items: { type: "string" } },
  },
  required: ["companies", "jobTitles", "techStack", "salaryMentions", "interviewRounds", "locations"],
}
```

### Input/Output

- **Input:** title (string), excerpt (string, truncated to 500 chars), tags (string[])
- **Output:** `ArticleEntities` object
- **Post-processing:** Normalize company names against `COMPANY_SLUGS` via fuzzy matching (Levenshtein distance <= 2 or known alias map). Unknown companies pass through as-is.

### Cost Estimate (1,100 articles)

Combined with Stage 3 in a single prompt (see below).

### Value Assessment: **MUST-HAVE**

Entity extraction is the single highest-value enrichment. It enables:
1. Company intelligence pages (already exist, currently regex-only)
2. Tech stack filtering (new feature)
3. Salary intelligence aggregation (new feature)
4. Interview round filtering (new feature)

### Priority: P0

---

## Stage 3: AI-Generated Metadata

### What It Does
Generates structured metadata per article: 3 key takeaways, target audience level, prerequisite knowledge, actionable advice, sub-topics, and sentiment.

### Why It Matters
- **Key takeaways**: Users can scan articles without reading. Reduces bounce rate.
- **Difficulty level**: New grads see beginner content first. Staff engineers skip basics.
- **Sub-topics**: Within "system-design", users can drill into "distributed caching" vs "API design" vs "message queues". This is impossible with the current 8-category system.
- **Sentiment**: Interview experience articles can be filtered by outcome (positive = got offer, negative = rejected, neutral = educational).
- **Prerequisites**: Creates implicit learning paths ("read X before Y").

### Approach: Gemini Structured Output

Combined with Stage 2 into a **single prompt per article** to minimize token overhead.

### Combined Prompt Template (Stages 2 + 3)

```
You are a career intelligence analyst. Analyze this interview-prep article and extract structured data.

Title: {title}
Source: {source}
Category: {category}
Tags: {tags}
Excerpt: {excerpt (truncated to 500 chars)}

Extract ALL of the following:

ENTITIES:
- companies: Company names (lowercase slug: "google", "meta", "stripe")
- jobTitles: Job titles or levels mentioned
- techStack: Technologies, frameworks, languages
- salaryMentions: Compensation figures as raw strings
- interviewRounds: Interview round types discussed
- locations: Cities, regions, or "remote"

METADATA:
- keyTakeaways: Exactly 3 key takeaways for someone preparing for tech interviews (1 sentence each, specific not generic)
- targetAudience: Content difficulty level
- prerequisites: Knowledge needed to understand this article (max 5)
- actionableAdvice: The single most actionable piece of advice (1 sentence)
- subTopics: Specific sub-topics within the category (max 5, e.g., "binary search" within DSA, "load balancing" within system-design)
- sentiment: Overall tone regarding interview/career outcome
```

### Combined ResponseSchema

```typescript
{
  type: "object",
  properties: {
    // Entities
    companies: { type: "array", items: { type: "string" } },
    jobTitles: { type: "array", items: { type: "string" } },
    techStack: { type: "array", items: { type: "string" } },
    salaryMentions: { type: "array", items: { type: "string" } },
    interviewRounds: {
      type: "array",
      items: {
        type: "string",
        enum: ["phone-screen", "online-assessment", "technical",
               "system-design", "behavioral", "hiring-manager",
               "bar-raiser", "onsite", "take-home"]
      }
    },
    locations: { type: "array", items: { type: "string" } },
    // Metadata
    keyTakeaways: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 3,
    },
    targetAudience: {
      type: "string",
      enum: ["beginner", "intermediate", "advanced"],
    },
    prerequisites: {
      type: "array",
      items: { type: "string" },
    },
    actionableAdvice: { type: "string" },
    subTopics: {
      type: "array",
      items: { type: "string" },
    },
    sentiment: {
      type: "string",
      enum: ["positive", "negative", "neutral", "mixed"],
    },
  },
  required: [
    "companies", "jobTitles", "techStack", "salaryMentions",
    "interviewRounds", "locations", "keyTakeaways", "targetAudience",
    "prerequisites", "actionableAdvice", "subTopics", "sentiment"
  ],
}
```

### Cost Estimate for Stages 2 + 3 Combined (1,100 articles)

**Token estimation per article:**
- Input: ~250 tokens (prompt template) + ~150 tokens (title + excerpt + tags) = ~400 tokens
- Output: ~200 tokens (structured JSON response)

**Total for 1,100 articles:**
- Input: 1,100 x 400 = 440,000 tokens
- Output: 1,100 x 200 = 220,000 tokens

**Using Gemini 2.5 Flash-Lite Batch API (50% discount):**
- Input: 0.44M tokens x $0.05/1M = $0.022
- Output: 0.22M tokens x $0.20/1M = $0.044
- **Total: ~$0.07 per run**

**Using Gemini 2.5 Flash Batch API (higher quality, 50% discount):**
- Input: 0.44M tokens x $0.15/1M = $0.066
- Output: 0.22M tokens x $1.25/1M = $0.275
- **Total: ~$0.34 per run**

**Recommendation:** Use Flash-Lite for entity extraction + metadata. The structured output schema constrains the model sufficiently that Flash-Lite accuracy is comparable to Flash for this task. At $0.07/run with 8 runs/day, that is **$0.56/day or ~$17/month**.

### Value Assessment: **MUST-HAVE**

Key takeaways and difficulty levels are the two highest-impact UX features possible. Sub-topics unlock a whole new navigation paradigm.

### Priority: P0

---

## Stage 4: Quality Scoring

### What It Does
Produces a 0-1 composite quality score for each article based on multiple signals. Used to filter out low-quality content and boost high-quality content in TCRA ranking.

### Why It Matters
The current TCRA uses engagement (upvotes, comments) as a proxy for quality. But engagement != quality:
- Clickbait titles get high engagement but low depth
- Detailed technical writeups sometimes get few upvotes
- Reddit compensation threads get massive engagement but vary wildly in quality

A quality score independent of engagement adds signal that TCRA currently lacks.

### Approach: Hybrid Deterministic + AI

**Deterministic signals (computed without LLM, zero cost):**

```typescript
function computeQualitySignals(article: FeedArticle, enrichment: Partial<ArticleEnrichment>): QualitySignals {
  const entities = enrichment.entities;
  const metadata = enrichment.metadata;

  // 1. DEPTH (0-1): How rich is the content?
  let depth = 0;
  // Reading time > 5 min signals depth
  depth += Math.min(1, article.readingTime / 10) * 0.3;
  // Excerpt length signals substance
  depth += Math.min(1, article.excerpt.length / 500) * 0.2;
  // Tech stack mentions signal technical depth
  depth += Math.min(1, (entities?.techStack.length ?? 0) / 5) * 0.2;
  // Interview questions extracted signal actionable content
  depth += Math.min(1, article.interviewQuestions.length / 3) * 0.15;
  // Sub-topics signal specificity
  depth += Math.min(1, (metadata?.subTopics.length ?? 0) / 3) * 0.15;

  // 2. ACTIONABILITY (0-1): Can the reader DO something?
  let actionability = 0;
  const text = `${article.title} ${article.excerpt}`.toLowerCase();
  // Code/solution presence
  if (/```|solution|implement|approach|step[s]?\s*\d|how to/.test(text)) actionability += 0.4;
  // Specific company + round = actionable prep info
  if ((entities?.companies.length ?? 0) > 0 && (entities?.interviewRounds.length ?? 0) > 0) actionability += 0.3;
  // Salary data = actionable negotiation info
  if ((entities?.salaryMentions.length ?? 0) > 0) actionability += 0.3;

  // 3. SPECIFICITY (0-1): Specific examples vs generic advice?
  let specificity = 0;
  // Named companies
  specificity += Math.min(1, (entities?.companies.length ?? 0) / 3) * 0.3;
  // Specific levels/titles
  specificity += Math.min(1, (entities?.jobTitles.length ?? 0) / 2) * 0.25;
  // Salary figures
  specificity += (entities?.salaryMentions.length ?? 0) > 0 ? 0.25 : 0;
  // Locations
  specificity += (entities?.locations.length ?? 0) > 0 ? 0.2 : 0;

  // 4. FRESHNESS (from existing TCRA — reuse freshnessDecay)
  // Already computed in ranking.ts, but we store a normalized version
  const ageMs = Date.now() - new Date(article.publishedAt).getTime();
  const ageDays = ageMs / 86_400_000;
  const freshness = ageDays < 7 ? 1.0 : ageDays < 30 ? 0.7 : ageDays < 90 ? 0.4 : 0.2;

  // Composite: weighted average
  const qualityScore =
    0.35 * depth +
    0.30 * actionability +
    0.20 * specificity +
    0.15 * freshness;

  return {
    qualityScore: Math.round(qualityScore * 1000) / 1000,
    signals: {
      depth: Math.round(Math.min(1, depth) * 1000) / 1000,
      actionability: Math.round(Math.min(1, actionability) * 1000) / 1000,
      specificity: Math.round(Math.min(1, specificity) * 1000) / 1000,
      freshness: Math.round(freshness * 1000) / 1000,
    },
  };
}
```

### Input/Output

- **Input:** `FeedArticle` + entity/metadata enrichment from Stages 2-3
- **Output:** `QualitySignals` with composite score and breakdown
- **No LLM call required.** Fully deterministic, computed from existing fields + enrichment data.

### Cost Estimate: **$0.00** (deterministic computation)

### Value Assessment: **MUST-HAVE**

Quality scoring is the single biggest improvement to TCRA ranking accuracy. It adds a new signal dimension that is orthogonal to engagement.

### Priority: P0

### TCRA Integration

Add `qualityScore` as a new factor in `computeCRS()`:

```typescript
// Current CRS weights (sum = 1.0):
// 0.25 categoryConfidence + 0.20 engagement + 0.15 discussion + 0.15 source + 0.25 richness

// New CRS weights with quality (sum = 1.0):
// 0.20 categoryConfidence + 0.15 engagement + 0.10 discussion + 0.10 source + 0.20 richness + 0.25 quality
```

Quality gets the highest weight because it's the most direct measure of content value for interview prep.

---

## Stage 5: Cross-Article Linking

### What It Does
Detects relationships between articles based on shared entities, sub-topics, and companies. Produces `relatedArticles` links for each article.

### Why It Matters
- "You're reading about Google system design interviews? Here are 3 more Google system design articles from different sources."
- "This article covers distributed caching. Here's a prerequisite on caching fundamentals."
- "Two conflicting views on whether to grind LeetCode — see both perspectives."

### Approach: Deterministic Entity/Topic Overlap (NO knowledge graph, NO embeddings)

**Why NOT a knowledge graph:**
- Knowledge graph construction (entity disambiguation, relation extraction, graph storage) is massive infrastructure for 1,100 articles.
- The corpus is small enough that pairwise comparison is tractable: 1,100 x 1,100 = 1.2M pairs, but with early termination and category pre-filtering, it's ~50K comparisons.
- A knowledge graph adds value at 10,000+ articles. At 1,100, it's over-engineering.

**Why NOT embedding similarity:**
- Requires a vector database or at minimum storing 1,100 embeddings.
- Adds a dependency on an embedding model (Gemini, OpenAI, or local).
- For our use case, entity overlap is a better signal than semantic similarity. Two articles that both mention "Google", "L5", "system-design-round" are more usefully related than two articles that are semantically similar but about different companies.

**Algorithm:**

```typescript
function computeArticleLinks(
  articles: FeedArticle[],
  enrichments: Map<string, ArticleEnrichment>
): Map<string, ArticleLink[]> {
  const links = new Map<string, ArticleLink[]>();

  // Pre-index: company -> article IDs, subTopic -> article IDs
  const companyIndex = new Map<string, Set<string>>();
  const topicIndex = new Map<string, Set<string>>();
  const categoryIndex = new Map<string, Set<string>>();

  for (const article of articles) {
    const e = enrichments.get(article.id);
    if (!e) continue;

    for (const company of e.entities.companies) {
      if (!companyIndex.has(company)) companyIndex.set(company, new Set());
      companyIndex.get(company)!.add(article.id);
    }
    for (const topic of e.metadata.subTopics) {
      const normalized = topic.toLowerCase().trim();
      if (!topicIndex.has(normalized)) topicIndex.set(normalized, new Set());
      topicIndex.get(normalized)!.add(article.id);
    }
    if (!categoryIndex.has(article.category)) categoryIndex.set(article.category, new Set());
    categoryIndex.get(article.category)!.add(article.id);
  }

  for (const article of articles) {
    const e = enrichments.get(article.id);
    if (!e) continue;

    const candidates = new Map<string, { score: number; relation: ArticleLink["relation"] }>();

    // Same company: strong signal
    for (const company of e.entities.companies) {
      for (const otherId of companyIndex.get(company) ?? []) {
        if (otherId === article.id) continue;
        const existing = candidates.get(otherId);
        const newScore = (existing?.score ?? 0) + 0.4;
        candidates.set(otherId, {
          score: newScore,
          relation: "same-company",
        });
      }
    }

    // Same sub-topic: strong signal
    for (const topic of e.metadata.subTopics) {
      const normalized = topic.toLowerCase().trim();
      for (const otherId of topicIndex.get(normalized) ?? []) {
        if (otherId === article.id) continue;
        const existing = candidates.get(otherId);
        const newScore = (existing?.score ?? 0) + 0.35;
        // Upgrade relation if topic overlap is stronger
        if (!existing || existing.score < newScore) {
          candidates.set(otherId, {
            score: newScore,
            relation: "same-topic",
          });
        }
      }
    }

    // Same category: weak signal (only if not already linked)
    for (const otherId of categoryIndex.get(article.category) ?? []) {
      if (otherId === article.id) continue;
      if (!candidates.has(otherId)) {
        candidates.set(otherId, { score: 0.1, relation: "same-topic" });
      }
    }

    // Sentiment-based contrast detection
    const otherE = enrichments.get([...candidates.keys()][0] ?? "");
    for (const [otherId, link] of candidates) {
      const otherEnrich = enrichments.get(otherId);
      if (otherEnrich && e.metadata.sentiment !== "neutral" && otherEnrich.metadata.sentiment !== "neutral") {
        if (e.metadata.sentiment !== otherEnrich.metadata.sentiment) {
          candidates.set(otherId, { ...link, relation: "contrasting-view", score: link.score + 0.15 });
        }
      }
    }

    // Difficulty-based prerequisite detection
    for (const [otherId, link] of candidates) {
      const otherEnrich = enrichments.get(otherId);
      if (!otherEnrich) continue;
      const levels = ["beginner", "intermediate", "advanced"];
      const myLevel = levels.indexOf(e.metadata.targetAudience);
      const otherLevel = levels.indexOf(otherEnrich.metadata.targetAudience);
      if (otherLevel < myLevel && link.score > 0.3) {
        candidates.set(otherId, { ...link, relation: "prerequisite" });
      }
    }

    // Take top 5 links, sorted by score
    const sortedLinks = [...candidates.entries()]
      .sort(([, a], [, b]) => b.score - a.score)
      .slice(0, 5)
      .map(([targetId, { score, relation }]): ArticleLink => ({
        targetId,
        relation,
        strength: Math.round(Math.min(1, score) * 100) / 100,
      }));

    links.set(article.id, sortedLinks);
  }

  return links;
}
```

### Input/Output

- **Input:** All `FeedArticle[]` + their `ArticleEnrichment` from Stages 2-3
- **Output:** `Map<string, ArticleLink[]>` — up to 5 related articles per article
- **No LLM call required.** Deterministic, based on entity/topic overlap from Stage 2-3 output.

### Cost Estimate: **$0.00** (deterministic computation)

### Value Assessment: **MUST-HAVE**

Cross-article linking is the highest-impact UX feature after search. It transforms a flat feed into a connected knowledge network.

### Priority: P0

---

## Techniques Evaluated but NOT Recommended

### Topic Modeling (BERTopic / LDA)

**What it is:** Unsupervised discovery of topics from document corpus.

**Why NOT for tulmek:**
- BERTopic requires Python infrastructure (sentence-transformers, HDBSCAN, UMAP). Our pipeline is TypeScript.
- LDA requires Gensim (Python). Same problem.
- For 1,100 articles with 8 known categories, unsupervised topic discovery adds little over Gemini's sub-topic extraction. We already know our domain taxonomy.
- BERTopic shines at 10,000+ documents where you don't know the categories. We have 1,100 documents with well-defined categories.

**Alternative implemented:** Sub-topic extraction via Gemini (Stage 3) gives us the same benefit — discovering "distributed caching" within "system-design" — without any Python dependency.

**Verdict:** Nice-to-have at 10K+ articles. Not justified at current scale.

### Standalone NER Models (GLiNER, spaCy)

**What GLiNER offers:** Zero-shot NER that outperforms ChatGPT on benchmarks. Lightweight bidirectional transformer. Custom entity types without retraining.

**Why NOT for tulmek:**
- GLiNER is a Python library. Our build pipeline is TypeScript/Node.
- Model download is ~500MB. Adds to CI/CD build time.
- For 1,100 articles processed at build time (not real-time), the latency advantage of GLiNER over Gemini is irrelevant.
- Gemini structured output with `responseSchema` achieves equivalent accuracy for our entity types with zero infrastructure overhead.

**When to reconsider:** If we add real-time entity extraction in the client (e.g., highlighting entities in article text as the user reads), GLiNER.js (the ONNX web port) would be the right choice.

**Verdict:** Over-engineering for build-time enrichment of 1,100 articles.

### Embedding-Based Semantic Similarity

**What it is:** Generate vector embeddings for each article, compute cosine similarity for cross-linking.

**Why NOT for tulmek:**
- Requires storing 1,100 x 768-dimensional vectors (or calling Gemini embedding API per run).
- Gemini embedding API cost: ~$0.01 per run (cheap), but adds complexity for marginal improvement.
- Entity/topic overlap (Stage 5) provides more interpretable and actionable links than raw semantic similarity. "These articles are related because they both discuss Google L5 system design interviews" is more useful than "these articles have 0.87 cosine similarity."

**When to reconsider:** At 5,000+ articles where entity overlap becomes sparse and semantic similarity catches relationships that keyword overlap misses.

**Verdict:** Nice-to-have at 5K+ articles. Entity overlap is superior at current scale.

### Dedicated Sentiment Models (VADER, RoBERTa-sentiment)

**What they offer:** Fine-tuned sentiment classification without LLM.

**Why NOT for tulmek:**
- VADER is rule-based and domain-agnostic. It doesn't understand "got rejected after 5 rounds" as negative sentiment in an interview context.
- RoBERTa-sentiment requires Python + model download.
- Gemini already generates sentiment as one field in our combined prompt. Adding a dedicated model gives marginal accuracy improvement for significant infrastructure cost.

**Verdict:** Not justified. Gemini's sentiment output is sufficient for our use case (filtering by positive/negative interview outcomes).

---

## Implementation Plan

### Phase 1: Single Gemini Batch Call (Stages 2 + 3)

**Estimated effort:** 1 sprint

Modify `fetch-hub-content.ts` to add a new function:

```typescript
async function enrichBatchWithGemini(
  articles: { id: string; title: string; excerpt: string; tags: string[]; source: string; category: string }[]
): Promise<Map<string, { entities: ArticleEntities; metadata: ArticleMetadata }>> {
  if (!GEMINI_API_KEY) return new Map();

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const BATCH_SIZE = 10; // Smaller batch for richer output
  const results = new Map<string, { entities: ArticleEntities; metadata: ArticleMetadata }>();

  // Process in batches
  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    const prompt = batch
      .map((a, idx) => `[${idx}] Title: ${a.title}\nSource: ${a.source}\nCategory: ${a.category}\nTags: ${a.tags.join(", ") || "none"}\nExcerpt: ${a.excerpt.slice(0, 500)}`)
      .join("\n\n");

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: `You are a career intelligence analyst. For each article, extract entities and generate metadata.\n\nArticles:\n${prompt}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: ENRICHMENT_SCHEMA, // Combined schema from above
        },
      });

      // Parse and map results back to article IDs
      // ...
    } catch (err) {
      console.warn(`Enrichment batch ${i} failed:`, (err as Error).message);
    }
  }

  return results;
}
```

**Integration point:** After classification + summarization, before JSON write:

```typescript
// Existing pipeline
const classified = await classifyWithAI(articles);
const summarized = await summarizeWithAI(articles);

// NEW: Enrichment
const enrichments = await enrichBatchWithGemini(articles);

// NEW: Quality scoring (deterministic, uses enrichment data)
const qualityScores = articles.map(a => computeQualitySignals(a, enrichments.get(a.id)));

// NEW: Cross-article linking (deterministic, uses enrichment data)
const links = computeArticleLinks(articles, enrichments);

// Merge enrichment into article JSON
const enrichedArticles = articles.map(a => ({
  ...a,
  enrichment: {
    entities: enrichments.get(a.id)?.entities ?? DEFAULT_ENTITIES,
    metadata: enrichments.get(a.id)?.metadata ?? DEFAULT_METADATA,
    quality: qualityScores.get(a.id) ?? DEFAULT_QUALITY,
    relatedArticles: links.get(a.id) ?? [],
  },
}));
```

### Phase 2: Quality Score in TCRA (Stage 4 integration)

**Estimated effort:** 0.5 sprint

Update `packages/core/src/domain/ranking.ts`:
- Add `enrichmentQuality()` function that reads `article.enrichment?.quality.qualityScore`
- Adjust CRS weights to incorporate quality signal
- Falls back to 0.5 (neutral) for articles without enrichment

### Phase 3: Cross-Article Links in UI (Stage 5 integration)

**Estimated effort:** 1 sprint

- Add "Related Articles" section to article detail/expanded view
- Show relationship type badges ("Same Company", "Different Perspective", "Prerequisite")
- Link strength determines ordering

### Phase 4: Sub-Topic Navigation

**Estimated effort:** 1 sprint

- Extract unique sub-topics from all enriched articles
- Build sub-topic filter chips within each category view
- "System Design > Distributed Caching" becomes a navigable path

### Phase 5: Difficulty Filtering

**Estimated effort:** 0.5 sprint

- Add difficulty level filter (Beginner / Intermediate / Advanced)
- Show difficulty badge on article cards
- Default filter based on user behavior (if they mostly read advanced content, default to advanced)

---

## Cost Summary

| Component | Model | Per Run | Per Day (8 runs) | Per Month |
|-----------|-------|---------|-------------------|-----------|
| Classification (existing) | Flash-Lite | ~$0.04 | $0.32 | $9.60 |
| Summarization (existing) | Flash-Lite | ~$0.04 | $0.32 | $9.60 |
| Enrichment (Stages 2+3) | Flash-Lite | ~$0.07 | $0.56 | $16.80 |
| Quality (Stage 4) | Deterministic | $0.00 | $0.00 | $0.00 |
| Cross-linking (Stage 5) | Deterministic | $0.00 | $0.00 | $0.00 |
| **Total** | | **~$0.15** | **$1.20** | **$36.00** |

Using Batch API (50% discount, 24h turnaround acceptable for non-urgent enrichment):

| Component | Model | Per Run | Per Day (8 runs) | Per Month |
|-----------|-------|---------|-------------------|-----------|
| All Gemini stages combined | Flash-Lite Batch | ~$0.075 | $0.60 | $18.00 |
| Deterministic stages | N/A | $0.00 | $0.00 | $0.00 |
| **Total with Batch** | | **~$0.075** | **$0.60** | **$18.00** |

**Bottom line:** The entire enrichment pipeline costs less than $20/month. This is negligible.

---

## Schema Changes Required

### 1. `packages/core/src/domain/article.ts`

Add: `DifficultyLevel`, `InterviewRound`, `ArticleEntities`, `ArticleMetadata`, `QualitySignals`, `ArticleLink`, `ArticleEnrichment` types.
Add: `enrichment?: ArticleEnrichment` to `FeedArticle`.

### 2. `apps/web/src/content/hub-schema.ts`

Add: Zod schemas for all enrichment types. Add `.optional()` enrichment field to `feedArticleSchema`.

### 3. `packages/config/src/constants.ts`

Add: `ENRICHMENT_BATCH_SIZE = 10`, `ENRICHMENT_CONCURRENCY = 5`, `MAX_RELATED_ARTICLES = 5`, `MIN_LINK_STRENGTH = 0.2`.

### 4. `apps/web/scripts/fetch-hub-content.ts`

Add: `enrichBatchWithGemini()`, `computeQualitySignals()`, `computeArticleLinks()`.
Modify: main pipeline to call enrichment after classification/summarization.

### 5. `packages/core/src/domain/ranking.ts`

Modify: `computeCRS()` to incorporate quality score.
Add: `enrichmentQuality()` helper.

---

## Gemini Structured Output Best Practices (Applied)

Based on research, the following practices are applied throughout this pipeline:

1. **Use `responseSchema` exclusively.** Do NOT duplicate the schema in the prompt text. The schema IS the instruction.

2. **Use `description` fields in schema properties.** Each property description guides the model. E.g., `companies: { description: "Company names in lowercase slug form matching COMPANY_SLUGS" }`.

3. **Maintain property ordering.** The prompt's field ordering MUST match the `responseSchema` property ordering. Mismatch causes malformed output.

4. **Use enum constraints aggressively.** `interviewRounds`, `targetAudience`, `sentiment` are all enums. This eliminates post-processing validation.

5. **Set all fields as `required`.** Optional fields cause the model to sometimes skip them. Required fields with empty arrays are preferable to missing fields.

6. **Batch size of 10 for enrichment** (vs 20 for classification). Richer output per article means more output tokens per request. Smaller batches reduce the chance of truncation.

7. **Fallback to deterministic defaults.** If Gemini fails, every enrichment field has a sensible default (empty arrays, "neutral" sentiment, 0.5 quality score).

8. **Batch API for cost reduction.** For non-urgent enrichment (build-time, not real-time), the Batch API at 50% discount is the right choice. 24-hour turnaround is fine since we process every 3 hours anyway — we can submit the batch and pick up results on the next cycle.

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Gemini API downtime | All enrichment is optional. Articles without enrichment display normally. Quality score defaults to 0.5. |
| Hallucinated entities | Post-process company names against `COMPANY_SLUGS`. Unknown entities are allowed but not used for company pages. |
| Cost spike | Flash-Lite at $0.10/$0.40 per 1M tokens is the cheapest production model. Even 10x article count stays under $200/month. |
| Schema changes break mobile/desktop | `enrichment` field is optional. Platforms that don't read it are unaffected. |
| Sub-topic explosion | Cap at 5 sub-topics per article. Normalize with lowercase + trim. Merge similar sub-topics in UI layer. |
| Sentiment misclassification | Only use sentiment for optional filtering, not for ranking. Misclassification has low impact. |

---

## Success Metrics

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| Articles with company entities | ~40% (regex) | 70%+ (Gemini NER) | Count articles with non-empty `entities.companies` |
| Articles with difficulty level | 0% | 100% | All articles get `targetAudience` |
| Average related articles per article | 0 | 3+ | Mean `relatedArticles.length` |
| Quality score variance | N/A | std > 0.15 | Quality score should differentiate articles, not cluster at 0.5 |
| Sub-topics discovered | 0 | 50+ unique | Count distinct `subTopics` across corpus |
| Enrichment pipeline duration | N/A | < 5 min | Time from start to completion of all stages |

---

## References

- [Named Entity Recognition: A Practical 2026 Guide](https://labelyourdata.com/articles/data-annotation/named-entity-recognition)
- [Modern NER: Beyond Traditional NLP with Transformers and LLMs (2026)](https://akankshaonearth.medium.com/modern-named-entity-recognition-beyond-traditional-nlp-with-transformers-and-llms-2026-c935ef31e692)
- [GLiNER: Generalist Model for Named Entity Recognition](https://github.com/urchade/GLiNER)
- [Topic Modeling: BERTopic, LDA, and Beyond](https://chamomile.ai/topic-modeling-overview/)
- [BERTopic LLM & Generative AI Representation](https://maartengr.github.io/BERTopic/getting_started/representation/llm.html)
- [AI-powered Topic Modeling: Comparing LDA and BERTopic](https://pmc.ncbi.nlm.nih.gov/articles/PMC11906279/)
- [Sentiment Analysis in Interview Intelligence](https://www.jobtwine.com/blog/role-of-sentiment-analysis-in-interview-intelligence/)
- [Beyond Flesch-Kincaid: Prompt-based Metrics for Difficulty Classification](https://arxiv.org/html/2405.09482v1)
- [Estimating Difficulty Levels of Programming Problems with Pre-trained Models](https://arxiv.org/abs/2406.08828)
- [Knowledge Graph Construction Using LLMs](https://www.nature.com/articles/s41598-026-38066-w)
- [Signal Scoring Pipeline: Deterministic Knowledge Triage](https://blakecrosley.com/blog/signal-scoring-pipeline)
- [Metadata Enrichment as a First-Class AI Capability](https://medium.com/@aspected/metadata-enrichment-as-a-first-class-ai-capability-fe6c0b1c8d4c)
- [Gemini Structured Outputs](https://ai.google.dev/gemini-api/docs/structured-output)
- [Gemini Batch API](https://ai.google.dev/gemini-api/docs/batch-api)
- [Gemini API Pricing (March 2026)](https://ai.google.dev/gemini-api/docs/pricing)
- [Scaling Language Detection: A Million Messages with Gemini Batch API](https://medium.com/google-cloud/scaling-language-detection-a-million-messages-with-geminis-batch-api-flash-lite-baccc197a1c2)
- [Improving Structured Outputs in the Gemini API](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-api-structured-outputs/)
- [How to Use Gemini Structured Output for Reliable Data Extraction](https://oneuptime.com/blog/post/2026-02-17-how-to-use-gemini-structured-output-and-json-mode-for-reliable-data-extraction/view)
