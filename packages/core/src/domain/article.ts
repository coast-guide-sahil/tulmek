/** Knowledge Hub domain types — zero dependencies */
import type { ArticleId, ISOTimestamp } from "./branded";

/** Content source identifiers */
export type FeedSourceId =
  | "hackernews"
  | "reddit"
  | "devto"
  | "youtube"
  | "medium"
  | "github"
  | "leetcode"
  | "newsletter"
  | "glassdoor";

/** Hub content categories */
export type HubCategory =
  | "dsa"
  | "system-design"
  | "ai-ml"
  | "behavioral"
  | "career"
  | "interview-experience"
  | "compensation"
  | "general";

/** A single aggregated article/post from any source */
export interface FeedArticle {
  /** Unique identifier (source:originalId) */
  readonly id: ArticleId;
  readonly title: string;
  readonly url: string;
  readonly source: FeedSourceId;
  /** Display name of the source (e.g., "HackerNews", "r/cscareerquestions") */
  readonly sourceName: string;
  /** Favicon or logo URL for the source */
  readonly sourceIcon: string;
  /** Domain of the linked article (e.g., "blog.bytebytego.com") */
  readonly domain: string;
  readonly category: HubCategory;
  /** Additional topic tags */
  readonly tags: readonly string[];
  /** Brief excerpt or AI summary */
  readonly excerpt: string;
  /** ISO timestamp when published/posted */
  readonly publishedAt: ISOTimestamp;
  /** ISO timestamp when aggregated into the hub */
  readonly aggregatedAt: ISOTimestamp;
  /** Engagement score from source (upvotes, likes, etc.) */
  readonly score: number;
  /** Number of comments/discussion on source */
  readonly commentCount: number;
  /** Estimated reading time in minutes */
  readonly readingTime: number;
  /** URL to the discussion (HN comments, Reddit thread, etc.) */
  readonly discussionUrl: string | null;
}

/** A bookmark saved by the user */
export interface Bookmark {
  readonly articleId: ArticleId;
  readonly savedAt: ISOTimestamp;
}

/** Map of article ID → bookmark */
export type BookmarkMap = Record<string, Bookmark>;

/** Search result for hub articles */
export interface HubSearchResult {
  readonly article: FeedArticle;
  readonly score: number;
}

/** Faceted search result for hub */
export interface HubFacetedResult {
  readonly hits: readonly HubSearchResult[];
  readonly facets: Record<string, readonly HubFacetCount[]>;
  readonly totalCount: number;
}

export interface HubFacetCount {
  readonly value: string;
  readonly count: number;
}

/** Feed metadata for a content refresh */
export interface FeedMetadata {
  readonly lastRefreshedAt: ISOTimestamp;
  readonly totalArticles: number;
  readonly sourceBreakdown: Record<string, number>;
  readonly categoryBreakdown: Record<string, number>;
}
