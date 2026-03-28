import { z } from "zod";

/** Only allow safe URL protocols */
const safeUrlSchema = z.string().refine(
  (v) => v.startsWith("https://") || v.startsWith("http://"),
  "URL must use http or https protocol",
);

/** Schema for a single aggregated feed article */
export const feedArticleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(500),
  url: safeUrlSchema,
  source: z.enum(["hackernews", "reddit", "devto", "youtube", "medium", "github", "leetcode", "newsletter"]),
  // Note: "medium" and "github" are valid sources even if not yet fully integrated
  sourceName: z.string().min(1),
  sourceIcon: z.string(),
  domain: z.string().min(1),
  category: z.enum(["dsa", "system-design", "ai-ml", "behavioral", "career", "interview-experience", "compensation", "general"]),
  tags: z.array(z.string()),
  excerpt: z.string(),
  publishedAt: z.string().datetime({ offset: true }).or(z.string().datetime()),
  score: z.number().int().min(0),
  commentCount: z.number().int().min(0),
  readingTime: z.number().int().min(1),
  discussionUrl: safeUrlSchema.nullable(),
  aggregatedAt: z.string().datetime({ offset: true }).or(z.string().datetime()),
  interviewQuestions: z.array(z.string()).default([]),
  interviewFormats: z.array(z.string()).default([]),
});

/** Schema for the full feed file (array of articles) */
export const feedFileSchema = z.array(feedArticleSchema);

/** Schema for feed metadata */
export const feedMetadataSchema = z.object({
  lastRefreshedAt: z.string().datetime({ offset: true }).or(z.string().datetime()),
  totalArticles: z.number().int().min(0),
  sourceBreakdown: z.record(z.string(), z.number()),
  categoryBreakdown: z.record(z.string(), z.number()),
});
