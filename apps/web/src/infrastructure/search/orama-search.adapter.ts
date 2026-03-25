import { create, insert, search as oramaSearch } from "@orama/orama";
import type { SearchEngine, SearchParams } from "@tulmek/core/ports";
import type {
  CategorizedItem,
  FacetedSearchResult,
  FacetCount,
  SearchResult,
} from "@tulmek/core/domain";

/**
 * Orama adapter for client-side faceted search.
 *
 * Orama runs entirely in the browser (WASM), indexes 690 items in <10ms,
 * and provides faceted search with typo tolerance.
 *
 * Swap this for Algolia, MeiliSearch, Typesense, or a custom server-side search.
 */
export class OramaSearchEngine implements SearchEngine {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private db: any = null;
  private items: readonly CategorizedItem[] = [];

  async index(items: readonly CategorizedItem[]): Promise<void> {
    this.items = items;
    this.db = await create({
      schema: {
        slug: "string",
        title: "string",
        category: "string",
        group: "string",
        difficulty: "string",
        companyNames: "string",
        tags: "string",
        displayOrder: "number",
      } as const,
    });

    for (const item of items) {
      await insert(this.db, {
        slug: item.slug,
        title: item.title,
        category: item.category,
        group: item.group,
        difficulty: item.difficulty,
        companyNames: item.companies.map((c) => c.name).join(" "),
        tags: item.tags.join(" "),
        displayOrder: item.displayOrder,
      });
    }
  }

  async search(params: SearchParams): Promise<FacetedSearchResult> {
    if (!this.db || !params.query) {
      return this.filter(params);
    }

    const results = await oramaSearch(this.db, {
      term: params.query,
      properties: ["title", "companyNames", "tags"],
      limit: params.limit ?? 1000,
      offset: params.offset ?? 0,
      tolerance: 1,
    });

    return this.buildFacetedResult(
      results.hits.map((h) => ({
        slug: h.document.slug as string,
        score: h.score,
      })),
      params,
    );
  }

  async filter(
    params: Omit<SearchParams, "query">,
  ): Promise<FacetedSearchResult> {
    let filtered = [...this.items];

    if (params.filters?.category) {
      filtered = filtered.filter(
        (i) => i.category === params.filters!.category,
      );
    }
    if (params.filters?.difficulty?.length) {
      filtered = filtered.filter((i) =>
        params.filters!.difficulty!.includes(i.difficulty),
      );
    }
    if (params.filters?.companies?.length) {
      filtered = filtered.filter((i) =>
        i.companies.some((c) =>
          params.filters!.companies!.includes(c.name),
        ),
      );
    }
    if (params.filters?.tags?.length) {
      filtered = filtered.filter((i) =>
        params.filters!.tags!.some((t) => i.tags.includes(t)),
      );
    }

    // Sort
    if (params.sort) {
      filtered.sort((a, b) => {
        const aVal = a[params.sort!.field as keyof CategorizedItem];
        const bVal = b[params.sort!.field as keyof CategorizedItem];
        if (typeof aVal === "number" && typeof bVal === "number") {
          return params.sort!.order === "asc" ? aVal - bVal : bVal - aVal;
        }
        return params.sort!.order === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }

    const hits: SearchResult[] = filtered.map((item) => ({
      item,
      score: 1,
    }));

    const offset = params.offset ?? 0;
    const limit = params.limit ?? 1000;
    const paged = hits.slice(offset, offset + limit);

    return {
      hits: paged,
      facets: this.computeFacets(filtered),
      totalCount: filtered.length,
    };
  }

  private buildFacetedResult(
    searchHits: { slug: string; score: number }[],
    params: SearchParams,
  ): FacetedSearchResult {
    const slugScoreMap = new Map(searchHits.map((h) => [h.slug, h.score]));

    let matched = this.items.filter((i) => slugScoreMap.has(i.slug));

    // Apply additional filters
    if (params.filters?.category) {
      matched = matched.filter(
        (i) => i.category === params.filters!.category,
      );
    }
    if (params.filters?.difficulty?.length) {
      matched = matched.filter((i) =>
        params.filters!.difficulty!.includes(i.difficulty),
      );
    }
    if (params.filters?.companies?.length) {
      matched = matched.filter((i) =>
        i.companies.some((c) =>
          params.filters!.companies!.includes(c.name),
        ),
      );
    }
    if (params.filters?.tags?.length) {
      matched = matched.filter((i) =>
        params.filters!.tags!.some((t) => i.tags.includes(t)),
      );
    }

    // Sort by search score (relevance)
    matched.sort(
      (a, b) =>
        (slugScoreMap.get(b.slug) ?? 0) - (slugScoreMap.get(a.slug) ?? 0),
    );

    const hits: SearchResult[] = matched.map((item) => ({
      item,
      score: slugScoreMap.get(item.slug) ?? 0,
    }));

    return {
      hits,
      facets: this.computeFacets(matched),
      totalCount: matched.length,
    };
  }

  private computeFacets(
    items: readonly CategorizedItem[],
  ): Record<string, FacetCount[]> {
    const difficultyMap = new Map<string, number>();
    const companyMap = new Map<string, number>();
    const groupMap = new Map<string, number>();

    for (const item of items) {
      if (item.difficulty) {
        difficultyMap.set(
          item.difficulty,
          (difficultyMap.get(item.difficulty) ?? 0) + 1,
        );
      }
      for (const c of item.companies) {
        companyMap.set(c.name, (companyMap.get(c.name) ?? 0) + 1);
      }
      groupMap.set(item.group, (groupMap.get(item.group) ?? 0) + 1);
    }

    const toFacets = (map: Map<string, number>): FacetCount[] =>
      [...map.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);

    return {
      difficulty: toFacets(difficultyMap),
      company: toFacets(companyMap),
      group: toFacets(groupMap),
    };
  }
}
