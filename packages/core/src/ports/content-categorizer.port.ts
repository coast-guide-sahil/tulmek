import type { HubCategory } from "../domain/article";

/**
 * Port for AI-powered content categorization.
 *
 * Adapters: KeywordCategorizer (rule-based fallback), GroqCategorizer (AI),
 * GeminiCategorizer, etc. Swap the adapter to change categorization strategy.
 */
export interface ContentCategorizer {
  /**
   * Categorize an article based on its title and content.
   * Returns the best-fit category.
   */
  categorize(input: CategorizationInput): Promise<HubCategory>;

  /**
   * Batch categorize multiple articles (more efficient for AI adapters).
   */
  categorizeBatch(inputs: CategorizationInput[]): Promise<HubCategory[]>;
}

export interface CategorizationInput {
  readonly title: string;
  readonly excerpt: string;
  readonly tags: readonly string[];
  readonly source: string;
}
