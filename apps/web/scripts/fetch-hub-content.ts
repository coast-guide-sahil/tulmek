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

import { writeFileSync, mkdirSync } from "node:fs";
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
  ],
  behavioral: [
    "behavioral interview", "star method", "leadership", "conflict resolution",
    "teamwork", "communication", "amazon leadership", "culture fit",
    "tell me about a time", "strengths", "weaknesses", "career goal",
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
    "onboarding", "career advice", "mentor",
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
} as const;

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

function deduplicateByUrl(articles: RawArticle[]): RawArticle[] {
  const seen = new Set<string>();
  return articles.filter((a) => {
    const key = a.url.replace(/\/$/, "").toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

  for (const sub of subreddits) {
    try {
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/hot.json?limit=25`,
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
      console.warn(`  Warning: Reddit r/${sub} failed:`, (err as Error).message);
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
        `https://dev.to/api/articles?tag=${tag}&per_page=15&top=7`
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
        `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`,
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

  const categories = [
    { slug: "interview-experience", label: "Interview Experience", category: "interview-experience" },
    { slug: "compensation", label: "Compensation", category: "compensation" },
    { slug: "interview-question", label: "Interview Questions", category: "dsa" },
  ];

  for (const { slug, label, category } of categories) {
    try {
      const res = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Referer": "https://leetcode.com",
        },
        body: JSON.stringify({
          query: `query { categoryTopicList(orderBy: most_votes, skip: 0, first: 20, categories: ["${slug}"]) { edges { node { id title post { voteCount creationDate } commentCount } } } }`,
        }),
      });

      if (!res.ok) continue;
      const data = await res.json() as {
        data: {
          categoryTopicList: {
            edges: Array<{
              node: {
                id: string;
                title: string;
                post: { voteCount: number; creationDate: number };
                commentCount: number;
              };
            }>;
          };
        };
      };

      for (const { node } of data.data.categoryTopicList.edges) {
        if (!node.title || node.title.startsWith("[Guidelines]") || node.title.startsWith("How to")) continue;

        articles.push({
          id: `leetcode:${node.id}`,
          title: node.title,
          url: `https://leetcode.com/discuss/post/${node.id}`,
          source: "leetcode" as string,
          sourceName: `LeetCode ${label}`,
          sourceIcon: "https://leetcode.com/favicon.ico",
          domain: "leetcode.com",
          category,
          tags: [slug.replace(/-/g, " "), "leetcode"],
          excerpt: node.title,
          publishedAt: new Date(node.post.creationDate * 1000).toISOString(),
          score: node.post.voteCount,
          commentCount: node.commentCount,
          readingTime: 4,
          discussionUrl: `https://leetcode.com/discuss/post/${node.id}`,
        });
      }
    } catch (err) {
      console.warn(`  Warning: LeetCode "${slug}" failed:`, (err as Error).message);
    }
  }

  return articles;
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
          id: `medium:${Buffer.from(url).toString("base64url").slice(0, 20)}`,
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
    "UC0RhatS1pyxInC00YKjjBqQ": "Gaurav Sen",
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

// ── Main ──

async function main() {
  console.log("🔄 Fetching hub content...\n");

  const [hn, reddit, redditSearch, devto, medium, leetcode, github, youtube] = await Promise.all([
    fetchHackerNews(),
    fetchReddit(),
    fetchRedditSearch(),
    fetchDevTo(),
    fetchMedium(),
    fetchLeetCode(),
    fetchGitHub(),
    fetchYouTube(),
  ]);

  console.log(`\n  HackerNews: ${hn.length} articles`);
  console.log(`  Reddit (feeds): ${reddit.length} articles`);
  console.log(`  Reddit (search): ${redditSearch.length} articles`);
  console.log(`  dev.to: ${devto.length} articles`);
  console.log(`  Medium: ${medium.length} articles`);
  console.log(`  LeetCode: ${leetcode.length} articles`);
  console.log(`  GitHub: ${github.length} articles`);
  console.log(`  YouTube: ${youtube.length} articles`);

  let all = [...hn, ...reddit, ...redditSearch, ...devto, ...medium, ...leetcode, ...github, ...youtube];
  all = deduplicateByUrl(all);

  // Sort by score (engagement) descending, then by date
  all.sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (scoreDiff !== 0) return scoreDiff;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const now = new Date().toISOString();

  // Add aggregatedAt timestamp
  const articles = all.map((a) => ({
    ...a,
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

  // Write output
  const outputDir = join(__dirname, "..", "src", "content", "hub");
  mkdirSync(outputDir, { recursive: true });

  writeFileSync(
    join(outputDir, "feed.json"),
    JSON.stringify(articles, null, 2)
  );
  writeFileSync(
    join(outputDir, "metadata.json"),
    JSON.stringify(metadata, null, 2)
  );

  console.log(`\n✅ Wrote ${articles.length} articles to src/content/hub/feed.json`);
  console.log(`   Categories: ${JSON.stringify(categoryBreakdown)}`);
  console.log(`   Sources: ${JSON.stringify(sourceBreakdown)}`);
}

main().catch((err) => {
  console.error("Failed to fetch hub content:", err);
  process.exit(1);
});
