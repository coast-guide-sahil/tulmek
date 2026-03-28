/**
 * Interview Question Intelligence (IQI) domain types.
 * Zero dependencies — shared across all platforms.
 */

/** Question format/type */
export type QuestionFormat =
  | "dsa" | "system-design" | "low-level-design" | "behavioral"
  | "ai-ml" | "api-design" | "agentic-ai-design" | "live-coding"
  | "take-home" | "estimation" | "unknown";

/** Difficulty */
export type QuestionDifficulty = "easy" | "medium" | "hard" | "unknown";

/** Interview round */
export type InterviewRound =
  | "online-assessment" | "phone-screen" | "onsite-coding"
  | "onsite-system-design" | "onsite-behavioral" | "hiring-manager"
  | "ai-assisted-coding" | "take-home" | "unknown";

/** A single extracted interview question */
export interface InterviewQuestion {
  readonly id: string;
  readonly question: string;
  readonly title: string; // max 80 chars
  readonly format: QuestionFormat;
  readonly difficulty: QuestionDifficulty;
  readonly rounds: readonly InterviewRound[];
  readonly companies: readonly { slug: string; name: string; level: string; role: string }[];
  readonly topics: readonly string[];
  readonly sourceArticleIds: readonly string[];
  readonly reportCount: number;
  readonly lastReportedAt: string;
  readonly firstReportedAt: string;
  readonly hints: readonly string[];
  readonly expectedTimeMinutes: number | null;
}

/** Question bank metadata */
export interface QuestionBankMetadata {
  readonly lastRefreshedAt: string;
  readonly totalQuestions: number;
  readonly formatBreakdown: Record<string, number>;
  readonly difficultyBreakdown: Record<string, number>;
  readonly topCompanies: readonly { slug: string; count: number }[];
}
