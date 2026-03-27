import type { FeedArticle, HubFacetedResult } from "../domain/article";

/**
 * Port for searching hub articles.
 *
 * Adapters implement this interface — swap the search backend without touching consumers.
 * The consumer provides articles to index, then queries with optional filters.
 */
export interface HubSearchEngine {
  /** Index all articles (call once on init or when content refreshes) */
  index(articles: FeedArticle[]): Promise<void>;

  /** Search with optional query and filters */
  search(params: HubSearchParams): Promise<HubFacetedResult>;
}

export interface HubSearchParams {
  readonly query?: string;
  readonly category?: string;
  readonly source?: string;
  readonly tags?: string[];
  readonly limit?: number;
  readonly offset?: number;
}
