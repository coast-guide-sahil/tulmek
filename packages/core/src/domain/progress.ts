/** Progress tracking domain types — zero dependencies */

/** A single trackable content item (DSA problem, HLD system, LLD problem, behavioral Q) */
export interface ContentItem {
  readonly slug: string;
  readonly title: string;
  readonly url: string;
  readonly difficulty: string;
  readonly companies: readonly CompanyFrequency[];
  readonly tags: readonly string[];
  readonly displayOrder: number;
}

export interface CompanyFrequency {
  readonly name: string;
  readonly frequency: number;
}

/** Content categories */
export type ContentCategory = "dsa" | "hld" | "lld" | "behavioral";

/** A content item with its category attached */
export interface CategorizedItem extends ContentItem {
  readonly category: ContentCategory;
  /** Group key within the category (e.g., pattern name for DSA) */
  readonly group: string;
}

/** Progress state for a single item */
export interface ProgressEntry {
  readonly completed: boolean;
  readonly completedAt: string | null;
}

/** A map of item slug → progress state */
export type ProgressMap = Record<string, ProgressEntry>;

/** A stored note for an item */
export interface Note {
  readonly itemSlug: string;
  readonly content: string;
  readonly updatedAt: string;
}

/** Search result with relevance score */
export interface SearchResult<T = CategorizedItem> {
  readonly item: T;
  readonly score: number;
}

/** Facet count for a filter option */
export interface FacetCount {
  readonly value: string;
  readonly count: number;
}

/** Faceted search results */
export interface FacetedSearchResult<T = CategorizedItem> {
  readonly hits: readonly SearchResult<T>[];
  readonly facets: Record<string, readonly FacetCount[]>;
  readonly totalCount: number;
}
