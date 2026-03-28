/**
 * Content aggregation script for the Knowledge Hub.
 *
 * Fetches interview-prep content from free APIs:
 * - HackerNews (Algolia API)
 * - Reddit (RSS feeds)
 * - dev.to (REST API)
 * - YouTube (RSS feeds)
 *
 * Categorizes by keyword matching, deduplicates, and outputs JSON.
 * Run: `pnpm tsx scripts/fetch-hub-content.ts`
 * Scheduled: GitHub Actions daily cron
 */

import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Types ──

interface RawArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  sourceName: string;
  sourceIcon: string;
  domain: string;
  category: string;
  tags: string[];
  excerpt: string;
  publishedAt: string;
  score: number;
  commentCount: number;
  readingTime: number;
  discussionUrl: string | null;
  interviewQuestions?: string[];
  interviewFormats?: string[];
  sourceCorroboration?: number;
  topics?: string[];
  difficulty?: string;
  sentiment?: string;
  actionability?: number;
}

// ── Category keywords ──

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  dsa: [
    "leetcode", "algorithm", "data structure", "dynamic programming", "binary search",
    "linked list", "tree", "graph", "sorting", "recursion", "backtracking",
    "greedy", "heap", "stack", "queue", "hash", "array", "string manipulation",
    "sliding window", "two pointer", "dfs", "bfs", "trie", "union find",
    "coding interview", "coding challenge", "competitive programming",
    "big o", "time complexity", "space complexity",
  ],
  "system-design": [
    "system design", "distributed system", "microservice", "load balancer",
    "database design", "caching", "cdn", "message queue", "api design",
    "scalability", "high availability", "consistency", "cap theorem",
    "rate limiting", "sharding", "replication", "event driven",
    "architecture", "infrastructure", "kubernetes", "docker",
    "ci/cd", "monitoring", "observability", "devops",
    "cloud architecture", "aws", "gcp", "azure",
    "serverless", "edge computing", "data pipeline",
    "streaming", "kafka", "redis", "elasticsearch",
    "security architecture", "zero trust", "oauth",
    "mobile architecture", "ios", "android", "react native", "flutter",
  ],
  "ai-ml": [
    "machine learning", "deep learning", "neural network", "nlp",
    "transformer", "llm", "gpt", "claude", "gemini", "openai",
    "fine-tuning", "rag", "embedding", "vector database", "prompt engineering",
    "ai agent", "reinforcement learning", "computer vision", "pytorch",
    "tensorflow", "hugging face", "diffusion", "generative ai",
    "ml interview", "ml system design", "mlops", "feature engineering",
    "model deployment", "ai infrastructure",
    "ai-enabled interview", "ai-assisted coding", "coderpad ai",
    "ai code review", "ai pair programming", "ai screening",
  ],
  behavioral: [
    "behavioral interview", "star method", "soar method", "car method",
    "leadership", "conflict resolution", "teamwork", "communication",
    "amazon leadership", "culture fit", "emotional intelligence",
    "tell me about a time", "strengths", "weaknesses", "career goal",
    "behavioral simulation", "situational interview", "role play interview",
    "soft skills interview", "people management", "cross-functional",
    "stakeholder management", "difficult conversation", "feedback",
    "why do you want to work", "biggest challenge", "failure example",
  ],
  "interview-experience": [
    "interview experience", "interview process", "interview loop",
    "onsite interview", "phone screen", "technical round", "hiring manager round",
    "final round", "got the offer", "got rejected", "interview timeline",
    "interview feedback", "interview debrief", "coding round",
    "system design round", "take home assignment", "live coding",
    "whiteboard interview", "virtual onsite", "recruiter call",
    "offer received", "interview prep journey", "my interview at",
    "just interviewed at", "interview went well", "failed interview",
    "passed interview", "interview tips from", "what to expect",
  ],
  compensation: [
    "compensation", "total comp", "tc", "salary", "base salary",
    "stock options", "rsu", "equity", "signing bonus", "annual bonus",
    "offer negotiation", "salary negotiation", "pay band", "level",
    "sde1", "sde2", "sde3", "staff engineer", "senior engineer",
    "principal engineer", "e3", "e4", "e5", "e6", "e7", "l3", "l4", "l5", "l6", "l7",
    "compensation thread", "salary sharing", "pay transparency",
    "highest paying", "top paying", "faang comp", "big tech salary",
    "offer comparison", "competing offers", "counter offer",
  ],
  career: [
    "career", "job search", "resume", "portfolio", "networking",
    "remote work", "freelance", "promotion", "career switch",
    "tech industry", "layoff", "hiring", "recruiter", "job market",
    "onboarding", "career advice", "mentor", "return to office",
    "hiring freeze", "job hopping", "visa sponsorship", "h1b",
    "bootcamp", "self-taught", "career transition", "manager track",
    "staff engineer path", "principal engineer", "ic vs manager",
    "startup vs big tech", "work life balance", "burnout",
  ],
};

const INTERVIEW_KEYWORDS = [
  "interview", "hiring", "job", "career", "preparation", "prep",
  "practice", "study", "review", "guide", "tutorial", "learn",
  "tips", "advice", "experience", "question", "answer", "solution",
  ...Object.values(CATEGORY_KEYWORDS).flat(),
];

// ── Interview format patterns ──

const FORMAT_PATTERNS: Record<string, RegExp[]> = {
  "AI-Assisted Coding": [/ai[- ]?(enabled|assisted|powered)\s*(coding|interview)/i, /coderpad\s*ai/i, /ai\s*pair\s*programming/i],
  "Online Assessment": [/online\s*assessment/i, /\boa\b/i, /hackerrank/i, /codesignal/i],
  "Take-Home Project": [/take[- ]?home/i, /homework\s*assignment/i, /project[- ]?based/i],
  "Whiteboard": [/whiteboard/i, /white\s*board/i],
  "Live Coding": [/live\s*coding/i, /coderpad/i, /codility/i, /pair\s*programming/i],
  "System Design": [/system\s*design\s*(round|interview)/i, /hld\s*(round|interview)/i],
  "Behavioral": [/behavioral\s*(round|interview)/i, /culture\s*fit/i, /hiring\s*manager\s*round/i],
  "Phone Screen": [/phone\s*screen/i, /recruiter\s*call/i, /initial\s*screen/i],
};

// ── Source icons (base64-free, use simple identifiers) ──

const SOURCE_ICONS = {
  hackernews: "https://news.ycombinator.com/favicon.ico",
  reddit: "https://www.reddit.com/favicon.ico",
  devto: "https://dev.to/favicon.ico",
  youtube: "https://www.youtube.com/favicon.ico",
  medium: "https://medium.com/favicon.ico",
  newsletter: "https://substack.com/favicon.ico",
  glassdoor: "https://www.glassdoor.com/favicon.ico",
} as const;

// ── AI Classification (Gemini 2.5 Flash-Lite) ──

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const CATEGORIES_DESCRIPTION = `Categories for interview prep content:
- dsa: Data structures, algorithms, LeetCode, competitive programming, coding challenges
- system-design: System design, distributed systems, architecture, infrastructure, DevOps, cloud
- ai-ml: Machine learning, deep learning, LLMs, AI agents, ML system design, MLOps
- behavioral: Behavioral interviews, STAR method, leadership, soft skills, culture fit
- interview-experience: Interview experiences, process descriptions, rounds, feedback, outcomes
- compensation: Salary, total comp, offers, negotiation, RSUs, equity, levels, pay bands
- career: Job search, resume, career advice, promotions, job market, networking
- general: Content that doesn't clearly fit other categories`;

// ── Unified AI Enrichment (ADR-003 Sprint A) ──

interface EnrichmentResult {
  enrichments: Array<{
    index: number;
    category: string;
    summary: string;
    topics: string[];
    difficulty: string;
    sentiment: string;
    actionability: number;
  }>;
}

interface EnrichedFields {
  category: string;
  summary: string;
  topics: string[];
  difficulty: string;
  sentiment: string;
  actionability: number;
}

async function enrichBatchWithGemini(
  articles: { title: string; tags: string[]; excerpt: string; source: string }[]
): Promise<(EnrichedFields | null)[]> {
  if (!GEMINI_API_KEY) return articles.map(() => null);

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const prompt = articles
    .map(
      (a, i) =>
        `[${i}] Title: ${a.title}\nSource: ${a.source}\nTags: ${a.tags.join(", ") || "none"}\nExcerpt: ${a.excerpt.slice(0, 300)}`
    )
    .join("\n\n");

  const systemPrompt = `Analyze each article for interview prep value.

Categories: dsa, system-design, ai-ml, behavioral, career, interview-experience, compensation, general

${CATEGORIES_DESCRIPTION}

For each article return:
- category: best-fit category from the list above
- summary: 2-3 sentence summary focused on interview prep value
- topics: 2-3 specific sub-topics (e.g., "binary search", "rate limiting", "TC negotiation")
- difficulty: beginner, intermediate, or advanced
- sentiment: positive, negative, or neutral (about the interview/career topic)
- actionability: 0.0-1.0 how actionable is the advice (1.0 = step-by-step guide, 0.0 = purely theoretical)`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: `${systemPrompt}\n\nArticles:\n${prompt}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object" as const,
          properties: {
            enrichments: {
              type: "array" as const,
              items: {
                type: "object" as const,
                properties: {
                  index: { type: "number" as const },
                  category: {
                    type: "string" as const,
                    enum: ["dsa", "system-design", "ai-ml", "behavioral", "career", "interview-experience", "compensation", "general"] as const,
                  },
                  summary: { type: "string" as const },
                  topics: {
                    type: "array" as const,
                    items: { type: "string" as const },
                  },
                  difficulty: {
                    type: "string" as const,
                    enum: ["beginner", "intermediate", "advanced"] as const,
                  },
                  sentiment: {
                    type: "string" as const,
                    enum: ["positive", "negative", "neutral"] as const,
                  },
                  actionability: { type: "number" as const },
                },
                required: ["index", "category", "summary", "topics", "difficulty", "sentiment", "actionability"],
              },
            },
          },
          required: ["enrichments"],
        },
      },
    });

    const text = response.text ?? "";
    const result: EnrichmentResult = JSON.parse(text);

    const enrichments: (EnrichedFields | null)[] = articles.map(() => null);
    for (const e of result.enrichments) {
      if (e.index >= 0 && e.index < articles.length) {
        enrichments[e.index] = {
          category: e.category,
          summary: e.summary,
          topics: Array.isArray(e.topics) ? e.topics.slice(0, 3) : [],
          difficulty: e.difficulty,
          sentiment: e.sentiment,
          actionability: typeof e.actionability === "number" ? Math.max(0, Math.min(1, e.actionability)) : 0,
        };
      }
    }
    return enrichments;
  } catch (err) {
    console.warn("Gemini enrichment failed, falling back to keyword classification:", (err as Error).message);
    return articles.map(() => null);
  }
}

async function enrichWithAI(
  articles: { title: string; tags: string[]; excerpt: string; source: string }[]
): Promise<EnrichedFields[]> {
  const BATCH_SIZE = 20;
  const results: (EnrichedFields | null)[] = new Array(articles.length).fill(null);

  const batches: number[][] = [];
  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    batches.push(Array.from({ length: Math.min(BATCH_SIZE, articles.length - i) }, (_, j) => i + j));
  }

  const CONCURRENCY = 5;
  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const chunk = batches.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      chunk.map(async (indices) => {
        const batchArticles = indices.map((idx) => articles[idx]!);
        const enrichments = await enrichBatchWithGemini(batchArticles);
        return { indices, enrichments };
      })
    );
    for (const { indices, enrichments } of batchResults) {
      for (let j = 0; j < indices.length; j++) {
        results[indices[j]!] = enrichments[j] ?? null;
      }
    }
  }

  // Fall back to keyword classification for failed/null results
  return results.map((enriched, i) => {
    if (enriched) return enriched;
    const a = articles[i]!;
    return {
      category: categorize(a.title, a.tags),
      summary: a.excerpt,
      topics: [],
      difficulty: "",
      sentiment: "",
      actionability: 0,
    };
  });
}

// ── Utility functions ──

function categorize(title: string, tags: string[] = []): string {
  const text = `${title} ${tags.join(" ")}`.toLowerCase();

  const scores: Record<string, number> = {
    dsa: 0,
    "system-design": 0,
    "ai-ml": 0,
    behavioral: 0,
    "interview-experience": 0,
    compensation: 0,
    career: 0,
  };

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        scores[category] = (scores[category] ?? 0) + 1;
      }
    }
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return "general";

  // Priority order: specific categories beat generic ones when scores tie
  const priority = [
    "interview-experience", "compensation", "dsa", "system-design",
    "ai-ml", "behavioral", "career",
  ];
  const best = priority.find((cat) => scores[cat] === maxScore);
  return best ?? "general";
}

function isRelevant(title: string, tags: string[] = []): boolean {
  const text = `${title} ${tags.join(" ")}`.toLowerCase();
  return INTERVIEW_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "unknown";
  }
}

function estimateReadingTime(text: string): number {
  const wordCount = text.split(/\s+/).length;
  return Math.max(1, Math.round(wordCount / 200));
}

/** Normalize URL for dedup — strip tracking params, www, trailing slash, protocol */
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Strip tracking/analytics params
    for (const p of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref", "source", "si", "feature", "fbclid", "gclid"]) {
      u.searchParams.delete(p);
    }
    // Normalize: remove www, trailing slash, lowercase
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname.replace(/\/$/, "");
    const search = u.search === "?" ? "" : u.search;
    return `${host}${path}${search}`.toLowerCase();
  } catch {
    return url.replace(/\/$/, "").toLowerCase();
  }
}

function deduplicateByUrl(articles: RawArticle[]): RawArticle[] {
  const seenUrls = new Set<string>();
  const seenIds = new Set<string>();
  return articles.filter((a) => {
    const urlKey = normalizeUrl(a.url);
    if (seenUrls.has(urlKey) || seenIds.has(a.id)) return false;
    seenUrls.add(urlKey);
    seenIds.add(a.id);
    return true;
  });
}

/** FNV-1a 32-bit hash for SimHash token hashing */
function fnv1a32(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash;
}

/** 32-bit SimHash fingerprint for near-duplicate title detection */
function simhash(text: string): number {
  const tokens = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 0;
  const v = new Array(32).fill(0);
  for (const token of tokens) {
    const hash = fnv1a32(token);
    for (let i = 0; i < 32; i++) {
      v[i] += (hash >>> i) & 1 ? 1 : -1;
    }
  }
  let fingerprint = 0;
  for (let i = 0; i < 32; i++) {
    if (v[i]! > 0) fingerprint |= 1 << i;
  }
  return fingerprint >>> 0;
}

/** Hamming distance between two 32-bit integers */
function hammingDistance(a: number, b: number): number {
  let xor = (a ^ b) >>> 0;
  let count = 0;
  while (xor > 0) { count += xor & 1; xor >>>= 1; }
  return count;
}

// ── Question deduplication ──

/** Jaccard similarity between two string arrays */
function jaccardSimilarity(a: readonly string[], b: readonly string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  const setA = new Set(a.map(s => s.toLowerCase()));
  const setB = new Set(b.map(s => s.toLowerCase()));
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Deduplicate questions using SimHash on text + Jaccard on topics */
function deduplicateQuestions(questions: import("@tulmek/core/domain").InterviewQuestion[]): import("@tulmek/core/domain").InterviewQuestion[] {
  const kept: import("@tulmek/core/domain").InterviewQuestion[] = [];
  const fingerprints: number[] = [];

  for (const q of questions) {
    const fp = simhash(q.question);

    // Check against existing questions
    let isDupe = false;
    for (let i = 0; i < kept.length; i++) {
      const textSimilar = hammingDistance(fp, fingerprints[i]!) < 6; // more lenient than article dedup
      const topicSimilar = jaccardSimilarity(q.topics, kept[i]!.topics) > 0.5;

      if (textSimilar || (topicSimilar && hammingDistance(fp, fingerprints[i]!) < 10)) {
        // Merge: keep the one with more detail, combine sources
        const existing = kept[i]!;
        kept[i] = {
          ...existing,
          sourceArticleIds: [...new Set([...existing.sourceArticleIds, ...q.sourceArticleIds])],
          reportCount: existing.reportCount + q.reportCount,
          companies: [...existing.companies, ...q.companies.filter(
            c => !existing.companies.some(ec => ec.slug === c.slug)
          )],
          topics: [...new Set([...existing.topics, ...q.topics])],
          hints: [...new Set([...existing.hints, ...q.hints])],
          lastReportedAt: q.lastReportedAt > existing.lastReportedAt ? q.lastReportedAt : existing.lastReportedAt,
          firstReportedAt: q.firstReportedAt < existing.firstReportedAt ? q.firstReportedAt : existing.firstReportedAt,
        };
        isDupe = true;
        break;
      }
    }

    if (!isDupe) {
      kept.push(q);
      fingerprints.push(fp);
    }
  }

  return kept;
}

/** Remove near-duplicate articles by title similarity (SimHash, Hamming distance < 4) */
function deduplicateByTitle(articles: RawArticle[]): RawArticle[] {
  const kept: RawArticle[] = [];
  const fingerprints: number[] = [];

  for (const article of articles) {
    const fp = simhash(article.title);
    const dupeIdx = fingerprints.findIndex((existing) => hammingDistance(fp, existing) < 4);

    if (dupeIdx === -1) {
      kept.push(article);
      fingerprints.push(fp);
    } else if (article.score > kept[dupeIdx]!.score) {
      // Keep higher-engagement version
      kept[dupeIdx] = article;
      fingerprints[dupeIdx] = fp;
    }
  }

  return kept;
}

// ── Interview question extraction (regex-based) ──

/** Extract interview questions from article title and excerpt using pattern matching */
function extractInterviewQuestions(title: string, excerpt: string): string[] {
  const text = `${title} ${excerpt}`;
  const questions: string[] = [];
  const seen = new Set<string>();

  // Pattern 1: Sentences ending with "?"
  const questionSentences = text.match(/[^.!?\n]*\?/g);
  if (questionSentences) {
    for (const q of questionSentences) {
      const cleaned = q.replace(/^\s*[-–—•*]\s*/, "").trim();
      // Skip very short or very long strings, or non-question noise
      if (cleaned.length >= 15 && cleaned.length <= 300) {
        const lower = cleaned.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          questions.push(cleaned);
        }
      }
    }
  }

  // Pattern 2: "asked about X" / "was asked to X" / "asked me X"
  const askedPatterns = text.match(/(?:was\s+)?asked\s+(?:about|to|me|us|them)\s+[^.!?\n]{10,120}[.!?]?/gi);
  if (askedPatterns) {
    for (const match of askedPatterns) {
      const cleaned = match.trim().replace(/[.!]$/, "");
      const lower = cleaned.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        questions.push(cleaned);
      }
    }
  }

  // Pattern 3: "interview question: X" / "interview question - X"
  const labeledPatterns = text.match(/interview\s+questions?\s*[:–—-]\s*[^.!?\n]{10,200}[.!?]?/gi);
  if (labeledPatterns) {
    for (const match of labeledPatterns) {
      const cleaned = match.replace(/^interview\s+questions?\s*[:–—-]\s*/i, "").trim();
      const lower = cleaned.toLowerCase();
      if (cleaned.length >= 10 && !seen.has(lower)) {
        seen.add(lower);
        questions.push(cleaned);
      }
    }
  }

  // Cap at 10 questions per article
  return questions.slice(0, 10);
}

// ── Fetchers ──

async function fetchHackerNews(): Promise<RawArticle[]> {
  console.log("  Fetching HackerNews...");
  const articles: RawArticle[] = [];

  const queries = [
    "interview", "system design", "leetcode", "coding interview",
    "machine learning interview", "career advice software",
    "algorithm", "data structure", "ai engineer",
    "interview experience", "compensation", "salary tech",
    "offer negotiation", "total compensation",
    "who is hiring", "ask hn hiring",
  ];

  for (const query of queries) {
    try {
      const res = await fetch(
        `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=20`
      );
      if (!res.ok) continue;
      const data = await res.json() as {
        hits: Array<{
          objectID: string;
          title: string;
          url: string;
          points: number;
          num_comments: number;
          created_at: string;
          _tags?: string[];
        }>;
      };

      for (const hit of data.hits) {
        if (!hit.url || !hit.title) continue;
        if (!isRelevant(hit.title, hit._tags)) continue;

        articles.push({
          id: `hackernews:${hit.objectID}`,
          title: hit.title,
          url: hit.url,
          source: "hackernews",
          sourceName: "Hacker News",
          sourceIcon: SOURCE_ICONS.hackernews,
          domain: extractDomain(hit.url),
          category: categorize(hit.title, hit._tags),
          tags: hit._tags?.slice(0, 5) ?? [],
          excerpt: hit.title,
          publishedAt: hit.created_at,
          score: hit.points ?? 0,
          commentCount: hit.num_comments ?? 0,
          readingTime: 5,
          discussionUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
        });
      }
    } catch (err) {
      console.warn(`  Warning: HN query "${query}" failed:`, (err as Error).message);
    }
  }

  return articles;
}

async function fetchReddit(): Promise<RawArticle[]> {
  console.log("  Fetching Reddit...");
  const articles: RawArticle[] = [];

  const subreddits = [
    "cscareerquestions", "leetcode", "systemdesign",
    "ExperiencedDevs", "MachineLearning", "artificial",
    "datascience", "programming",
    // Interview experiences & compensation focused
    "interviews", "csMajors", "SoftwareEngineering",
    "devops", "dataengineering",
    // Regional & role-specific
    "cscareerquestionsEU", "developersIndia",
    "recruitinghell",
  ];

  // Fetch both /hot (trending) and /new (freshest) for each subreddit
  const endpoints = ["hot", "new"] as const;
  for (const sub of subreddits) {
    for (const endpoint of endpoints) {
    try {
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/${endpoint}.json?limit=15`,
        { headers: { "User-Agent": "tulmek-hub/1.0" } }
      );
      if (!res.ok) continue;
      const data = await res.json() as {
        data: {
          children: Array<{
            data: {
              id: string;
              title: string;
              url: string;
              permalink: string;
              selftext: string;
              score: number;
              num_comments: number;
              created_utc: number;
              link_flair_text?: string;
              is_self: boolean;
            };
          }>;
        };
      };

      for (const { data: post } of data.data.children) {
        if (!post.title) continue;
        const tags = [sub, post.link_flair_text].filter(Boolean) as string[];
        if (!isRelevant(post.title, tags)) continue;

        const rawUrl = post.is_self
          ? `https://www.reddit.com${post.permalink}`
          : post.url;
        // Ensure absolute URL (some Reddit posts have relative URLs)
        const url = rawUrl.startsWith("http") ? rawUrl : `https://www.reddit.com${rawUrl}`;

        articles.push({
          id: `reddit:${post.id}`,
          title: post.title,
          url,
          source: "reddit",
          sourceName: `r/${sub}`,
          sourceIcon: SOURCE_ICONS.reddit,
          domain: post.is_self ? "reddit.com" : extractDomain(post.url),
          category: categorize(post.title, tags),
          tags,
          excerpt: post.selftext
            ? post.selftext.slice(0, 200).replace(/\n/g, " ").trim()
            : post.title,
          publishedAt: new Date(post.created_utc * 1000).toISOString(),
          score: post.score,
          commentCount: post.num_comments,
          readingTime: post.selftext ? estimateReadingTime(post.selftext) : 3,
          discussionUrl: `https://www.reddit.com${post.permalink}`,
        });
      }
    } catch (err) {
      console.warn(`  Warning: Reddit r/${sub}/${endpoint} failed:`, (err as Error).message);
    }
    }
  }

  return articles;
}

async function fetchRedditSearch(): Promise<RawArticle[]> {
  console.log("  Fetching Reddit search (interview exp + compensation)...");
  const articles: RawArticle[] = [];

  // Targeted searches across subreddits for specific content types
  const searches = [
    // Interview experiences
    { sub: "cscareerquestions", query: "interview experience", sort: "new" },
    { sub: "leetcode", query: "interview experience", sort: "new" },
    { sub: "ExperiencedDevs", query: "interview process", sort: "new" },
    // Compensation
    { sub: "cscareerquestions", query: "total compensation TC", sort: "new" },
    { sub: "cscareerquestions", query: "salary sharing thread", sort: "top" },
    { sub: "cscareerquestions", query: "offer negotiation", sort: "new" },
    { sub: "ExperiencedDevs", query: "compensation", sort: "new" },
    // Domain-specific interviews (real value for ALL domains)
    { sub: "devops", query: "interview", sort: "new" },
    { sub: "dataengineering", query: "interview", sort: "new" },
    { sub: "cybersecurity", query: "interview", sort: "new" },
    { sub: "iOSProgramming", query: "interview", sort: "new" },
    { sub: "androiddev", query: "interview", sort: "new" },
    { sub: "aws", query: "interview", sort: "new" },
    { sub: "golang", query: "interview", sort: "new" },
    { sub: "rust", query: "interview", sort: "new" },
  ];

  for (const { sub, query, sort } of searches) {
    try {
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(query)}&sort=${sort}&restrict_sr=on&limit=10&t=month`,
        { headers: { "User-Agent": "tulmek-hub/1.0" } }
      );
      if (!res.ok) continue;
      const data = await res.json() as {
        data: {
          children: Array<{
            data: {
              id: string;
              title: string;
              url: string;
              permalink: string;
              selftext: string;
              score: number;
              num_comments: number;
              created_utc: number;
              link_flair_text?: string;
              is_self: boolean;
            };
          }>;
        };
      };

      for (const { data: post } of data.data.children) {
        if (!post.title) continue;
        const tags = [sub, post.link_flair_text, query.split(" ")[0]].filter(Boolean) as string[];

        const rawUrl = post.is_self
          ? `https://www.reddit.com${post.permalink}`
          : post.url;
        const url = rawUrl.startsWith("http") ? rawUrl : `https://www.reddit.com${rawUrl}`;

        articles.push({
          id: `reddit:${post.id}`,
          title: post.title,
          url,
          source: "reddit",
          sourceName: `r/${sub}`,
          sourceIcon: SOURCE_ICONS.reddit,
          domain: post.is_self ? "reddit.com" : extractDomain(post.url),
          category: categorize(post.title, tags),
          tags,
          excerpt: post.selftext
            ? post.selftext.slice(0, 200).replace(/\n/g, " ").trim()
            : post.title,
          publishedAt: new Date(post.created_utc * 1000).toISOString(),
          score: post.score,
          commentCount: post.num_comments,
          readingTime: post.selftext ? estimateReadingTime(post.selftext) : 3,
          discussionUrl: `https://www.reddit.com${post.permalink}`,
        });
      }
    } catch (err) {
      console.warn(`  Warning: Reddit search "${query}" in r/${sub} failed:`, (err as Error).message);
    }
  }

  return articles;
}

async function fetchDevTo(): Promise<RawArticle[]> {
  console.log("  Fetching dev.to...");
  const articles: RawArticle[] = [];

  const tags = [
    "interview", "algorithms", "systemdesign", "career",
    "machinelearning", "ai", "programming", "webdev",
    "datastructures", "leetcode", "salary", "jobs",
    "hiring", "resume", "softwareengineering",
    "devops", "cloud", "security", "mobile", "database",
    "golang", "rust", "python", "java", "typescript",
  ];

  for (const tag of tags) {
    try {
      const res = await fetch(
        `https://dev.to/api/articles?tag=${tag}&per_page=15&top=1`
      );
      if (!res.ok) continue;
      const data = await res.json() as Array<{
        id: number;
        title: string;
        url: string;
        description: string;
        tag_list: string[];
        positive_reactions_count: number;
        comments_count: number;
        published_at: string;
        reading_time_minutes: number;
      }>;

      for (const post of data) {
        if (!isRelevant(post.title, post.tag_list)) continue;

        articles.push({
          id: `devto:${post.id}`,
          title: post.title,
          url: post.url,
          source: "devto",
          sourceName: "DEV Community",
          sourceIcon: SOURCE_ICONS.devto,
          domain: "dev.to",
          category: categorize(post.title, post.tag_list),
          tags: post.tag_list.slice(0, 5),
          excerpt: post.description || post.title,
          publishedAt: post.published_at,
          score: post.positive_reactions_count,
          commentCount: post.comments_count,
          readingTime: post.reading_time_minutes || 5,
          discussionUrl: post.url,
        });
      }
    } catch (err) {
      console.warn(`  Warning: dev.to tag "${tag}" failed:`, (err as Error).message);
    }
  }

  return articles;
}

async function fetchGitHub(): Promise<RawArticle[]> {
  console.log("  Fetching GitHub...");
  const articles: RawArticle[] = [];

  const queries = [
    "interview questions", "system design", "leetcode",
    "coding interview", "algorithm", "design patterns",
  ];

  for (const query of queries) {
    try {
      const res = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}+stars:>100&sort=updated&order=desc&per_page=5`,
        { headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "tulmek-hub/1.0" } }
      );
      if (!res.ok) continue;
      const data = await res.json() as {
        items: Array<{
          id: number;
          full_name: string;
          html_url: string;
          description: string;
          stargazers_count: number;
          language: string;
          topics: string[];
          updated_at: string;
        }>;
      };

      for (const repo of data.items) {
        if (!repo.description || repo.stargazers_count < 50) continue;
        const tags = [...(repo.topics ?? []).slice(0, 5), repo.language].filter(Boolean) as string[];

        articles.push({
          id: `github:${repo.id}`,
          title: `${repo.full_name} — ${repo.description.slice(0, 120)}`,
          url: repo.html_url,
          source: "github",
          sourceName: "GitHub",
          sourceIcon: "https://github.com/favicon.ico",
          domain: "github.com",
          category: categorize(repo.full_name + " " + repo.description, tags),
          tags,
          excerpt: repo.description,
          publishedAt: repo.updated_at,
          score: repo.stargazers_count,
          commentCount: 0,
          readingTime: 5,
          discussionUrl: repo.html_url,
        });
      }
    } catch (err) {
      console.warn(`  Warning: GitHub "${query}" failed:`, (err as Error).message);
    }
  }

  return articles;
}

async function fetchLeetCode(): Promise<RawArticle[]> {
  console.log("  Fetching LeetCode Discuss...");
  const articles: RawArticle[] = [];

  // Fetch from Interview + Compensation tabs using the REAL GraphQL API
  // Discovered by inspecting network requests on leetcode.com/discuss/
  const tabs = [
    { tagSlug: "interview", label: "Interview Experience", category: "interview-experience" },
    { tagSlug: "compensation", label: "Compensation", category: "compensation" },
  ];

  // Fetch both HOT (quality) and MOST_RECENT (freshness) for each tab
  const orderings = ["HOT", "MOST_RECENT"] as const;

  for (const { tagSlug, label, category } of tabs) {
    for (const orderBy of orderings) {
      try {
        const res = await fetch("https://leetcode.com/graphql/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Referer": "https://leetcode.com",
          },
          body: JSON.stringify({
            query: `query { ugcArticleDiscussionArticles(orderBy: ${orderBy}, keywords: [""], tagSlugs: ["${tagSlug}"], skip: 0, first: 30) { edges { node { uuid title slug summary createdAt hitCount topicId reactions { count reactionType } } } } }`,
          }),
        });

        if (!res.ok) continue;
        const data = await res.json() as {
          data: {
            ugcArticleDiscussionArticles: {
              edges: Array<{
                node: {
                  uuid: string;
                  title: string;
                  slug: string;
                  summary: string;
                  createdAt: string;
                  hitCount: number;
                  topicId: number;
                  reactions: Array<{ count: number; reactionType: string }>;
                };
              }>;
            };
          };
        };

        for (const { node } of data.data.ugcArticleDiscussionArticles.edges) {
          if (!node.title || node.title.startsWith("[Guidelines]") || node.title.startsWith("How to write")) continue;

          const likes = node.reactions
            ?.filter((r) => r.reactionType === "UPVOTE")
            .reduce((sum, r) => sum + r.count, 0) ?? 0;

          articles.push({
            id: `leetcode:${node.uuid}`,
            title: node.title,
            url: `https://leetcode.com/discuss/${tagSlug}/${node.topicId}`,
            source: "leetcode" as string,
            sourceName: `LeetCode ${label}`,
            sourceIcon: "https://leetcode.com/favicon.ico",
            domain: "leetcode.com",
            category,
            tags: [tagSlug, "leetcode"],
            excerpt: node.summary || node.title,
            publishedAt: node.createdAt,
            score: likes,
            commentCount: 0,
            readingTime: 4,
            discussionUrl: `https://leetcode.com/discuss/${tagSlug}/${node.topicId}`,
          });
        }
      } catch (err) {
        console.warn(`  Warning: LeetCode "${tagSlug}" ${orderBy} failed:`, (err as Error).message);
      }
    }
  }

  return articles;
}

async function fetchLeetCodeDaily(): Promise<RawArticle[]> {
  console.log("  Fetching LeetCode Daily Challenge...");
  try {
    const res = await fetch("https://leetcode.com/graphql/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Referer": "https://leetcode.com",
      },
      body: JSON.stringify({
        query: "query questionOfToday { activeDailyCodingChallengeQuestion { date link question { questionId title titleSlug difficulty topicTags { name } } } }",
      }),
    });

    if (!res.ok) {
      console.warn(`  Warning: LeetCode Daily returned ${res.status}`);
      return [];
    }

    const data = await res.json() as {
      data: {
        activeDailyCodingChallengeQuestion: {
          date: string;
          link: string;
          question: {
            questionId: string;
            title: string;
            titleSlug: string;
            difficulty: string;
            topicTags: Array<{ name: string }>;
          };
        };
      };
    };

    const daily = data.data.activeDailyCodingChallengeQuestion;
    if (!daily) return [];

    const { date, link, question } = daily;
    const tags = question.topicTags.map((t) => t.name);
    const readingTime =
      question.difficulty === "Hard" ? 45 :
      question.difficulty === "Medium" ? 30 : 15;

    return [{
      id: `leetcode:daily-${date}`,
      title: `LeetCode Daily | ${question.title} (${question.difficulty})`,
      url: `https://leetcode.com${link}`,
      source: "leetcode",
      sourceName: "LeetCode Daily",
      sourceIcon: "https://leetcode.com/favicon.ico",
      domain: "leetcode.com",
      category: "dsa",
      tags,
      excerpt: `Today's LeetCode daily challenge: ${question.title} — ${question.difficulty} difficulty. Topics: ${tags.join(", ") || "N/A"}.`,
      publishedAt: new Date(date).toISOString(),
      score: 100,
      commentCount: 0,
      readingTime,
      discussionUrl: `https://leetcode.com${link}`,
    }];
  } catch (err) {
    console.warn("  Warning: LeetCode Daily failed:", (err as Error).message);
    return [];
  }
}

async function fetchMedium(): Promise<RawArticle[]> {
  console.log("  Fetching Medium...");
  const articles: RawArticle[] = [];

  const topics = [
    "interview-tips", "system-design", "algorithms",
    "career-advice", "software-engineering", "machine-learning",
    "coding-interviews", "data-structures",
  ];

  for (const topic of topics) {
    try {
      const res = await fetch(`https://medium.com/feed/tag/${topic}`);
      if (!res.ok) continue;
      const xml = await res.text();

      const items = xml.split("<item>").slice(1);
      for (const item of items.slice(0, 8)) {
        const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
        const linkMatch = item.match(/<link>(.*?)<\/link>/);
        const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
        const creatorMatch = item.match(/<dc:creator><!\[CDATA\[(.*?)\]\]><\/dc:creator>/);

        if (!titleMatch?.[1] || !linkMatch?.[1]) continue;

        const title = titleMatch[1];
        if (!isRelevant(title, [topic])) continue;

        // Clean the URL (remove query params)
        const url = linkMatch[1].split("?")[0] ?? linkMatch[1];

        articles.push({
          id: `medium:${Buffer.from(url).toString("base64url").slice(0, 40)}`,
          title,
          url,
          source: "medium",
          sourceName: creatorMatch?.[1] ? `${creatorMatch[1]} on Medium` : "Medium",
          sourceIcon: SOURCE_ICONS.medium,
          domain: "medium.com",
          category: categorize(title, [topic]),
          tags: [topic.replace(/-/g, " ")],
          excerpt: title,
          publishedAt: pubDateMatch?.[1] ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
          score: 0,
          commentCount: 0,
          readingTime: 7,
          discussionUrl: url,
        });
      }
    } catch (err) {
      console.warn(`  Warning: Medium topic "${topic}" failed:`, (err as Error).message);
    }
  }

  return articles;
}

async function fetchYouTube(): Promise<RawArticle[]> {
  console.log("  Fetching YouTube...");
  const articles: RawArticle[] = [];

  // Interview prep & tech career YouTube channels
  const channels: Record<string, string> = {
    "UCnxrdFPXJMeLlRY7BbHqjEQ": "Neetcode",
    "UC_mYaQAE6-71rjSN6CeCA-g": "NeetCode Main",
    "UC0RhatS1pyxInC00YKjjBqQ": "Gaurav Sen",
    "UCRPMAqdtSgd0Ipeef7iFsKw": "Gaurav Sen System Design",
    "UCZLJf_R2sWyUtXSKiKDNINQ": "ByteByteGo",
    "UCWN3xxRkmTPphYnPVaKY9Jg": "NeetCodeIO",
    "UCRPMAqdtSgd0Ipeef7ber0Q": "Fireship",
    "UC8butISFwT-Wl7EV0hUK0BQ": "freeCodeCamp",
    "UCW5YeuERMmlnqo4oq8vwUpg": "The Net Ninja",
    "UC-8QAzbLcRglXeN_MY9blyw": "Ben Awad",
    "UCsBjURrPoezykLs9EqgamOA": "Fireship",
    "UCvjgXvBlCQM1_MNPhlegFuA": "Clement Mihailescu",
    "UC59K-uG2A5ogFAoYnTkLLhQ": "Telusko",
    "UCMHXTmzNepBYaXzYh-Y9Kfg": "Tech with Tim",
  };

  for (const [channelId, channelName] of Object.entries(channels)) {
    try {
      const res = await fetch(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
      );
      if (!res.ok) continue;
      const xml = await res.text();

      // Simple XML parsing for RSS entries
      const entries = xml.split("<entry>").slice(1);
      for (const entry of entries.slice(0, 10)) {
        const titleMatch = entry.match(/<title>(.*?)<\/title>/);
        const linkMatch = entry.match(/<link rel="alternate" href="(.*?)"/);
        const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
        const idMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);

        if (!titleMatch?.[1] || !linkMatch?.[1] || !idMatch?.[1]) continue;

        const title = titleMatch[1]
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"');

        if (!isRelevant(title)) continue;

        const videoUrl = linkMatch[1];
        articles.push({
          id: `youtube:${idMatch[1]}`,
          title,
          url: videoUrl,
          source: "youtube",
          sourceName: channelName,
          sourceIcon: SOURCE_ICONS.youtube,
          domain: "youtube.com",
          category: categorize(title),
          tags: ["video", channelName.toLowerCase().replace(/\s/g, "-")],
          excerpt: `${channelName}: ${title}`,
          publishedAt: publishedMatch?.[1] ?? new Date().toISOString(),
          score: 0,
          commentCount: 0,
          readingTime: 15,
          discussionUrl: videoUrl,
        });
      }
    } catch (err) {
      console.warn(`  Warning: YouTube channel failed:`, (err as Error).message);
    }
  }

  return articles;
}

// ── Newsletters (Substack RSS) ──

async function fetchNewsletters(): Promise<RawArticle[]> {
  console.log("  Fetching Newsletters...");
  const articles: RawArticle[] = [];

  const feeds: Record<string, string> = {
    "https://blog.bytebytego.com/feed": "ByteByteGo",
    "https://blog.algomaster.io/feed": "AlgoMaster",
    "https://designgurus.substack.com/feed": "System Design Nuggets",
    "https://newsletter.systemdesign.one/feed": "System Design Newsletter",
    "https://newsletter.pragmaticengineer.com/feed": "Pragmatic Engineer",
    "https://www.developing.dev/feed": "The Developing Dev",
    "https://read.highgrowthengineer.com/feed": "High Growth Engineer",
    "https://newsletter.systemdesigncodex.com/feed": "System Design Codex",
    "https://newsletter.systemdesignclassroom.com/feed": "System Design Classroom",
    "https://feed.infoq.com/presentations/": "InfoQ Presentations",
    "https://www.hellointerview.com/blog/rss.xml": "Hello Interview",
    "https://interviewing.io/blog/feed": "interviewing.io",
    "https://www.levels.fyi/blog/rss.xml": "Levels.fyi Blog",
    // AI & Career focused
    "https://www.lennysnewsletter.com/feed": "Lenny's Newsletter",
    "https://hellointerview.substack.com/feed": "Hello Interview Newsletter",
    "https://blog.tryexponent.com/rss/": "Exponent Blog",
    "https://www.techinterviewhandbook.org/blog/rss.xml": "Tech Interview Handbook",
    "https://grokkingtechcareer.substack.com/feed": "Grokking Tech Career",
    "https://fangprep.substack.com/feed": "FANG Prep",
    "https://read.engineerscodex.com/feed": "Engineer's Codex",
    "https://levelupwithethan.substack.com/feed": "Level Up",
    // Podcast feeds
    "https://se-radio.net/feed/": "Software Engineering Radio",
    "https://feeds.changelog.com/thechangelog": "The Changelog",
    "https://feeds.simplecast.com/JGE3yC0V": "Software Engineering Daily",
  };

  for (const [feedUrl, name] of Object.entries(feeds)) {
    try {
      const res = await fetch(feedUrl, {
        headers: { "User-Agent": "TULMEK Hub Content Aggregator" },
      });
      if (!res.ok) continue;
      const xml = await res.text();

      const items = xml.split("<item>").slice(1);
      for (const item of items.slice(0, 10)) {
        const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ??
                           item.match(/<title>(.*?)<\/title>/);
        const linkMatch = item.match(/<link>(.*?)<\/link>/);
        const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
        const descMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ??
                          item.match(/<description>(.*?)<\/description>/);

        // Podcast: richer description sources
        const contentMatch = item.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/);
        const itunesSummary = item.match(/<itunes:summary><!\[CDATA\[([\s\S]*?)\]\]><\/itunes:summary>/) ??
                              item.match(/<itunes:summary>(.*?)<\/itunes:summary>/);

        // Podcast: episode page URL may be in <enclosure> url attribute or guid
        const enclosureUrlMatch = item.match(/<enclosure[^>]+url="([^"]+)"/);
        const guidMatch = item.match(/<guid[^>]*isPermaLink="true"[^>]*>(.*?)<\/guid>/) ??
                          item.match(/<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/);

        if (!titleMatch?.[1]) continue;

        const title = titleMatch[1].replace(/<[^>]+>/g, "").trim();

        // Resolve the episode web page URL: prefer <link>, then guid permalink,
        // then fall back to feed base URL with a title slug for podcast-only feeds.
        const rawUrl: string | undefined =
          linkMatch?.[1] ??
          guidMatch?.[1] ??
          (enclosureUrlMatch ? `${feedUrl.replace(/\/feed\/?$/, "")}/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}` : undefined);

        if (!rawUrl) continue;

        const url = rawUrl.split("?")[0] ?? rawUrl;
        const publishedAt = pubDateMatch?.[1]
          ? new Date(pubDateMatch[1]).toISOString()
          : new Date().toISOString();

        // Extract plain text excerpt — prefer richest non-empty source
        const toPlainText = (html: string) =>
          html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);

        let excerpt = title;
        if (descMatch?.[1] && descMatch[1].trim().length > 10) {
          excerpt = toPlainText(descMatch[1]);
        } else if (contentMatch?.[1]) {
          excerpt = toPlainText(contentMatch[1]);
        } else if (itunesSummary?.[1]) {
          excerpt = toPlainText(itunesSummary[1]);
        }

        // Podcast: use <itunes:duration> for reading time if available
        const durationMatch = item.match(/<itunes:duration>(.*?)<\/itunes:duration>/);
        let readingTime = estimateReadingTime(excerpt);
        if (durationMatch?.[1]) {
          const parts = durationMatch[1].split(":").map(Number);
          if (parts.length === 3) {
            readingTime = (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
          } else if (parts.length === 2) {
            readingTime = parts[0] ?? readingTime;
          } else {
            readingTime = Math.ceil((parts[0] ?? 300) / 60);
          }
        }

        let domain: string;
        try {
          domain = new URL(url).hostname;
        } catch {
          continue;
        }

        articles.push({
          id: `newsletter:${Buffer.from(url).toString("base64url").slice(0, 40)}`,
          title,
          url,
          source: "newsletter",
          sourceName: name,
          sourceIcon: SOURCE_ICONS.newsletter,
          domain,
          category: categorize(title),
          tags: ["newsletter"],
          excerpt: excerpt || title,
          score: 0,
          commentCount: 0,
          readingTime,
          publishedAt,
          discussionUrl: null,
        });
      }
    } catch (err) {
      console.warn(`  Warning: Newsletter ${name} failed:`, (err as Error).message);
    }
  }

  return articles;
}

// ── HN "Who's Hiring" thread parser ──

async function fetchHNHiring(): Promise<RawArticle[]> {
  console.log("  Fetching HN Who's Hiring...");
  const articles: RawArticle[] = [];

  try {
    // Search for the latest "Who is hiring" thread
    const res = await fetch(
      "https://hn.algolia.com/api/v1/search?query=%22who%20is%20hiring%22&tags=ask_hn&hitsPerPage=1"
    );
    if (!res.ok) return articles;
    const data = await res.json() as { hits: Array<{ objectID: string; title: string; created_at: string; num_comments: number; points: number }> };

    const thread = data.hits[0];
    if (!thread) return articles;

    // Fetch top-level comments (job postings)
    const commentsRes = await fetch(
      `https://hn.algolia.com/api/v1/items/${thread.objectID}`
    );
    if (!commentsRes.ok) return articles;
    const threadData = await commentsRes.json() as {
      children: Array<{
        id: number;
        text: string;
        created_at: string;
        author: string;
      }>;
    };

    // Each top-level comment is a job posting
    for (const comment of (threadData.children ?? []).slice(0, 50)) {
      if (!comment.text || comment.text.length < 50) continue;

      // Extract company name from first line (usually "Company Name | Location | ...")
      const firstLine = comment.text.replace(/<[^>]+>/g, "").split("\n")[0] ?? "";
      const companyMatch = firstLine.match(/^([^|]+)/);
      const company = companyMatch?.[1]?.trim() ?? "Unknown";

      // Clean HTML from text
      const cleanText = comment.text
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 500);

      articles.push({
        id: `hackernews:hiring-${comment.id}`,
        title: `${company.slice(0, 100)} is hiring — HN Who's Hiring`,
        url: `https://news.ycombinator.com/item?id=${comment.id}`,
        source: "hackernews",
        sourceName: "HN Who's Hiring",
        sourceIcon: SOURCE_ICONS.hackernews,
        domain: "news.ycombinator.com",
        category: "career",
        tags: ["hiring", "job-posting", company.toLowerCase()],
        excerpt: cleanText,
        publishedAt: comment.created_at ?? new Date().toISOString(),
        score: 10,
        commentCount: 0,
        readingTime: 1,
        discussionUrl: `https://news.ycombinator.com/item?id=${thread.objectID}`,
        interviewQuestions: [],
        interviewFormats: [],
      });
    }
  } catch (err) {
    console.warn("  Warning: HN Who's Hiring failed:", (err as Error).message);
  }

  return articles;
}

// ── Glassdoor interview reviews (via OpenWeb Ninja RapidAPI) ──

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

// Top companies to fetch interview reviews for (IDs from Glassdoor)
const GLASSDOOR_COMPANIES: { id: string; name: string }[] = [
  { id: "E9079", name: "Google" },
  { id: "E6036", name: "Amazon" },
  { id: "E40772", name: "Meta" },
  { id: "E1138", name: "Apple" },
  { id: "E1651", name: "Microsoft" },
  { id: "E432534", name: "OpenAI" },
  { id: "E7671", name: "Uber" },
  { id: "E497017", name: "Stripe" },
  { id: "E1099726", name: "Anthropic" },
  { id: "E2356", name: "Netflix" },
];

async function fetchGlassdoor(): Promise<RawArticle[]> {
  if (!RAPIDAPI_KEY) {
    console.log("  Skipping Glassdoor (no RAPIDAPI_KEY)");
    return [];
  }
  console.log("  Fetching Glassdoor interviews...");
  const articles: RawArticle[] = [];

  // Fetch top 5 companies per cycle to stay under free tier (100 req/month)
  const companies = GLASSDOOR_COMPANIES.slice(0, 5);

  for (const company of companies) {
    try {
      const res = await fetch(
        `https://real-time-glassdoor-data.p.rapidapi.com/company-interviews?company_id=${company.id}`,
        {
          headers: {
            "x-rapidapi-key": RAPIDAPI_KEY,
            "x-rapidapi-host": "real-time-glassdoor-data.p.rapidapi.com",
          },
        }
      );
      if (!res.ok) {
        console.warn(`  Warning: Glassdoor ${company.name} returned ${res.status}`);
        continue;
      }

      const data = await res.json() as {
        interviews?: Array<{
          interview_id?: string;
          job_title?: string;
          difficulty?: string;
          experience?: string;
          outcome?: string;
          process_description?: string;
          questions?: string[];
          review_datetime?: string;
          advice?: string;
        }>;
      };

      if (!data.interviews) continue;

      for (const interview of data.interviews) {
        if (!interview.process_description || !interview.job_title) continue;

        const title = `${company.name} | ${interview.job_title} | Interview Experience${interview.outcome ? ` (${interview.outcome})` : ""}`;
        const tags = [
          interview.difficulty ?? "",
          interview.experience ?? "",
          ...(interview.questions?.slice(0, 3) ?? []),
        ].filter(Boolean);

        const excerpt = [
          interview.process_description.slice(0, 300),
          interview.advice ? `Advice: ${interview.advice.slice(0, 100)}` : "",
        ].filter(Boolean).join(" — ");

        if (!isRelevant(title, tags)) continue;

        articles.push({
          id: `glassdoor:${interview.interview_id ?? `${company.id}-${articles.length}`}`,
          title,
          url: `https://www.glassdoor.com/Interview/${company.name.replace(/\s/g, "-")}-Interview-Questions-${company.id}.htm`,
          source: "glassdoor",
          sourceName: "Glassdoor",
          sourceIcon: SOURCE_ICONS.glassdoor,
          domain: "glassdoor.com",
          category: categorize(title, tags),
          tags,
          excerpt,
          publishedAt: interview.review_datetime ?? new Date().toISOString(),
          score: interview.difficulty === "Hard" ? 50 : interview.difficulty === "Medium" ? 30 : 10,
          commentCount: 0,
          readingTime: 2,
          discussionUrl: null,
        });
      }
    } catch (err) {
      console.warn(`  Warning: Glassdoor ${company.name} failed:`, (err as Error).message);
    }
  }

  return articles;
}

// ── Job board fetchers ──

async function fetchRemoteOK(): Promise<RawArticle[]> {
  console.log("  Fetching RemoteOK...");
  const articles: RawArticle[] = [];
  try {
    const res = await fetch("https://remoteok.com/api", {
      headers: { "User-Agent": "TULMEK Hub Content Aggregator" },
    });
    if (!res.ok) return articles;
    const data = await res.json() as Array<{
      id?: string; slug?: string; company?: string; position?: string;
      tags?: string[]; description?: string; location?: string;
      salary_min?: number; salary_max?: number; date?: string; url?: string;
    }>;
    // First element is metadata, skip it
    for (const job of data.slice(1, 30)) {
      if (!job.position || !job.company) continue;
      const salary = job.salary_min && job.salary_max
        ? ` ($${Math.round(job.salary_min/1000)}K-$${Math.round(job.salary_max/1000)}K)`
        : "";
      articles.push({
        id: `remoteok:${job.id ?? job.slug ?? articles.length}`,
        title: `${job.company} | ${job.position}${salary}`,
        url: job.url ?? `https://remoteok.com/remote-jobs/${job.slug}`,
        source: "newsletter", // reuse existing source type
        sourceName: "RemoteOK",
        sourceIcon: "https://remoteok.com/favicon.ico",
        domain: "remoteok.com",
        category: "career",
        tags: [...(job.tags ?? []).flat().map(String).slice(0, 5), "remote", "hiring"],
        excerpt: (job.description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300),
        publishedAt: job.date ?? new Date().toISOString(),
        score: 10,
        commentCount: 0,
        readingTime: 1,
        discussionUrl: null,
        interviewQuestions: [],
        interviewFormats: [],
      });
    }
  } catch (err) {
    console.warn("  Warning: RemoteOK failed:", (err as Error).message);
  }
  return articles;
}

async function fetchJobicy(): Promise<RawArticle[]> {
  console.log("  Fetching Jobicy...");
  const articles: RawArticle[] = [];
  try {
    const res = await fetch("https://jobicy.com/api/v2/remote-jobs?count=30&tag=engineer");
    if (!res.ok) return articles;
    const data = await res.json() as { jobs?: Array<{
      id?: number; url?: string; jobTitle?: string; companyName?: string;
      jobExcerpt?: string; pubDate?: string; jobGeo?: string;
      salaryMin?: number; salaryMax?: number; salaryCurrency?: string;
    }> };
    for (const job of data.jobs ?? []) {
      if (!job.jobTitle || !job.companyName) continue;
      const salary = job.salaryMin && job.salaryMax
        ? ` (${job.salaryCurrency ?? "$"}${Math.round(job.salaryMin/1000)}K-${Math.round(job.salaryMax/1000)}K)`
        : "";
      articles.push({
        id: `jobicy:${job.id ?? articles.length}`,
        title: `${job.companyName} | ${job.jobTitle}${salary} | ${job.jobGeo ?? "Remote"}`,
        url: job.url ?? "https://jobicy.com",
        source: "newsletter",
        sourceName: "Jobicy",
        sourceIcon: "https://jobicy.com/favicon.ico",
        domain: "jobicy.com",
        category: "career",
        tags: ["remote", "hiring", "job-posting"],
        excerpt: (job.jobExcerpt ?? "").replace(/<[^>]+>/g, " ").trim().slice(0, 300),
        publishedAt: job.pubDate ?? new Date().toISOString(),
        score: 10,
        commentCount: 0,
        readingTime: 1,
        discussionUrl: null,
        interviewQuestions: [],
        interviewFormats: [],
      });
    }
  } catch (err) {
    console.warn("  Warning: Jobicy failed:", (err as Error).message);
  }
  return articles;
}

async function fetchHimalayas(): Promise<RawArticle[]> {
  console.log("  Fetching Himalayas...");
  const articles: RawArticle[] = [];
  try {
    const res = await fetch("https://himalayas.app/jobs/api?limit=30");
    if (!res.ok) return articles;
    const data = await res.json() as { jobs?: Array<{
      id?: string; title?: string; companyName?: string; excerpt?: string;
      pubDate?: string; applicationLink?: string; seniority?: string;
      minSalary?: number; maxSalary?: number; categories?: string[];
    }> };
    for (const job of data.jobs ?? []) {
      if (!job.title || !job.companyName) continue;
      const salary = job.minSalary && job.maxSalary
        ? ` ($${Math.round(job.minSalary/1000)}K-$${Math.round(job.maxSalary/1000)}K)`
        : "";
      articles.push({
        id: `himalayas:${job.id ?? articles.length}`,
        title: `${job.companyName} | ${job.title}${salary}`,
        url: job.applicationLink ?? "https://himalayas.app",
        source: "newsletter",
        sourceName: "Himalayas",
        sourceIcon: "https://himalayas.app/favicon.ico",
        domain: "himalayas.app",
        category: "career",
        tags: [...(job.categories ?? []).slice(0, 3), "remote", "hiring", job.seniority ?? ""].filter(Boolean),
        excerpt: (job.excerpt ?? "").replace(/<[^>]+>/g, " ").trim().slice(0, 300),
        publishedAt: job.pubDate ?? new Date().toISOString(),
        score: 10,
        commentCount: 0,
        readingTime: 1,
        discussionUrl: null,
        interviewQuestions: [],
        interviewFormats: [],
      });
    }
  } catch (err) {
    console.warn("  Warning: Himalayas failed:", (err as Error).message);
  }
  return articles;
}

// ── Greenhouse public job board API ──

const GREENHOUSE_BOARDS = {
  cloudflare: "Cloudflare",
  stripe: "Stripe",
  airbnb: "Airbnb",
  datadog: "Datadog",
  notion: "Notion",
  discord: "Discord",
  figma: "Figma",
  plaid: "Plaid",
} as const satisfies Record<string, string>;

const ENGINEERING_DEPT_PATTERN = /engineer|software|developer|sre|devops|infra|platform|data|machine learning|ml|ai|security|backend|frontend|fullstack|full-stack|mobile|cloud/i;

async function fetchGreenhouseJobs(): Promise<RawArticle[]> {
  console.log("  Fetching Greenhouse jobs...");
  const articles: RawArticle[] = [];

  for (const [boardToken, companyName] of Object.entries(GREENHOUSE_BOARDS)) {
    try {
      const res = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs`,
        { headers: { "User-Agent": "TULMEK Hub Content Aggregator" } }
      );
      if (!res.ok) continue;
      const data = await res.json() as {
        jobs: Array<{
          id: number;
          title: string;
          absolute_url: string;
          location: { name: string };
          departments: Array<{ name: string }>;
          updated_at: string;
        }>;
      };

      // Filter to engineering/software roles only
      const engineeringJobs = (data.jobs ?? []).filter((job) => {
        const dept = job.departments?.[0]?.name ?? "";
        return ENGINEERING_DEPT_PATTERN.test(job.title) || ENGINEERING_DEPT_PATTERN.test(dept);
      });

      for (const job of engineeringJobs.slice(0, 10)) {
        const department = job.departments?.[0]?.name ?? "";
        const location = job.location?.name ?? "Remote";
        const tags = ["hiring", "job-posting", ...(department ? [department.toLowerCase()] : [])];

        articles.push({
          id: `greenhouse:${boardToken}-${job.id}`,
          title: `${companyName} | ${job.title} | ${location}`,
          url: job.absolute_url,
          source: "newsletter",
          sourceName: "Greenhouse",
          sourceIcon: "https://greenhouse.io/favicon.ico",
          domain: "greenhouse.io",
          category: "career",
          tags,
          excerpt: `${companyName} is hiring a ${job.title}${location ? ` in ${location}` : ""}${department ? ` (${department})` : ""}.`,
          publishedAt: job.updated_at ?? new Date().toISOString(),
          score: 10,
          commentCount: 0,
          readingTime: 1,
          discussionUrl: null,
          interviewQuestions: [],
          interviewFormats: [],
        });
      }
    } catch (err) {
      console.warn(`  Warning: Greenhouse ${companyName} failed:`, (err as Error).message);
    }
  }

  return articles;
}

// ── Lever public job board API ──

const LEVER_COMPANIES = {
  netflix: "Netflix",
  vercel: "Vercel",
  confluent: "Confluent",
  netlify: "Netlify",
} as const satisfies Record<string, string>;

async function fetchLeverJobs(): Promise<RawArticle[]> {
  console.log("  Fetching Lever jobs...");
  const articles: RawArticle[] = [];

  for (const [companySlug, companyName] of Object.entries(LEVER_COMPANIES)) {
    try {
      const res = await fetch(
        `https://api.lever.co/v0/postings/${companySlug}?mode=json`,
        { headers: { "User-Agent": "TULMEK Hub Content Aggregator" } }
      );
      if (!res.ok) continue;
      const data = await res.json() as Array<{
        id: string;
        text: string;
        hostedUrl: string;
        applyUrl: string;
        categories: {
          commitment?: string;
          department?: string;
          location?: string;
          team?: string;
        };
        createdAt: number;
        updatedAt?: number;
      }>;

      // Filter to engineering/software roles only
      const engineeringJobs = (data ?? []).filter((posting) => {
        const dept = posting.categories?.department ?? "";
        const team = posting.categories?.team ?? "";
        return ENGINEERING_DEPT_PATTERN.test(posting.text) || ENGINEERING_DEPT_PATTERN.test(dept) || ENGINEERING_DEPT_PATTERN.test(team);
      });

      for (const posting of engineeringJobs.slice(0, 10)) {
        const location = posting.categories?.location ?? "Remote";
        const department = posting.categories?.department ?? posting.categories?.team ?? "";
        const tags = ["hiring", "job-posting", ...(department ? [department.toLowerCase()] : [])];
        const publishedAt = posting.createdAt
          ? new Date(posting.createdAt).toISOString()
          : new Date().toISOString();

        articles.push({
          id: `lever:${companySlug}-${posting.id}`,
          title: `${companyName} | ${posting.text} | ${location}`,
          url: posting.hostedUrl ?? posting.applyUrl,
          source: "newsletter",
          sourceName: "Lever",
          sourceIcon: "https://lever.co/favicon.ico",
          domain: "jobs.lever.co",
          category: "career",
          tags,
          excerpt: `${companyName} is hiring a ${posting.text}${location ? ` in ${location}` : ""}${department ? ` (${department})` : ""}.`,
          publishedAt,
          score: 10,
          commentCount: 0,
          readingTime: 1,
          discussionUrl: null,
          interviewQuestions: [],
          interviewFormats: [],
        });
      }
    } catch (err) {
      console.warn(`  Warning: Lever ${companyName} failed:`, (err as Error).message);
    }
  }

  return articles;
}

async function fetchWarnFirehose(): Promise<RawArticle[]> {
  console.log("  Fetching WARN Firehose (layoff data)...");
  const articles: RawArticle[] = [];

  try {
    const res = await fetch("https://warnfirehose.com/api/search?q=tech+software+engineer&limit=20", {
      headers: { "User-Agent": "TULMEK Hub Content Aggregator" },
    });
    if (!res.ok) {
      console.warn(`  Warning: WARN Firehose returned ${res.status}`);
      return articles;
    }

    const data = await res.json() as { results?: Array<{
      id?: string;
      company_name?: string;
      number_affected?: number;
      notice_date?: string;
      state?: string;
      layoff_date?: string;
      reason?: string;
    }> };

    for (const notice of (data.results ?? []).slice(0, 20)) {
      if (!notice.company_name) continue;

      const affected = notice.number_affected ? ` (${notice.number_affected} affected)` : "";
      const state = notice.state ? ` — ${notice.state}` : "";

      articles.push({
        id: `warn:${notice.id ?? `${notice.company_name}-${articles.length}`}`,
        title: `${notice.company_name} | WARN Notice${affected}${state}`,
        url: `https://warnfirehose.com/search?q=${encodeURIComponent(notice.company_name)}`,
        source: "newsletter",
        sourceName: "WARN Firehose",
        sourceIcon: "https://warnfirehose.com/favicon.ico",
        domain: "warnfirehose.com",
        category: "career",
        tags: ["layoff", "warn-notice", "hiring-freeze", notice.state ?? ""].filter(Boolean),
        excerpt: `WARN layoff notice: ${notice.company_name}${affected}. ${notice.reason ?? ""}. Notice date: ${notice.notice_date ?? "unknown"}.`.trim(),
        publishedAt: notice.notice_date ? new Date(notice.notice_date).toISOString() : new Date().toISOString(),
        score: 20,
        commentCount: 0,
        readingTime: 1,
        discussionUrl: null,
        interviewQuestions: [],
        interviewFormats: [],
      });
    }
  } catch (err) {
    console.warn("  Warning: WARN Firehose failed:", (err as Error).message);
  }

  return articles;
}

// ── Interview Question Intelligence (IQI) — Gemini extraction ──

interface ExtractedQuestion {
  question: string;
  format: string;
  difficulty: string;
  round: string;
  company: string;
  level: string;
  role: string;
  topics: string[];
  hints: string[];
  expectedTimeMinutes: number | null;
}

async function extractQuestionsWithGemini(
  articles: Array<{ id: string; title: string; excerpt: string; category: string; source: string; publishedAt: string }>
): Promise<Map<string, ExtractedQuestion[]>> {
  if (!GEMINI_API_KEY) return new Map();

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  // Only process question-rich categories
  const targetCategories = new Set(["interview-experience", "dsa", "system-design", "behavioral", "ai-ml", "compensation"]);
  const eligible = articles.filter(a => targetCategories.has(a.category));

  const results = new Map<string, ExtractedQuestion[]>();
  const BATCH = 10; // Smaller batches for richer extraction

  for (let i = 0; i < eligible.length; i += BATCH) {
    const batch = eligible.slice(i, i + BATCH);
    const prompt = batch.map((a, idx) =>
      `[${idx}] Title: ${a.title}\nExcerpt: ${a.excerpt.slice(0, 400)}`
    ).join("\n\n");

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: `Extract actual interview questions from these articles. Only extract questions that were actually asked in interviews, not article titles rephrased as questions.\n\nFor each article, return 0-5 questions with: question text, format (dsa/system-design/behavioral/ai-ml/unknown), difficulty (easy/medium/hard/unknown), round (onsite-coding/phone-screen/online-assessment/onsite-system-design/onsite-behavioral/ai-assisted-coding/unknown), company name, level, role, topics (2-3 tags), hints (if mentioned), expectedTimeMinutes.\n\nArticles:\n${prompt}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object" as const,
            properties: {
              extractions: {
                type: "array" as const,
                items: {
                  type: "object" as const,
                  properties: {
                    articleIndex: { type: "number" as const },
                    questions: {
                      type: "array" as const,
                      items: {
                        type: "object" as const,
                        properties: {
                          question: { type: "string" as const },
                          format: { type: "string" as const },
                          difficulty: { type: "string" as const },
                          round: { type: "string" as const },
                          company: { type: "string" as const },
                          level: { type: "string" as const },
                          role: { type: "string" as const },
                          topics: { type: "array" as const, items: { type: "string" as const } },
                          hints: { type: "array" as const, items: { type: "string" as const } },
                          expectedTimeMinutes: { type: "number" as const },
                        },
                        required: ["question", "format", "difficulty"],
                      },
                    },
                  },
                  required: ["articleIndex", "questions"],
                },
              },
            },
            required: ["extractions"],
          },
        },
      });

      const text = response.text ?? "";
      const parsed = JSON.parse(text) as { extractions: Array<{ articleIndex: number; questions: ExtractedQuestion[] }> };

      for (const extraction of parsed.extractions) {
        const article = batch[extraction.articleIndex];
        if (article && extraction.questions.length > 0) {
          results.set(article.id, extraction.questions.slice(0, 5));
        }
      }
    } catch (err) {
      console.warn(`  Question extraction batch ${i}-${i + BATCH} failed:`, (err as Error).message);
    }
  }

  return results;
}

async function fetchGitHubTrending(): Promise<RawArticle[]> {
  console.log("  Fetching GitHub Trending...");
  const articles: RawArticle[] = [];

  try {
    const res = await fetch("https://mshibanami.github.io/GitHubTrendingRSS/daily/all.xml", {
      headers: { "User-Agent": "TULMEK Hub Content Aggregator" },
    });
    if (!res.ok) return articles;
    const xml = await res.text();

    const items = xml.split("<item>").slice(1, 16); // Top 15 trending
    for (const item of items) {
      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ??
                         item.match(/<title>(.*?)<\/title>/);
      const linkMatch = item.match(/<link>(.*?)<\/link>/);
      const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ??
                        item.match(/<description>(.*?)<\/description>/);
      const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);

      if (!titleMatch?.[1] || !linkMatch?.[1]) continue;

      const title = titleMatch[1].replace(/<[^>]+>/g, "").trim();
      const url = linkMatch[1].trim();
      const excerpt = (descMatch?.[1] ?? "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 300);

      // Only include repos relevant to interview prep topics
      const relevant = isRelevant(title, []) ||
        /interview|algorithm|data.structure|system.design|leetcode|coding|ai|ml|distributed|database/i.test(title + " " + excerpt);

      if (!relevant) continue;

      articles.push({
        id: `github-trending:${Buffer.from(url).toString("base64").slice(0, 20)}`,
        title: `Trending: ${title}`,
        url,
        source: "github",
        sourceName: "GitHub Trending",
        sourceIcon: "https://github.com/favicon.ico",
        domain: "github.com",
        category: categorize(title + " " + excerpt),
        tags: ["trending", "open-source", "skills-demand"],
        excerpt: excerpt || title,
        publishedAt: pubDateMatch?.[1] ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
        score: 50, // Trending repos get a baseline boost
        commentCount: 0,
        readingTime: 5,
        discussionUrl: url,
        interviewQuestions: [],
        interviewFormats: [],
      });
    }
  } catch (err) {
    console.warn("  Warning: GitHub Trending failed:", (err as Error).message);
  }

  return articles;
}

async function fetchH1BJobs(): Promise<RawArticle[]> {
  console.log("  Fetching H1B Jobs...");
  const articles: RawArticle[] = [];

  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/jobright-ai/Daily-H1B-Jobs-In-Tech/main/README.md",
      { headers: { "User-Agent": "TULMEK Hub Content Aggregator" } }
    );
    if (!res.ok) return articles;
    const md = await res.text();

    // Parse markdown table rows: | Company | Role | Location | Link | Date |
    const rows = md.split("\n").filter(line => line.startsWith("| ") && !line.includes("---") && !line.includes("Company"));

    for (const row of rows.slice(0, 30)) {
      const cols = row.split("|").map(c => c.trim()).filter(Boolean);
      if (cols.length < 4) continue;

      const company = cols[0] ?? "";
      const role = cols[1] ?? "";
      const location = cols[2] ?? "";
      // Extract URL from markdown link [text](url)
      const linkMatch = (cols[3] ?? "").match(/\[.*?\]\((.*?)\)/);
      const url = linkMatch?.[1] ?? "https://github.com/jobright-ai/Daily-H1B-Jobs-In-Tech";
      const date = cols[4] ?? "";

      if (!company || !role) continue;

      articles.push({
        id: `h1b:${Buffer.from(`${company}-${role}`).toString("base64").slice(0, 20)}`,
        title: `${company} | ${role} | H1B Visa Sponsorship | ${location}`,
        url,
        source: "newsletter",
        sourceName: "H1B Jobs",
        sourceIcon: "https://github.com/favicon.ico",
        domain: "github.com",
        category: "career",
        tags: ["h1b", "visa-sponsorship", "hiring", location.toLowerCase()].filter(Boolean),
        excerpt: `${company} is hiring ${role} with H1B visa sponsorship in ${location}. ${date}`,
        publishedAt: date ? new Date(date).toISOString() : new Date().toISOString(),
        score: 15,
        commentCount: 0,
        readingTime: 1,
        discussionUrl: null,
        interviewQuestions: [],
        interviewFormats: [],
      });
    }
  } catch (err) {
    console.warn("  Warning: H1B Jobs failed:", (err as Error).message);
  }

  return articles;
}

async function fetchArbeitnow(): Promise<RawArticle[]> {
  console.log("  Fetching Arbeitnow (EU jobs)...");
  const articles: RawArticle[] = [];
  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api", {
      headers: { "User-Agent": "TULMEK Hub Content Aggregator" },
    });
    if (!res.ok) return articles;
    const data = await res.json() as { data?: Array<{
      slug?: string; title?: string; company_name?: string;
      description?: string; created_at?: string; location?: string;
      tags?: string[]; url?: string;
    }> };

    for (const job of (data.data ?? []).slice(0, 25)) {
      if (!job.title || !job.company_name) continue;
      // Filter to tech/engineering roles
      const text = `${job.title} ${job.description ?? ""}`.toLowerCase();
      if (!/engineer|developer|software|devops|data|ml|ai|backend|frontend|fullstack/i.test(text)) continue;

      articles.push({
        id: `arbeitnow:${job.slug ?? `${job.company_name}-${articles.length}`}`,
        title: `${job.company_name} | ${job.title} | ${job.location ?? "Europe"}`,
        url: job.url ?? `https://www.arbeitnow.com/view/${job.slug}`,
        source: "newsletter",
        sourceName: "Arbeitnow",
        sourceIcon: "https://www.arbeitnow.com/favicon.ico",
        domain: "arbeitnow.com",
        category: "career",
        tags: [...(job.tags ?? []).slice(0, 3), "europe", "hiring"].filter(Boolean),
        excerpt: (job.description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300),
        publishedAt: job.created_at ? new Date(job.created_at).toISOString() : new Date().toISOString(),
        score: 10,
        commentCount: 0,
        readingTime: 1,
        discussionUrl: null,
        interviewQuestions: [],
        interviewFormats: [],
      });
    }
  } catch (err) {
    console.warn("  Warning: Arbeitnow failed:", (err as Error).message);
  }
  return articles;
}

async function fetchStackOverflow(): Promise<RawArticle[]> {
  console.log("  Fetching Stack Overflow...");
  const articles: RawArticle[] = [];

  const tags = ["interview", "system-design", "algorithms", "data-structures", "coding-interviews"];

  for (const tag of tags) {
    try {
      const res = await fetch(
        `https://api.stackexchange.com/2.3/questions?order=desc&sort=activity&tagged=${tag}&site=stackoverflow&filter=withbody&pagesize=5`,
        { headers: { "Accept-Encoding": "gzip" } }
      );
      if (!res.ok) continue;
      const data = await res.json() as { items?: Array<{
        question_id?: number;
        title?: string;
        link?: string;
        score?: number;
        answer_count?: number;
        tags?: string[];
        creation_date?: number;
        body?: string;
      }> };

      for (const q of data.items ?? []) {
        if (!q.title || !q.link || (q.score ?? 0) < 5) continue;

        const excerpt = (q.body ?? "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 300);

        articles.push({
          id: `stackoverflow:${q.question_id}`,
          title: q.title.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
          url: q.link,
          source: "newsletter",
          sourceName: "Stack Overflow",
          sourceIcon: "https://stackoverflow.com/favicon.ico",
          domain: "stackoverflow.com",
          category: categorize(q.title, q.tags ?? []),
          tags: (q.tags ?? []).slice(0, 5),
          excerpt: excerpt || q.title,
          publishedAt: q.creation_date ? new Date(q.creation_date * 1000).toISOString() : new Date().toISOString(),
          score: q.score ?? 0,
          commentCount: q.answer_count ?? 0,
          readingTime: 3,
          discussionUrl: q.link,
          interviewQuestions: [],
          interviewFormats: [],
        });
      }
    } catch (err) {
      console.warn(`  Warning: SO tag "${tag}" failed:`, (err as Error).message);
    }
  }

  return articles;
}

async function fetchArxiv(): Promise<RawArticle[]> {
  console.log("  Fetching arXiv papers...");
  const articles: RawArticle[] = [];

  const queries = [
    "cat:cs.DS+AND+ti:algorithm", // Data structures & algorithms
    "cat:cs.DC+AND+ti:distributed+system", // Distributed computing
    "cat:cs.AI+AND+ti:interview+OR+ti:hiring", // AI in hiring
  ];

  for (const query of queries) {
    try {
      const res = await fetch(
        `http://export.arxiv.org/api/query?search_query=${query}&max_results=5&sortBy=submittedDate&sortOrder=descending`
      );
      if (!res.ok) continue;
      const xml = await res.text();

      const entries = xml.split("<entry>").slice(1);
      for (const entry of entries) {
        const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
        const linkMatch = entry.match(/<id>(.*?)<\/id>/);
        const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
        const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
        const categoryMatch = entry.match(/<arxiv:primary_category.*?term="(.*?)"/);

        if (!titleMatch?.[1] || !linkMatch?.[1]) continue;

        const title = titleMatch[1].replace(/\s+/g, " ").trim();
        const url = linkMatch[1].trim();
        const summary = (summaryMatch?.[1] ?? "")
          .replace(/\s+/g, " ").trim().slice(0, 300);
        const category = categoryMatch?.[1] ?? "cs.AI";

        articles.push({
          id: `arxiv:${url.split("/abs/")[1] ?? url.slice(-15)}`,
          title: `[Paper] ${title}`,
          url: url.replace("http://", "https://"),
          source: "newsletter",
          sourceName: "arXiv",
          sourceIcon: "https://arxiv.org/favicon.ico",
          domain: "arxiv.org",
          category: category.startsWith("cs.DS") ? "dsa"
                  : category.startsWith("cs.DC") ? "system-design"
                  : "ai-ml",
          tags: ["research", "paper", category],
          excerpt: summary,
          publishedAt: publishedMatch?.[1] ?? new Date().toISOString(),
          score: 5,
          commentCount: 0,
          readingTime: 15,
          discussionUrl: null,
          interviewQuestions: [],
          interviewFormats: [],
        });
      }
    } catch (err) {
      console.warn(`  Warning: arXiv query failed:`, (err as Error).message);
    }
    // Rate limit: 1 request per 3 seconds
    await new Promise(r => setTimeout(r, 3000));
  }

  return articles;
}

async function fetchSimplifyJobs(): Promise<RawArticle[]> {
  console.log("  Fetching SimplifyJobs internships...");
  const articles: RawArticle[] = [];

  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md",
      { headers: { "User-Agent": "TULMEK Hub Content Aggregator" } }
    );
    if (!res.ok) return articles;
    const md = await res.text();

    // Parse markdown table: | Company | Role | Location | Application/Link | Date Posted |
    const lines = md.split("\n").filter(line =>
      line.startsWith("| ") && !line.includes("---") && !line.includes("Company")
    );

    for (const line of lines.slice(0, 30)) {
      const cols = line.split("|").map(c => c.trim()).filter(Boolean);
      if (cols.length < 4) continue;

      const company = cols[0]?.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim() ?? "";
      const role = cols[1]?.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim() ?? "";
      const location = cols[2]?.trim() ?? "";
      const linkMatch = (cols[3] ?? "").match(/\[.*?\]\((.*?)\)/);
      const url = linkMatch?.[1] ?? "https://github.com/SimplifyJobs/Summer2026-Internships";
      const date = cols[4]?.trim() ?? "";

      if (!company || !role || company === "↳") continue;

      articles.push({
        id: `simplify:${Buffer.from(`${company}-${role}`).toString("base64").slice(0, 20)}`,
        title: `${company} | ${role} | Internship | ${location}`,
        url,
        source: "newsletter",
        sourceName: "SimplifyJobs",
        sourceIcon: "https://github.com/favicon.ico",
        domain: "github.com",
        category: "career",
        tags: ["internship", "new-grad", "hiring", "entry-level"],
        excerpt: `${company} is hiring interns for ${role} in ${location}. ${date}`,
        publishedAt: date ? new Date(date).toISOString() : new Date().toISOString(),
        score: 10,
        commentCount: 0,
        readingTime: 1,
        discussionUrl: "https://github.com/SimplifyJobs/Summer2026-Internships",
        interviewQuestions: [],
        interviewFormats: [],
      });
    }
  } catch (err) {
    console.warn("  Warning: SimplifyJobs failed:", (err as Error).message);
  }

  return articles;
}

// ── Main ──

async function main() {
  console.log("🔄 Fetching hub content...\n");

  const [hn, reddit, redditSearch, devto, medium, leetcode, leetcodeDaily, github, githubTrending, youtube, newsletters, glassdoor, hnHiring, remoteok, jobicy, himalayas, greenhouse, lever, warnFirehose, h1bJobs, arbeitnow, stackoverflow, arxiv, simplifyJobs] = await Promise.all([
    fetchHackerNews(),
    fetchReddit(),
    fetchRedditSearch(),
    fetchDevTo(),
    fetchMedium(),
    fetchLeetCode(),
    fetchLeetCodeDaily(),
    fetchGitHub(),
    fetchGitHubTrending(),
    fetchYouTube(),
    fetchNewsletters(),
    fetchGlassdoor(),
    fetchHNHiring(),
    fetchRemoteOK(),
    fetchJobicy(),
    fetchHimalayas(),
    fetchGreenhouseJobs(),
    fetchLeverJobs(),
    fetchWarnFirehose(),
    fetchH1BJobs(),
    fetchArbeitnow(),
    fetchStackOverflow(),
    fetchArxiv(),
    fetchSimplifyJobs(),
  ]);

  console.log(`\n  HackerNews: ${hn.length} articles`);
  console.log(`  Reddit (feeds): ${reddit.length} articles`);
  console.log(`  Reddit (search): ${redditSearch.length} articles`);
  console.log(`  dev.to: ${devto.length} articles`);
  console.log(`  Medium: ${medium.length} articles`);
  console.log(`  LeetCode: ${leetcode.length} articles`);
  console.log(`  LeetCode Daily: ${leetcodeDaily.length} article`);
  console.log(`  GitHub: ${github.length} articles`);
  console.log(`  GitHub Trending: ${githubTrending.length} articles`);
  console.log(`  YouTube: ${youtube.length} articles`);
  console.log(`  Newsletters: ${newsletters.length} articles`);
  console.log(`  Glassdoor: ${glassdoor.length} articles`);
  console.log(`  HN Who's Hiring: ${hnHiring.length} articles`);
  console.log(`  RemoteOK: ${remoteok.length} articles`);
  console.log(`  Jobicy: ${jobicy.length} articles`);
  console.log(`  Himalayas: ${himalayas.length} articles`);
  console.log(`  Greenhouse: ${greenhouse.length} articles`);
  console.log(`  Lever: ${lever.length} articles`);
  console.log(`  WARN Firehose: ${warnFirehose.length} articles`);
  console.log(`  H1B Jobs: ${h1bJobs.length} articles`);
  console.log(`  Arbeitnow: ${arbeitnow.length} articles`);
  console.log(`  Stack Overflow: ${stackoverflow.length} articles`);
  console.log(`  arXiv: ${arxiv.length} articles`);
  console.log(`  SimplifyJobs: ${simplifyJobs.length} articles`);

  let all = [...hn, ...reddit, ...redditSearch, ...devto, ...medium, ...leetcode, ...leetcodeDaily, ...github, ...githubTrending, ...youtube, ...newsletters, ...glassdoor, ...hnHiring, ...remoteok, ...jobicy, ...himalayas, ...greenhouse, ...lever, ...warnFirehose, ...h1bJobs, ...arbeitnow, ...stackoverflow, ...arxiv, ...simplifyJobs];

  // ── Content staleness detection ──
  const sourceCounts: Record<string, number> = {};
  for (const a of all) {
    sourceCounts[a.source] = (sourceCounts[a.source] ?? 0) + 1;
  }

  const EXPECTED_SOURCES = ["hackernews", "reddit", "devto", "medium", "leetcode", "github", "youtube", "newsletter"];
  const warnings: string[] = [];

  for (const source of EXPECTED_SOURCES) {
    const count = sourceCounts[source] ?? 0;
    if (count === 0) {
      warnings.push(`⚠️ ALERT: ${source} returned 0 articles — source may be broken`);
    } else if (count < 5) {
      warnings.push(`⚠️ WARNING: ${source} only returned ${count} articles (unusually low)`);
    }
  }

  if (warnings.length > 0) {
    console.error("\n🚨 Content Staleness Alerts:");
    for (const w of warnings) console.error(`  ${w}`);
    // Exit with non-zero if critical sources are completely missing
    const criticalMissing = EXPECTED_SOURCES.filter(s => (sourceCounts[s] ?? 0) === 0);
    if (criticalMissing.length >= 3) {
      console.error(`\n❌ ${criticalMissing.length} sources completely failed — aborting to prevent data loss`);
      process.exit(1);
    }
  }

  // Write output to shared @tulmek/content package (single source of truth)
  const outputDir = join(__dirname, "..", "..", "..", "packages", "content", "src", "hub");

  // ── Total article count guard: abort if count dropped below 50% of previous ──
  const METADATA_PATH = join(outputDir, "metadata.json");
  try {
    const prevMeta = JSON.parse(readFileSync(METADATA_PATH, "utf-8")) as { totalArticles: number };
    const prevTotal = prevMeta.totalArticles;
    if (prevTotal > 0 && all.length < prevTotal * 0.5) {
      console.error(
        `\n❌ Article count dropped from ${prevTotal} to ${all.length} (${Math.round((all.length / prevTotal) * 100)}% of previous) — aborting to prevent data loss`
      );
      process.exit(1);
    }
  } catch {
    // No previous metadata — first run or missing file, skip guard
  }

  all = deduplicateByUrl(all);

  // Layer 2: SimHash near-duplicate title detection
  const beforeTitle = all.length;
  all = deduplicateByTitle(all);
  const titleDupes = beforeTitle - all.length;
  if (titleDupes > 0) {
    console.log(`  SimHash dedup removed ${titleDupes} near-duplicate titles`);
  }

  // ── Cross-source corroboration ──
  // When multiple sources discuss the same company, it's a stronger signal
  const CORROBORATION_COMPANIES = [
    "google", "amazon", "meta", "apple", "microsoft", "netflix",
    "uber", "stripe", "openai", "nvidia", "anthropic", "coinbase",
  ] as const;

  const companyMentions = new Map<string, Set<string>>(); // company → set of source IDs
  for (const article of all) {
    const lower = (article.title + " " + article.excerpt).toLowerCase();
    for (const company of CORROBORATION_COMPANIES) {
      if (lower.includes(company)) {
        const sources = companyMentions.get(company) ?? new Set();
        sources.add(article.source);
        companyMentions.set(company, sources);
      }
    }
  }

  for (const article of all) {
    const lower = (article.title + " " + article.excerpt).toLowerCase();
    let maxCorroboration = 0;
    for (const company of CORROBORATION_COMPANIES) {
      if (lower.includes(company)) {
        const sourceCount = companyMentions.get(company)?.size ?? 0;
        maxCorroboration = Math.max(maxCorroboration, sourceCount);
      }
    }
    article.sourceCorroboration = maxCorroboration;
  }

  const corroboratedCount = all.filter(a => (a.sourceCorroboration ?? 0) >= 3).length;
  if (corroboratedCount > 0) {
    console.log(`\n🔗 Cross-source corroboration: ${corroboratedCount} articles verified by 3+ sources`);
  }

  // Sort by score (engagement) descending, then by date
  all.sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (scoreDiff !== 0) return scoreDiff;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  mkdirSync(outputDir, { recursive: true });

  // ── AI enrichment cache ──
  // Avoid re-enriching articles whose titles haven't changed since last run.

  type AICacheEntry = {
    titleHash: string;
    category: string;
    summary: string;
    topics: string[];
    difficulty: string;
    sentiment: string;
    actionability: number;
    cachedAt: string;
  };
  const CACHE_PATH = join(outputDir, ".ai-cache.json");
  let aiCache: Record<string, AICacheEntry> = {};
  try {
    aiCache = JSON.parse(readFileSync(CACHE_PATH, "utf-8")) as Record<string, AICacheEntry>;
  } catch { /* first run or corrupt cache — start fresh */ }

  const titleHash = (s: string) => Buffer.from(s).toString("base64").slice(0, 20);

  // Partition articles into cache hits and misses
  let cacheHits = 0;
  const uncachedIndices: number[] = [];

  for (let i = 0; i < all.length; i++) {
    const article = all[i]!;
    const cached = aiCache[article.id];
    if (cached && cached.titleHash === titleHash(article.title)) {
      all[i] = {
        ...article,
        category: cached.category,
        excerpt: cached.summary || article.excerpt,
        topics: cached.topics ?? [],
        difficulty: cached.difficulty ?? "",
        sentiment: cached.sentiment ?? "",
        actionability: cached.actionability ?? 0,
      };
      cacheHits++;
    } else {
      uncachedIndices.push(i);
    }
  }

  const cacheMisses = uncachedIndices.length;
  const cacheRate = all.length > 0 ? Math.round((cacheHits / all.length) * 100) : 0;

  // AI enrichment step — single unified call replaces separate classify + summarize
  if (GEMINI_API_KEY) {
    console.log(`\n🤖 AI enrichment with Gemini Flash-Lite (unified pipeline)...`);
    console.log(`  Cache: ${cacheHits} hits, ${cacheMisses} misses (${cacheRate}% cache rate)`);

    if (uncachedIndices.length > 0) {
      const uncachedArticles = uncachedIndices.map((i) => all[i]!);

      // Unified enrich: category + summary + topics + difficulty + sentiment + actionability
      console.log(`  Enriching ${uncachedArticles.length} articles...`);
      const enriched = await enrichWithAI(
        uncachedArticles.map((a) => ({ title: a.title, tags: a.tags, excerpt: a.excerpt, source: a.source }))
      );

      const aiReclassified = enriched.filter((e, j) => e.category !== categorize(uncachedArticles[j]!.title, uncachedArticles[j]!.tags)).length;
      console.log(`  AI reclassified ${aiReclassified} articles vs keyword baseline`);
      console.log(`  Enrichment stats: topics=${enriched.filter(e => e.topics.length > 0).length}, difficulty=${enriched.filter(e => e.difficulty).length}, sentiment=${enriched.filter(e => e.sentiment).length}`);

      for (let j = 0; j < uncachedIndices.length; j++) {
        const idx = uncachedIndices[j]!;
        const article = all[idx]!;
        const e = enriched[j]!;
        all[idx] = {
          ...article,
          category: e.category,
          excerpt: e.summary || article.excerpt,
          topics: e.topics,
          difficulty: e.difficulty,
          sentiment: e.sentiment,
          actionability: e.actionability,
        };

        // Update cache with fresh enrichment results
        aiCache[article.id] = {
          titleHash: titleHash(article.title),
          category: e.category,
          summary: e.summary || article.excerpt,
          topics: e.topics,
          difficulty: e.difficulty,
          sentiment: e.sentiment,
          actionability: e.actionability,
          cachedAt: new Date().toISOString(),
        };
      }
    } else {
      console.log(`  All articles served from cache — skipping Gemini API calls`);
    }

    // Persist updated cache
    writeFileSync(CACHE_PATH, JSON.stringify(aiCache, null, 2));
  } else {
    console.log("\n📝 Using keyword classification (set GEMINI_API_KEY for AI enrichment)");
  }

  const now = new Date().toISOString();

  // ── Interview question extraction ──
  // Extract questions from interview-experience and dsa articles only
  const QUESTION_CATEGORIES = new Set(["interview-experience", "dsa"]);
  let totalQuestions = 0;
  for (let i = 0; i < all.length; i++) {
    const a = all[i]!;
    if (QUESTION_CATEGORIES.has(a.category)) {
      const questions = extractInterviewQuestions(a.title, a.excerpt);
      if (questions.length > 0) {
        all[i] = { ...a, interviewQuestions: questions };
        totalQuestions += questions.length;
      }
    }
  }
  if (totalQuestions > 0) {
    console.log(`\n📝 Extracted ${totalQuestions} interview questions from ${QUESTION_CATEGORIES.size} categories`);
  }

  // ── Interview Format Detection ──
  for (let i = 0; i < all.length; i++) {
    const a = all[i]!;
    const text = `${a.title} ${a.excerpt}`;
    const formats: string[] = [];
    for (const [format, patterns] of Object.entries(FORMAT_PATTERNS)) {
      if (patterns.some(p => p.test(text))) {
        formats.push(format);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a as any).interviewFormats = formats;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const articlesWithFormats = all.filter(a => ((a as any).interviewFormats as string[]).length > 0).length;
  if (articlesWithFormats > 0) {
    console.log(`\n📋 Detected interview formats in ${articlesWithFormats} articles`);
  }

  // Add aggregatedAt timestamp and sanitize all fields
  const articles = all.map((a) => ({
    ...a,
    tags: (a.tags ?? []).flat().map(String).filter(Boolean),
    publishedAt: typeof a.publishedAt === "string" ? a.publishedAt : new Date(a.publishedAt).toISOString(),
    interviewQuestions: a.interviewQuestions ?? [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    interviewFormats: (a as any).interviewFormats ?? [],
    sourceCorroboration: a.sourceCorroboration ?? 0,
    topics: a.topics ?? [],
    difficulty: a.difficulty ?? "",
    sentiment: a.sentiment ?? "",
    actionability: a.actionability ?? 0,
    aggregatedAt: now,
  }));

  // Build metadata
  const sourceBreakdown: Record<string, number> = {};
  for (const a of articles) {
    sourceBreakdown[a.source] = (sourceBreakdown[a.source] ?? 0) + 1;
  }

  const categoryBreakdown: Record<string, number> = {};
  for (const a of articles) {
    categoryBreakdown[a.category] = (categoryBreakdown[a.category] ?? 0) + 1;
  }

  const metadata = {
    lastRefreshedAt: now,
    totalArticles: articles.length,
    sourceBreakdown,
    categoryBreakdown,
  };

  // ── Embedding generation + near-duplicate clustering (ADR-003 Sprint B) ──
  // Only runs when GEMINI_API_KEY is set. Writes embeddings.json alongside feed.json.
  if (GEMINI_API_KEY) {
    console.log(`\n🧠 Generating embeddings for ${articles.length} articles...`);

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const embeddingIndex: Record<string, number[]> = {};
    const EMBED_BATCH = 100;

    for (let i = 0; i < articles.length; i += EMBED_BATCH) {
      const batch = articles.slice(i, i + EMBED_BATCH);
      try {
        const texts = batch.map(
          (a) => `${a.title}. ${a.excerpt.slice(0, 200)}. ${a.category}`
        );
        const result = await ai.models.embedContent({
          model: "gemini-embedding-001",
          contents: texts,
          config: { outputDimensionality: 128 },
        });

        for (let j = 0; j < batch.length; j++) {
          const embedding = result.embeddings?.[j];
          if (embedding?.values && embedding.values.length > 0) {
            embeddingIndex[batch[j]!.id] = embedding.values;
          }
        }
      } catch (err) {
        console.warn(
          `  Embedding batch ${i}-${i + EMBED_BATCH} failed:`,
          (err as Error).message
        );
      }
    }

    // Find near-duplicates (cosine similarity > 0.92) using Union-Find-like grouping
    const { cosineSimilarity } = await import("@tulmek/core/domain");
    const ids = Object.keys(embeddingIndex);
    const nearDuplicates: Record<string, string[]> = {};
    const assigned = new Set<string>();

    for (let i = 0; i < ids.length; i++) {
      const primaryId = ids[i]!;
      if (assigned.has(primaryId)) continue;
      const group: string[] = [];

      for (let j = i + 1; j < ids.length; j++) {
        const candidateId = ids[j]!;
        if (assigned.has(candidateId)) continue;
        const sim = cosineSimilarity(
          embeddingIndex[primaryId]!,
          embeddingIndex[candidateId]!
        );
        if (sim > 0.92) {
          group.push(candidateId);
          assigned.add(candidateId);
        }
      }

      if (group.length > 0) {
        nearDuplicates[primaryId] = group;
        assigned.add(primaryId);
      }
    }

    const dupCount = Object.values(nearDuplicates).reduce((s, g) => s + g.length, 0);
    console.log(
      `  Generated ${ids.length} embeddings, found ${dupCount} near-duplicates in ${Object.keys(nearDuplicates).length} groups`
    );

    const embeddingsPayload = { articles: embeddingIndex, nearDuplicates };
    const embeddingsPath = join(outputDir, "embeddings.json");
    writeFileSync(embeddingsPath, JSON.stringify(embeddingsPayload, null, 0));
    const sizeKB = Math.round(
      Buffer.byteLength(JSON.stringify(embeddingsPayload)) / 1024
    );
    console.log(`  Wrote embeddings to packages/content/src/hub/embeddings.json (${sizeKB}KB)`);
  }

  // ── Interview Question Intelligence (IQI) extraction ──
  if (GEMINI_API_KEY) {
    console.log(`\n🧠 Extracting interview questions from ${articles.length} articles...`);
    const questionMap = await extractQuestionsWithGemini(articles);

    // Build question bank
    const questionBank: import("@tulmek/core/domain").InterviewQuestion[] = [];
    const seen = new Set<string>();

    for (const [articleId, questions] of questionMap) {
      const article = articles.find(a => a.id === articleId);
      if (!article) continue;

      for (const q of questions) {
        // Pre-filter: skip very short or exact-duplicate normalized text
        const normalized = q.question.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
        if (normalized.length < 10) continue;
        const key = normalized.slice(0, 100);
        if (seen.has(key)) continue;
        seen.add(key);

        questionBank.push({
          id: `q:${Buffer.from(normalized).toString("base64").slice(0, 20)}`,
          question: q.question,
          title: q.question.slice(0, 80),
          format: (q.format as import("@tulmek/core/domain").QuestionFormat) ?? "unknown",
          difficulty: (q.difficulty as import("@tulmek/core/domain").QuestionDifficulty) ?? "unknown",
          rounds: [(q.round as import("@tulmek/core/domain").InterviewRound) ?? "unknown"],
          companies: q.company ? [{ slug: q.company.toLowerCase(), name: q.company, level: q.level ?? "", role: q.role ?? "" }] : [],
          topics: q.topics ?? [],
          sourceArticleIds: [articleId],
          reportCount: 1,
          lastReportedAt: article.publishedAt,
          firstReportedAt: article.publishedAt,
          hints: q.hints ?? [],
          expectedTimeMinutes: q.expectedTimeMinutes ?? null,
        });
      }
    }

    // Layer 2: SimHash + Jaccard dedup for rephrased questions
    const beforeDedup = questionBank.length;
    const dedupedQuestions = deduplicateQuestions(questionBank);
    const merged = beforeDedup - dedupedQuestions.length;
    if (merged > 0) {
      console.log(`  Deduplicated: ${merged} questions merged (${beforeDedup} → ${dedupedQuestions.length})`);
    }

    console.log(`  Extracted ${dedupedQuestions.length} unique questions from ${questionMap.size} articles`);

    // Write question bank
    writeFileSync(join(outputDir, "questions.json"), JSON.stringify(dedupedQuestions, null, 2));
    writeFileSync(join(outputDir, "questions-metadata.json"), JSON.stringify({
      lastRefreshedAt: now,
      totalQuestions: dedupedQuestions.length,
      formatBreakdown: dedupedQuestions.reduce((acc, q) => { acc[q.format] = (acc[q.format] ?? 0) + 1; return acc; }, {} as Record<string, number>),
      difficultyBreakdown: dedupedQuestions.reduce((acc, q) => { acc[q.difficulty] = (acc[q.difficulty] ?? 0) + 1; return acc; }, {} as Record<string, number>),
      topCompanies: [...new Map(dedupedQuestions.flatMap(q => q.companies.map(c => [c.slug, c.name]))).entries()]
        .map(([slug]) => ({ slug, count: dedupedQuestions.filter(q => q.companies.some(c => c.slug === slug)).length }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
    }, null, 2));
  } else {
    console.log("\n📝 Skipping question extraction (set GEMINI_API_KEY)");
  }

  // ── Company open role counts ──
  const JOB_BOARD_SOURCE_NAMES = ["Greenhouse", "RemoteOK", "Jobicy", "Himalayas", "Arbeitnow", "HN Who's Hiring", "H1B Jobs"] as const;
  const companyRoleCounts = new Map<string, number>();
  for (const article of articles) {
    if (JOB_BOARD_SOURCE_NAMES.some((s) => article.sourceName === s)) {
      // Job board titles are pipe-separated: "Company | Role | Location"
      const company = article.title.split("|")[0]?.trim().toLowerCase();
      if (company) {
        companyRoleCounts.set(company, (companyRoleCounts.get(company) ?? 0) + 1);
      }
    }
  }
  const hiringData = Object.fromEntries(companyRoleCounts);
  writeFileSync(join(outputDir, "hiring-data.json"), JSON.stringify(hiringData, null, 2));
  console.log(`\n💼 Wrote open role counts for ${companyRoleCounts.size} companies to packages/content/src/hub/hiring-data.json`);

  writeFileSync(
    join(outputDir, "feed.json"),
    JSON.stringify(articles, null, 2)
  );
  writeFileSync(
    join(outputDir, "metadata.json"),
    JSON.stringify(metadata, null, 2)
  );

  console.log(`\n✅ Wrote ${articles.length} articles to packages/content/src/hub/feed.json`);
  console.log(`   Categories: ${JSON.stringify(categoryBreakdown)}`);
  console.log(`   Sources: ${JSON.stringify(sourceBreakdown)}`);
}

main().catch((err) => {
  console.error("Failed to fetch hub content:", err);
  process.exit(1);
});
