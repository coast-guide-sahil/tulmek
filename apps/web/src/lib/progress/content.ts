/**
 * Content adapter — transforms raw JSON content into CategorizedItems
 * used by the tracker UI components.
 *
 * Implements the ContentSource port from @tulmek/core/ports.
 * This is the ONLY file that imports from src/content/.
 * Swap the content source (JSON files → CMS → API) here.
 */

import type { CategorizedItem } from "@tulmek/core/domain";
import type { ContentSource, ContentSection, DashboardSection } from "@tulmek/core/ports";
import {
  dsa,
  dsaPatterns,
  hld,
  lld,
  behavioral,
  type ContentItem,
} from "@/content";

function toCategorized(
  items: readonly ContentItem[],
  category: CategorizedItem["category"],
  group: string,
): CategorizedItem[] {
  return items.map((item) => ({
    ...item,
    category,
    group,
  }));
}

// --- DSA ---

const DSA_GROUP_ORDER = dsaPatterns.map((p) => p.key);
const DSA_GROUP_LABELS: Record<string, string> = Object.fromEntries(
  dsaPatterns.map((p) => [p.key, p.label]),
);

const DSA_ITEMS: CategorizedItem[] = dsaPatterns.flatMap((pattern) => {
  const items = dsa[pattern.key as keyof typeof dsa] as ContentItem[];
  return toCategorized(items, "dsa", pattern.key);
});

export async function getDsaContent(): Promise<ContentSection> {
  return {
    items: DSA_ITEMS,
    groups: DSA_GROUP_ORDER,
    groupLabels: DSA_GROUP_LABELS,
    difficulties: ["easy", "medium", "hard"] as const,
  };
}

// --- HLD ---

const HLD_GROUPS = ["fundamentals", "classic-systems"] as const;
const HLD_GROUP_LABELS: Record<string, string> = {
  fundamentals: "Fundamentals",
  "classic-systems": "Classic Systems",
};

const HLD_ITEMS: CategorizedItem[] = (hld as ContentItem[]).map((item) => ({
  ...item,
  category: "hld" as const,
  group: item.tags.includes("fundamentals") ? "fundamentals" : "classic-systems",
}));

export async function getHldContent(): Promise<ContentSection> {
  return {
    items: HLD_ITEMS,
    groups: [...HLD_GROUPS],
    groupLabels: HLD_GROUP_LABELS,
    difficulties: ["beginner", "intermediate", "advanced"] as const,
  };
}

// --- LLD ---

const LLD_GROUPS = ["tier-1", "tier-2", "tier-3"] as const;
const LLD_GROUP_LABELS: Record<string, string> = {
  "tier-1": "Tier 1 — Highest Frequency",
  "tier-2": "Tier 2 — High Frequency",
  "tier-3": "Tier 3 — Good to Know",
};

const LLD_ITEMS: CategorizedItem[] = (lld as ContentItem[]).map((item) => {
  const tier = item.tags.find((t) => t.startsWith("tier-")) ?? "tier-2";
  return {
    ...item,
    category: "lld" as const,
    group: tier,
  };
});

export async function getLldContent(): Promise<ContentSection> {
  return {
    items: LLD_ITEMS,
    groups: [...LLD_GROUPS],
    groupLabels: LLD_GROUP_LABELS,
    difficulties: ["easy", "medium", "hard"] as const,
  };
}

// --- Behavioral ---

const BEHAVIORAL_GROUPS = [
  "leadership",
  "ownership",
  "problem-solving",
  "communication",
  "conflict-resolution",
  "learning",
] as const;

const BEHAVIORAL_GROUP_LABELS: Record<string, string> = {
  leadership: "Leadership & Influence",
  ownership: "Ownership & Accountability",
  "problem-solving": "Problem Solving",
  communication: "Communication",
  "conflict-resolution": "Conflict Resolution",
  learning: "Learning & Growth",
};

const BEHAVIORAL_ITEMS: CategorizedItem[] = (
  behavioral as ContentItem[]
).map((item) => {
  const competency =
    item.tags.find((t) => BEHAVIORAL_GROUPS.includes(t as typeof BEHAVIORAL_GROUPS[number])) ??
    "leadership";
  return {
    ...item,
    category: "behavioral" as const,
    group: competency,
  };
});

export async function getBehavioralContent(): Promise<ContentSection> {
  return {
    items: BEHAVIORAL_ITEMS,
    groups: [...BEHAVIORAL_GROUPS],
    groupLabels: BEHAVIORAL_GROUP_LABELS,
    difficulties: [] as string[],
  };
}

// --- All content ---

export async function getAllContent(): Promise<CategorizedItem[]> {
  return [...DSA_ITEMS, ...HLD_ITEMS, ...LLD_ITEMS, ...BEHAVIORAL_ITEMS];
}

export async function getDashboardSections(): Promise<DashboardSection[]> {
  return [
    {
      category: "dsa" as const,
      label: "DSA",
      href: "/progress/dsa",
      items: DSA_ITEMS,
      description: `${DSA_ITEMS.length} problems across ${dsaPatterns.length} patterns`,
    },
    {
      category: "hld" as const,
      label: "High-Level Design",
      href: "/progress/hld",
      items: HLD_ITEMS,
      description: `${HLD_ITEMS.length} systems and concepts`,
    },
    {
      category: "lld" as const,
      label: "Low-Level Design",
      href: "/progress/lld",
      items: LLD_ITEMS,
      description: `${LLD_ITEMS.length} OOP design problems`,
    },
    {
      category: "behavioral" as const,
      label: "Behavioral",
      href: "/progress/behavioral",
      items: BEHAVIORAL_ITEMS,
      description: `${BEHAVIORAL_ITEMS.length} STAR questions across 6 competencies`,
    },
  ];
}

/**
 * Static content source adapter — reads from bundled JSON files.
 * Implements the ContentSource port for swapability.
 */
export class StaticContentSource implements ContentSource {
  getDsaContent = getDsaContent;
  getHldContent = getHldContent;
  getLldContent = getLldContent;
  getBehavioralContent = getBehavioralContent;
  getAllContent = getAllContent;
  getDashboardSections = getDashboardSections;
}
