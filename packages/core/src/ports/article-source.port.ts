import type { FeedArticle, HubCategory, FeedMetadata } from "../domain/article";

/**
 * Port for loading aggregated hub articles.
 *
 * Adapters: StaticArticleSource (JSON files), ApiArticleSource (REST API), etc.
 * Swap the adapter to change where articles come from — zero UI changes needed.
 */
export interface ArticleSource {
  /** Get all articles, optionally filtered by category */
  getArticles(category?: HubCategory): Promise<FeedArticle[]>;

  /** Get a single article by ID */
  getArticle(id: string): Promise<FeedArticle | null>;

  /** Get available categories with article counts */
  getCategoryCounts(): Promise<Record<HubCategory, number>>;

  /** Get feed metadata (last refresh time, counts) */
  getMetadata(): Promise<FeedMetadata>;
}
