import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useColorScheme,
} from "react-native";
import { Link } from "expo-router";
import type { FeedArticle } from "@tulmek/core/domain";
import { COMPANY_DISPLAY } from "@tulmek/core/domain";
import { TRENDING_SCORE_THRESHOLD } from "@tulmek/config/constants";
import feedData from "@tulmek/content/hub/feed";

const articles = feedData as unknown as FeedArticle[];

// Subset of well-covered companies (mirrors web compare page)
const COMPARE_SLUGS = [
  "google", "amazon", "meta", "apple", "microsoft", "netflix",
  "uber", "stripe", "openai", "nvidia", "anthropic",
] as const;

type SortKey = "articles" | "sources" | "dsa" | "system-design" | "compensation" | "experiences";

interface CompanyRow {
  slug: string;
  name: string;
  count: number;
  srcCount: number;
  dsa: number;
  systemDesign: number;
  compensation: number;
  experiences: number;
  trending: boolean;
}

function buildRow(slug: string): CompanyRow {
  const lower = slug.toLowerCase();
  const name = (COMPANY_DISPLAY as Record<string, string>)[slug] ?? slug;
  const matched = articles.filter((a) => {
    const text = `${a.title} ${a.excerpt}`.toLowerCase();
    if (a.title.includes("|")) {
      const first = a.title.split("|")[0]!.trim().toLowerCase();
      if (first === lower) return true;
    }
    return text.includes(lower);
  });
  const cats: Record<string, number> = {};
  for (const a of matched) cats[a.category] = (cats[a.category] ?? 0) + 1;
  const srcs = new Set(matched.map((a) => a.source));
  const trending = matched.some((a) => a.score >= TRENDING_SCORE_THRESHOLD);
  return {
    slug,
    name,
    count: matched.length,
    srcCount: srcs.size,
    dsa: cats["dsa"] ?? 0,
    systemDesign: cats["system-design"] ?? 0,
    compensation: cats["compensation"] ?? 0,
    experiences: cats["interview-experience"] ?? 0,
    trending,
  };
}

const SORT_LABELS: { key: SortKey; label: string }[] = [
  { key: "articles", label: "Articles" },
  { key: "sources", label: "Sources" },
  { key: "dsa", label: "DSA" },
  { key: "system-design", label: "Sys Design" },
  { key: "compensation", label: "Comp" },
  { key: "experiences", label: "Exp" },
];

function getValue(row: CompanyRow, key: SortKey): number {
  switch (key) {
    case "articles": return row.count;
    case "sources": return row.srcCount;
    case "dsa": return row.dsa;
    case "system-design": return row.systemDesign;
    case "compensation": return row.compensation;
    case "experiences": return row.experiences;
  }
}

export default function CompareScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme !== "light";
  const t = isDark ? dark : light;

  const [sortKey, setSortKey] = useState<SortKey>("articles");

  const rows = useMemo(() => {
    const built = COMPARE_SLUGS.map(buildRow);
    return [...built].sort((a, b) => getValue(b, sortKey) - getValue(a, sortKey));
  }, [sortKey]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.bg }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <Text style={[styles.heading, { color: t.text }]}>Compare Companies</Text>
      <Text style={[styles.sub, { color: t.muted }]}>
        Side-by-side interview prep intelligence
      </Text>

      {/* Sort picker */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sortScroll}
        contentContainerStyle={styles.sortRow}
      >
        {SORT_LABELS.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[
              styles.sortChip,
              { backgroundColor: t.surface, borderColor: t.border },
              sortKey === key && styles.sortChipActive,
            ]}
            onPress={() => setSortKey(key)}
            accessibilityRole="button"
            accessibilityState={{ selected: sortKey === key }}
          >
            <Text
              style={[
                styles.sortChipText,
                { color: t.muted },
                sortKey === key && styles.sortChipTextActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Column headers */}
      <View style={[styles.headerRow, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Text style={[styles.colCompany, styles.colHeaderText, { color: t.text }]}>Company</Text>
        <Text style={[styles.colNum, styles.colHeaderText, { color: sortKey === "articles" ? t.accent : t.muted }]}>Art</Text>
        <Text style={[styles.colNum, styles.colHeaderText, { color: sortKey === "sources" ? t.accent : t.muted }]}>Src</Text>
        <Text style={[styles.colNum, styles.colHeaderText, { color: sortKey === "dsa" ? t.accent : t.muted }]}>DSA</Text>
        <Text style={[styles.colNum, styles.colHeaderText, { color: sortKey === "system-design" ? t.accent : t.muted }]}>SysDes</Text>
        <Text style={[styles.colNum, styles.colHeaderText, { color: sortKey === "compensation" ? t.accent : t.muted }]}>Comp</Text>
        <Text style={[styles.colNum, styles.colHeaderText, { color: sortKey === "experiences" ? t.accent : t.muted }]}>Exp</Text>
      </View>

      {/* Company rows */}
      {rows.map((row, i) => (
        <Link key={row.slug} href={`/company/${row.slug}`} asChild>
          <Pressable
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: i % 2 === 0 ? t.surface : t.surfaceAlt, borderColor: t.border },
              pressed && styles.rowPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${row.name}: ${row.count} articles`}
          >
            <View style={styles.colCompany}>
              <Text style={[styles.companyName, { color: t.accent }]} numberOfLines={1}>
                {row.name}
              </Text>
              {row.trending && (
                <Text style={styles.trendBadge}>TREND</Text>
              )}
            </View>
            <NumCell value={row.count} highlighted={sortKey === "articles"} t={t} />
            <NumCell value={row.srcCount} highlighted={sortKey === "sources"} t={t} />
            <NumCell value={row.dsa} highlighted={sortKey === "dsa"} t={t} />
            <NumCell value={row.systemDesign} highlighted={sortKey === "system-design"} t={t} />
            <NumCell value={row.compensation} highlighted={sortKey === "compensation"} t={t} />
            <NumCell value={row.experiences} highlighted={sortKey === "experiences"} t={t} />
          </Pressable>
        </Link>
      ))}

      <Text style={[styles.footer, { color: t.muted }]}>
        {articles.length} articles total · tap row to explore
      </Text>
    </ScrollView>
  );
}

function NumCell({ value, highlighted, t }: { value: number; highlighted: boolean; t: typeof dark }) {
  return (
    <Text
      style={[
        styles.colNum,
        styles.numCell,
        { color: highlighted ? t.accent : value === 0 ? t.muted : t.textSecondary },
        highlighted && styles.numCellHighlighted,
      ]}
    >
      {value}
    </Text>
  );
}

// ── Theme tokens ──
const dark = {
  bg: "#09090b",
  surface: "#18181b",
  surfaceAlt: "#09090b",
  border: "#27272a",
  text: "#fafafa",
  textSecondary: "#e4e4e7",
  muted: "#71717a",
  accent: "#3b82f6",
};

const light = {
  bg: "#ffffff",
  surface: "#f4f4f5",
  surfaceAlt: "#ffffff",
  border: "#e4e4e7",
  text: "#09090b",
  textSecondary: "#3f3f46",
  muted: "#a1a1aa",
  accent: "#2563eb",
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },

  // Header
  heading: { fontSize: 22, fontWeight: "800" as const, paddingHorizontal: 16, paddingTop: 16 },
  sub: { fontSize: 13, paddingHorizontal: 16, marginTop: 2, marginBottom: 12 },

  // Sort strip
  sortScroll: { flexGrow: 0 },
  sortRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center" as const,
  },
  sortChipActive: { backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
  sortChipText: { fontSize: 12, fontWeight: "600" as const },
  sortChipTextActive: { color: "#ffffff" },

  // Table header row
  headerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginTop: 4,
  },
  colHeaderText: { fontSize: 11, fontWeight: "700" as const },

  // Data rows
  row: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 12,
    paddingVertical: 0,
    borderBottomWidth: 1,
    minHeight: 44,
  },
  rowPressed: { opacity: 0.7 },

  // Columns
  colCompany: {
    flex: 2,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingVertical: 12,
  },
  colNum: {
    flex: 1,
    textAlign: "center" as const,
  },

  companyName: { fontSize: 13, fontWeight: "700" as const },
  trendBadge: {
    fontSize: 8,
    fontWeight: "700" as const,
    color: "#ef4444",
    backgroundColor: "#ef444415",
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
    overflow: "hidden" as const,
  },

  numCell: { fontSize: 13 },
  numCellHighlighted: { fontWeight: "700" as const },

  footer: { fontSize: 12, textAlign: "center" as const, marginTop: 20, paddingHorizontal: 16 },
});
