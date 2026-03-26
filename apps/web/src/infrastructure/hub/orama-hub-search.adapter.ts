import { create, insert, search as oramaSearch } from "@orama/orama";
import type { FeedArticle, HubFacetedResult, HubFacetCount, HubSearchResult } from "@tulmek/core/domain";

export interface HubSearchParams {
  readonly query?: string;
  readonly category?: string;
  readonly source?: string;
  readonly tags?: string[];
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Orama adapter for hub article search.
 *
 * Provides full-text search with typo tolerance across article titles,
 * excerpts, tags, and source names.
 */
export class OramaHubSearchEngine {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private db: any = null;
  private articles: FeedArticle[] = [];

  async index(articles: FeedArticle[]): Promise<void> {
    this.articles = articles;
    this.db = await create({
      schema: {
        id: "string",
        title: "string",
        excerpt: "string",
        category: "string",
        source: "string",
        sourceName: "string",
        domain: "string",
        tags: "string",
        score: "number",
      } as const,
    });

    for (const article of articles) {
      await insert(this.db, {
        id: article.id,
        title: article.title,
        excerpt: article.excerpt,
        category: article.category,
        source: article.source,
        sourceName: article.sourceName,
        domain: article.domain,
        tags: article.tags.join(" "),
        score: article.score,
      });
    }
  }

  async search(params: HubSearchParams): Promise<HubFacetedResult> {
    if (!this.db) {
      return { hits: [], facets: {}, totalCount: 0 };
    }

    let matched: FeedArticle[];

    if (params.query?.trim()) {
      const results = await oramaSearch(this.db, {
        term: params.query,
        properties: ["title", "excerpt", "tags", "sourceName"],
        limit: 500,
        tolerance: 1,
      });

      const slugScoreMap = new Map(
        results.hits.map((h) => [h.document.id as string, h.score])
      );
      matched = this.articles
        .filter((a) => slugScoreMap.has(a.id))
        .sort((a, b) => (slugScoreMap.get(b.id) ?? 0) - (slugScoreMap.get(a.id) ?? 0));
    } else {
      matched = [...this.articles];
    }

    // Apply filters
    if (params.category) {
      matched = matched.filter((a) => a.category === params.category);
    }
    if (params.source) {
      matched = matched.filter((a) => a.source === params.source);
    }
    if (params.tags?.length) {
      matched = matched.filter((a) =>
        params.tags!.some((t) => a.tags.includes(t))
      );
    }

    const totalCount = matched.length;
    const offset = params.offset ?? 0;
    const limit = params.limit ?? 50;
    const paged = matched.slice(offset, offset + limit);

    const hits: HubSearchResult[] = paged.map((article) => ({
      article,
      score: 1,
    }));

    return {
      hits,
      facets: this.computeFacets(matched),
      totalCount,
    };
  }

  private computeFacets(
    articles: FeedArticle[]
  ): Record<string, HubFacetCount[]> {
    const categoryMap = new Map<string, number>();
    const sourceMap = new Map<string, number>();

    for (const article of articles) {
      categoryMap.set(article.category, (categoryMap.get(article.category) ?? 0) + 1);
      sourceMap.set(article.source, (sourceMap.get(article.source) ?? 0) + 1);
    }

    const toFacets = (map: Map<string, number>): HubFacetCount[] =>
      [...map.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);

    return {
      category: toFacets(categoryMap),
      source: toFacets(sourceMap),
    };
  }
}
