import type { HubCategory } from "@tulmek/core/domain";

interface CategoryConfig {
  label: string;
  className: string;
  emoji: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  dsa: {
    label: "DSA",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    emoji: "🧩",
  },
  "system-design": {
    label: "System Design",
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    emoji: "🏗️",
  },
  "ai-ml": {
    label: "AI / ML",
    className: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    emoji: "🤖",
  },
  behavioral: {
    label: "Behavioral",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    emoji: "🗣️",
  },
  career: {
    label: "Career",
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
    emoji: "📈",
  },
  "interview-experience": {
    label: "Experiences",
    className: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
    emoji: "💬",
  },
  compensation: {
    label: "Compensation",
    className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    emoji: "💰",
  },
  general: {
    label: "General",
    className: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
    emoji: "📄",
  },
};

const DEFAULT_CONFIG: CategoryConfig = CATEGORY_CONFIGS["general"]!;

export function getCategoryConfig(category: string): CategoryConfig {
  return CATEGORY_CONFIGS[category] ?? DEFAULT_CONFIG;
}

export function getAllCategories(): { id: HubCategory; config: CategoryConfig }[] {
  return [
    { id: "dsa", config: CATEGORY_CONFIGS["dsa"]! },
    { id: "system-design", config: CATEGORY_CONFIGS["system-design"]! },
    { id: "ai-ml", config: CATEGORY_CONFIGS["ai-ml"]! },
    { id: "behavioral", config: CATEGORY_CONFIGS["behavioral"]! },
    { id: "interview-experience", config: CATEGORY_CONFIGS["interview-experience"]! },
    { id: "compensation", config: CATEGORY_CONFIGS["compensation"]! },
    { id: "career", config: CATEGORY_CONFIGS["career"]! },
    { id: "general", config: CATEGORY_CONFIGS["general"]! },
  ];
}

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

export function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    hackernews: "Hacker News",
    reddit: "Reddit",
    devto: "DEV Community",
    youtube: "YouTube",
    medium: "Medium",
    github: "GitHub",
  };
  return labels[source] ?? source;
}
