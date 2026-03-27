/**
 * Platform-agnostic hub utilities.
 * Shared across web, mobile, and desktop.
 */

import type { HubCategory } from "./article";

// ── Category metadata (no platform-specific styling) ──

export interface CategoryMeta {
  label: string;
  emoji: string;
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  dsa: { label: "DSA", emoji: "🧩" },
  "system-design": { label: "System Design", emoji: "🏗️" },
  "ai-ml": { label: "AI / ML", emoji: "🤖" },
  behavioral: { label: "Behavioral", emoji: "🗣️" },
  career: { label: "Career", emoji: "📈" },
  "interview-experience": { label: "Experiences", emoji: "💬" },
  compensation: { label: "Compensation", emoji: "💰" },
  general: { label: "General", emoji: "📄" },
};

const DEFAULT_META: CategoryMeta = CATEGORY_META["general"]!;

export function getCategoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category] ?? DEFAULT_META;
}

export const ALL_CATEGORIES: HubCategory[] = [
  "dsa", "system-design", "ai-ml", "behavioral",
  "interview-experience", "compensation", "career", "general",
];

// ── Source labels ──

const SOURCE_LABELS: Record<string, string> = {
  hackernews: "Hacker News",
  reddit: "Reddit",
  devto: "DEV Community",
  youtube: "YouTube",
  medium: "Medium",
  github: "GitHub",
  leetcode: "LeetCode",
};

export function getSourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

// ── Time formatting ──

export function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  const weeks = Math.floor(days / 7);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;

  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
