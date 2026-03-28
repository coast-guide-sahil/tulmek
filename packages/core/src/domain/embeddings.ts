/**
 * Embedding utilities — zero dependencies, pure math.
 * Used by the build-time fetch pipeline and optionally by runtime consumers.
 */

/**
 * Cosine similarity between two vectors.
 * Returns a value in [-1, 1]. Higher means more similar.
 * Handles the zero-magnitude edge case (returns 0).
 */
export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    magA += a[i]! * a[i]!;
    magB += b[i]! * b[i]!;
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
}

/**
 * Embedding index shipped as static JSON alongside feed.json.
 * Vectors are 128-dimensional (outputDimensionality: 128 via Gemini API).
 */
export interface EmbeddingIndex {
  /** articleId → 128-dim embedding vector */
  readonly articles: Readonly<Record<string, readonly number[]>>;
  /**
   * Near-duplicate groups detected by cosine similarity > 0.92.
   * Keys are primary article IDs; values are arrays of duplicate IDs.
   * Duplicates should be suppressed or de-ranked in the UI.
   */
  readonly nearDuplicates: Readonly<Record<string, readonly string[]>>;
}
