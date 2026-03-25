"use client";

import { create, insert, search as oramaSearch } from "@orama/orama";
import type { CategorizedItem } from "@tulmek/core/domain";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = null;
let indexedItems: CategorizedItem[] = [];

/**
 * Initialize the Orama search index with content items.
 * Call once on app load. Indexes 690 items in <10ms.
 */
export async function initSearchIndex(
  items: readonly CategorizedItem[],
): Promise<void> {
  indexedItems = [...items];
  db = create({
    schema: {
      slug: "string",
      title: "string",
      companyNames: "string",
      tags: "string",
    } as const,
  });

  for (const item of items) {
    insert(db, {
      slug: item.slug,
      title: item.title,
      companyNames: item.companies.map((c) => c.name).join(" "),
      tags: item.tags.join(" "),
    });
  }
}

/**
 * Search items using Orama full-text search with typo tolerance.
 * Returns matching slugs ordered by relevance score.
 */
export function searchItems(query: string): Set<string> {
  if (!db || !query.trim()) return new Set(indexedItems.map((i) => i.slug));

  // Orama search returns sync in v3 for non-plugin schemas
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: any = oramaSearch(db, {
    term: query,
    properties: ["title", "companyNames", "tags"],
    tolerance: 1,
    limit: 1000,
  });

  // Handle both sync and async returns
  const hits = results?.hits ?? [];
  return new Set(
    hits.map(
      (h: { document: { slug: string } }) => h.document.slug,
    ),
  );
}
