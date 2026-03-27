/**
 * Branded types — prevent accidental mixing of string IDs.
 *
 * ArticleId and ItemSlug look like plain strings but the compiler
 * won't let you pass one where the other is expected.
 * Use `as ArticleId` at creation boundaries (fetch, JSON parse).
 */

declare const __brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [__brand]: B };

/** Unique article identifier (format: "source:originalId") */
export type ArticleId = Brand<string, "ArticleId">;

/** Progress item slug (unique within a category) */
export type ItemSlug = Brand<string, "ItemSlug">;

/** ISO 8601 timestamp string */
export type ISOTimestamp = Brand<string, "ISOTimestamp">;
