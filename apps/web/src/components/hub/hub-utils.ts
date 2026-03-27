/**
 * Hub utilities — web-specific layer on top of @tulmek/core.
 * Re-exports platform-agnostic utils and adds Tailwind CSS class mappings.
 */

import type { HubCategory } from "@tulmek/core/domain";
import { getCategoryMeta } from "@tulmek/core/domain";

// Re-export platform-agnostic utils from core
export { getSourceLabel, formatRelativeTime, ALL_CATEGORIES, getCategoryMeta } from "@tulmek/core/domain";
export type { CategoryMeta } from "@tulmek/core/domain";

// ── Web-specific: Tailwind CSS class mappings ──

interface CategoryConfig {
  label: string;
  className: string;
  emoji: string;
}

const CATEGORY_CSS: Record<string, string> = {
  dsa: "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  "system-design": "bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "ai-ml": "bg-purple-500/15 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  behavioral: "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  career: "bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  "interview-experience": "bg-cyan-500/15 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
  compensation: "bg-yellow-500/15 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
  general: "bg-gray-500/15 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
};

export function getCategoryConfig(category: string): CategoryConfig {
  const meta = getCategoryMeta(category);
  return {
    label: meta.label,
    emoji: meta.emoji,
    className: CATEGORY_CSS[category] ?? CATEGORY_CSS["general"]!,
  };
}

export function getAllCategories(): { id: HubCategory; config: CategoryConfig }[] {
  const ids: HubCategory[] = ["dsa", "system-design", "ai-ml", "behavioral", "interview-experience", "compensation", "career", "general"];
  return ids.map((id) => ({ id, config: getCategoryConfig(id) }));
}
