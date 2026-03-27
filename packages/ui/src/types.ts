/**
 * Shared UI types used across web, desktop, and mobile.
 * Platform-agnostic — no React Native or DOM dependencies.
 */

/** Theme color tokens shared across all platforms */
export interface ThemeColors {
  readonly background: string;
  readonly foreground: string;
  readonly muted: string;
  readonly mutedForeground: string;
  readonly card: string;
  readonly cardForeground: string;
  readonly primary: string;
  readonly primaryForeground: string;
  readonly border: string;
  readonly success: string;
  readonly destructive: string;
}

/** Light theme colors */
export const lightTheme: ThemeColors = {
  background: "#fafafa",
  foreground: "#0a0a0a",
  muted: "#f4f4f5",
  mutedForeground: "#71717a",
  card: "#ffffff",
  cardForeground: "#0a0a0a",
  primary: "#18181b",
  primaryForeground: "#fafafa",
  border: "#e4e4e7",
  success: "#16a34a",
  destructive: "#dc2626",
};

/** Dark theme colors */
export const darkTheme: ThemeColors = {
  background: "#09090b",
  foreground: "#fafafa",
  muted: "#27272a",
  mutedForeground: "#a1a1aa",
  card: "#18181b",
  cardForeground: "#fafafa",
  primary: "#fafafa",
  primaryForeground: "#18181b",
  border: "#27272a",
  success: "#22c55e",
  destructive: "#ef4444",
};

/** Category accent colors shared across platforms */
export const categoryAccents = {
  dsa: "#059669",
  "system-design": "#2563eb",
  "ai-ml": "#9333ea",
  behavioral: "#d97706",
  career: "#e11d48",
  "interview-experience": "#0891b2",
  compensation: "#ca8a04",
  general: "#4b5563",
} as const;
