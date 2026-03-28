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

interface ClassificationResult {
  classifications: { index: number; category: string; confidence: number }[];
}

async function classifyBatchWithGemini(
  articles: { title: string; tags: string[]; excerpt: string }[]
): Promise<(string | null)[]> {
  if (!GEMINI_API_KEY) return articles.map(() => null);

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const prompt = articles
    .map((a, i) => `[${i}] Title: ${a.title}\nTags: ${a.tags.join(", ") || "none"}\nExcerpt: ${a.excerpt.slice(0, 150)}`)
    .join("\n\n");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: `Classify each article into exactly one category.\n\n${CATEGORIES_DESCRIPTION}\n\nArticles:\n${prompt}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object" as const,
          properties: {
            classifications: {
              type: "array" as const,
              items: {
                type: "object" as const,
                properties: {
                  index: { type: "number" as const },
                  category: {
                    type: "string" as const,
                    enum: ["dsa", "system-design", "ai-ml", "behavioral", "career", "interview-experience", "compensation", "general"],
                  },
                  confidence: { type: "number" as const },
                },
                required: ["index", "category", "confidence"],
              },
            },
          },
          required: ["classifications"],
        },
      },
    });

    const text = response.text ?? "";
    const result: ClassificationResult = JSON.parse(text);

    // Map results back to article indices
    const categories: (string | null)[] = articles.map(() => null);
    for (const c of result.classifications) {
      if (c.index >= 0 && c.index < articles.length && c.confidence >= 0.7) {
        categories[c.index] = c.category;
      }
    }
    return categories;
  } catch (err) {
    console.warn("Gemini classification failed, falling back to keywords:", (err as Error).message);
    return articles.map(() => null);
  }
}

async function classifyWithAI(
  articles: { title: string; tags: string[]; excerpt: string }[]
): Promise<string[]> {
  const BATCH_SIZE = 20;
  const results: (string | null)[] = new Array(articles.length).fill(null);

  // Process in batches of 20
  const batches: number[][] = [];
  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    batches.push(Array.from({ length: Math.min(BATCH_SIZE, articles.length - i) }, (_, j) => i + j));
  }

  // Process batches with concurrency limit of 5
  const CONCURRENCY = 5;
  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const chunk = batches.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      chunk.map(async (indices) => {
        const batchArticles = indices.map((idx) => articles[idx]!);
        const classifications = await classifyBatchWithGemini(batchArticles);
        return { indices, classifications };
      })
    );
    for (const { indices, classifications } of batchResults) {
      for (let j = 0; j < indices.length; j++) {
        results[indices[j]!] = classifications[j] ?? null;
      }
    }
  }

  // Fill in nulls (failed/low-confidence) with keyword fallback
  return results.map((category, i) => {
    if (category) return category;
    const a = articles[i]!;
    return categorize(a.title, a.tags);
  });
}

async function summarizeBatchWithGemini(
  articles: { title: string; excerpt: string; source: string }[]
): Promise<(string | null)[]> {
  if (!GEMINI_API_KEY) return articles.map(() => null);

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const prompt = articles
    .map((a, i) => `[${i}] Title: ${a.title}\nSource: ${a.source}\nContent: ${a.excerpt.slice(0, 300)}`)
    .join("\n\n");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: `Generate a concise 2-3 sentence summary for each article. Focus on the key takeaway for someone preparing for tech interviews. Be specific, not generic.\n\nArticles:\n${prompt}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object" as const,
          properties: {
            summaries: {
              type: "array" as const,
              items: {
                type: "object" as const,
                properties: {
                  index: { type: "number" as const },
                  summary: { type: "string" as const },
                },
                required: ["index", "summary"],
              },
            },
          },
          required: ["summaries"],
        },
      },
    });

    const text = response.text ?? "";
    const result = JSON.parse(text) as { summaries: { index: number; summary: string }[] };

    const summaries: (string | null)[] = articles.map(() => null);
    for (const s of result.summaries) {
      if (s.index >= 0 && s.index < articles.length && s.summary.length > 20) {
        summaries[s.index] = s.summary;
      }
    }
    return summaries;
  } catch (err) {
    console.warn("Gemini summarization failed, keeping original excerpts:", (err as Error).message);
    return articles.map(() => null);
  }
}

async function summarizeWithAI(
  articles: { title: string; excerpt: string; source: string }[]
): Promise<string[]> {
  const BATCH_SIZE = 20;
  const results: (string | null)[] = new Array(articles.length).fill(null);

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
        const summaries = await summarizeBatchWithGemini(batchArticles);
        return { indices, summaries };
      })
    );
    for (const { indices, summaries } of batchResults) {
      for (let j = 0; j < indices.length; j++) {
        results[indices[j]!] = summaries[j] ?? null;
      }
    }
  }

  // Keep original excerpt for failed/null summaries
  return results.map((summary, i) => summary ?? articles[i]!.excerpt);
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
        const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ??
                          item.match(/<description>(.*?)<\/description>/);

        if (!titleMatch?.[1] || !linkMatch?.[1]) continue;

        const title = titleMatch[1].replace(/<[^>]+>/g, "").trim();
        const url = linkMatch[1].split("?")[0] ?? linkMatch[1];
        const publishedAt = pubDateMatch?.[1]
          ? new Date(pubDateMatch[1]).toISOString()
          : new Date().toISOString();

        // Extract plain text excerpt from description HTML
        let excerpt = title;
        if (descMatch?.[1]) {
          excerpt = descMatch[1]
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 200);
        }

        const domain = new URL(url).hostname;

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
          readingTime: estimateReadingTime(excerpt),
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
        title: `${company} is hiring — HN Who's Hiring`,
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

// ── Main ──

async function main() {
  console.log("🔄 Fetching hub content...\n");

  const [hn, reddit, redditSearch, devto, medium, leetcode, leetcodeDaily, github, youtube, newsletters, glassdoor, hnHiring] = await Promise.all([
    fetchHackerNews(),
    fetchReddit(),
    fetchRedditSearch(),
    fetchDevTo(),
    fetchMedium(),
    fetchLeetCode(),
    fetchLeetCodeDaily(),
    fetchGitHub(),
    fetchYouTube(),
    fetchNewsletters(),
    fetchGlassdoor(),
    fetchHNHiring(),
  ]);

  console.log(`\n  HackerNews: ${hn.length} articles`);
  console.log(`  Reddit (feeds): ${reddit.length} articles`);
  console.log(`  Reddit (search): ${redditSearch.length} articles`);
  console.log(`  dev.to: ${devto.length} articles`);
  console.log(`  Medium: ${medium.length} articles`);
  console.log(`  LeetCode: ${leetcode.length} articles`);
  console.log(`  LeetCode Daily: ${leetcodeDaily.length} article`);
  console.log(`  GitHub: ${github.length} articles`);
  console.log(`  YouTube: ${youtube.length} articles`);
  console.log(`  Newsletters: ${newsletters.length} articles`);
  console.log(`  Glassdoor: ${glassdoor.length} articles`);
  console.log(`  HN Who's Hiring: ${hnHiring.length} articles`);

  const all = [...hn, ...reddit, ...redditSearch, ...devto, ...medium, ...leetcode, ...leetcodeDaily, ...github, ...youtube, ...newsletters, ...glassdoor, ...hnHiring];

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

  let deduped = deduplicateByUrl(all);

  // Layer 2: SimHash near-duplicate title detection
  const beforeTitle = deduped.length;
  deduped = deduplicateByTitle(deduped);
  const titleDupes = beforeTitle - deduped.length;
  if (titleDupes > 0) {
    console.log(`  SimHash dedup removed ${titleDupes} near-duplicate titles`);
  }

  // Sort by score (engagement) descending, then by date
  deduped.sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (scoreDiff !== 0) return scoreDiff;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  mkdirSync(outputDir, { recursive: true });

  // ── AI classification cache ──
  // Avoid re-classifying articles whose titles haven't changed since last run.

  type AICacheEntry = { titleHash: string; category: string; summary: string; cachedAt: string };
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
      all[i] = { ...article, category: cached.category, excerpt: cached.summary || article.excerpt };
      cacheHits++;
    } else {
      uncachedIndices.push(i);
    }
  }

  const cacheMisses = uncachedIndices.length;
  const cacheRate = all.length > 0 ? Math.round((cacheHits / all.length) * 100) : 0;

  // AI classification step — reclassifies only uncached articles using Gemini
  if (GEMINI_API_KEY) {
    console.log(`\n🤖 AI classification with Gemini Flash-Lite...`);
    console.log(`  Cache: ${cacheHits} hits, ${cacheMisses} misses (${cacheRate}% cache rate)`);

    if (uncachedIndices.length > 0) {
      const uncachedArticles = uncachedIndices.map((i) => all[i]!);

      // Classify uncached articles
      console.log(`  Classifying ${uncachedArticles.length} articles...`);
      const aiCategories = await classifyWithAI(
        uncachedArticles.map((a) => ({ title: a.title, tags: a.tags, excerpt: a.excerpt }))
      );
      const aiCount = aiCategories.filter((c, j) => c !== categorize(uncachedArticles[j]!.title, uncachedArticles[j]!.tags)).length;
      console.log(`  AI reclassified ${aiCount} articles vs keyword baseline`);

      for (let j = 0; j < uncachedIndices.length; j++) {
        const idx = uncachedIndices[j]!;
        all[idx] = { ...all[idx]!, category: aiCategories[j]! };
      }

      // Summarize uncached articles
      console.log(`  Generating AI summaries for ${uncachedArticles.length} articles...`);
      const aiSummaries = await summarizeWithAI(
        uncachedArticles.map((a) => ({ title: a.title, excerpt: a.excerpt, source: a.source }))
      );

      for (let j = 0; j < uncachedIndices.length; j++) {
        const idx = uncachedIndices[j]!;
        const article = all[idx]!;
        const summary = aiSummaries[j]!;
        all[idx] = { ...article, excerpt: summary };

        // Update cache with fresh AI results
        aiCache[article.id] = {
          titleHash: titleHash(article.title),
          category: aiCategories[j]!,
          summary,
          cachedAt: new Date().toISOString(),
        };
      }
    } else {
      console.log(`  All articles served from cache — skipping Gemini API calls`);
    }

    // Persist updated cache
    writeFileSync(CACHE_PATH, JSON.stringify(aiCache, null, 2));
  } else {
    console.log("\n📝 Using keyword classification (set GEMINI_API_KEY for AI)");
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

  // Add aggregatedAt timestamp and ensure interviewQuestions is always present
  const articles = all.map((a) => ({
    ...a,
    interviewQuestions: a.interviewQuestions ?? [],
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
