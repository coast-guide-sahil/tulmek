import type {
  CategorizedItem,
  FacetedSearchResult,
} from "../domain/progress";

/**
 * Port for searching and filtering content items.
 *
 * Adapters: OramaSearchEngine, AlgoliaSearchEngine, MeiliSearchEngine, etc.
 * The consumer provides a query and filters, gets back faceted results.
 * How the search is implemented (client-side WASM, server API, etc.) is irrelevant.
 */
export interface SearchEngine {
  /** Index all content items (call once on init) */
  index(items: readonly CategorizedItem[]): Promise<void>;

  /** Search with optional filters, returns faceted results */
  search(params: SearchParams): Promise<FacetedSearchResult>;

  /** Get all items matching filters (no text query) */
  filter(params: Omit<SearchParams, "query">): Promise<FacetedSearchResult>;
}

export interface SearchParams {
  /** Free-text search query */
  readonly query?: string;

  /** Filter by exact tag matches (AND within same facet, OR across facets) */
  readonly filters?: SearchFilters;

  /** Sort field and direction */
  readonly sort?: {
    readonly field: string;
    readonly order: "asc" | "desc";
  };

  /** Pagination */
  readonly limit?: number;
  readonly offset?: number;
}

export interface SearchFilters {
  readonly category?: string;
  readonly difficulty?: string[];
  readonly companies?: string[];
  readonly tags?: string[];
  readonly completed?: boolean;
}
