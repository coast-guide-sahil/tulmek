import { z } from "zod";

/** Schema for company frequency data */
export const companyFrequencySchema = z.object({
  name: z.string().min(1),
  frequency: z.number().int().min(0).max(5),
});

/** Base schema shared across all content categories */
const baseItemSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  title: z.string().min(1).max(200),
  url: z.string(),
  difficulty: z.string(),
  companies: z.array(companyFrequencySchema),
  tags: z.array(z.string()),
  displayOrder: z.number().int().positive(),
});

/** DSA problem schema */
export const dsaProblemSchema = baseItemSchema.extend({
  difficulty: z.enum(["easy", "medium", "hard"]),
  url: z.string().refine(
    (v) => v === "" || v.startsWith("http"),
    "URL must be empty or a valid HTTP URL",
  ),
});

/** HLD topic schema */
export const hldTopicSchema = baseItemSchema.extend({
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  url: z.string(), // May be empty
});

/** LLD problem schema */
export const lldProblemSchema = baseItemSchema.extend({
  difficulty: z.enum(["easy", "medium", "hard"]),
});

/** Behavioral question schema */
export const behavioralQuestionSchema = baseItemSchema.extend({
  difficulty: z.string(), // Empty string for behavioral
  url: z.string(),
});

/** Schema for a DSA pattern file (array of problems) */
export const dsaPatternFileSchema = z
  .array(dsaProblemSchema)
  .min(1, "Pattern file must have at least one problem");

/** Schema for HLD content file */
export const hldFileSchema = z
  .array(hldTopicSchema)
  .min(1, "HLD file must have at least one topic");

/** Schema for LLD content file */
export const lldFileSchema = z
  .array(lldProblemSchema)
  .min(1, "LLD file must have at least one problem");

/** Schema for Behavioral content file */
export const behavioralFileSchema = z
  .array(behavioralQuestionSchema)
  .min(1, "Behavioral file must have at least one question");

/** Type exports */
export type DsaProblem = z.infer<typeof dsaProblemSchema>;
export type HldTopic = z.infer<typeof hldTopicSchema>;
export type LldProblem = z.infer<typeof lldProblemSchema>;
export type BehavioralQuestion = z.infer<typeof behavioralQuestionSchema>;
export type CompanyFrequency = z.infer<typeof companyFrequencySchema>;
