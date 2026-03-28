import { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import type { FeedArticle } from "@tulmek/core/domain";
import { getCategoryMeta, getSourceLabel } from "@tulmek/core/domain";
import feedData from "@tulmek/content/hub/feed";
import metadataJson from "@tulmek/content/hub/metadata";
import type { FeedMetadata } from "@tulmek/core/domain";
import { Link } from "expo-router";
import { useThemeColors } from "../src/hooks/useThemeColors";
import type { ThemeColors } from "../src/hooks/useThemeColors";

const articles = feedData as unknown as FeedArticle[];
const feedMeta = metadataJson as unknown as FeedMetadata;

export default function ReportPage() {
  const t = useThemeColors();
  const [nowMs] = useState(() => Date.now());
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const dayMs = 24 * 60 * 60 * 1000;

  const thisWeek = useMemo(
    () => articles.filter((a) => nowMs - new Date(a.publishedAt).getTime() < weekMs),
    [nowMs, weekMs]
  );
  const today = useMemo(
    () => articles.filter((a) => nowMs - new Date(a.publishedAt).getTime() < dayMs),
    [nowMs, dayMs]
  );

  const catDist = useMemo(() =>
    Object.entries(feedMeta.categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, count]) => ({
        label: getCategoryMeta(cat).label,
        count,
        pct: Math.round((count / feedMeta.totalArticles) * 100),
      })),
    []
  );

  const srcDist = useMemo(() =>
    Object.entries(feedMeta.sourceBreakdown)
      .sort(([, a], [, b]) => b - a)
      .map(([src, count]) => ({
        label: getSourceLabel(src),
        count,
        pct: Math.round((count / feedMeta.totalArticles) * 100),
      })),
    []
  );

  const totalComments = articles.reduce((s, a) => s + a.commentCount, 0);
  const todayPct = Math.round((today.length / articles.length) * 100);
  const weekPct = Math.round((thisWeek.length / articles.length) * 100);

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.heading, { color: t.text }]}>Interview Market Report</Text>
      <Text style={[styles.sub, { color: t.textMuted }]}>{feedMeta.totalArticles} articles from {Object.keys(feedMeta.sourceBreakdown).length} sources</Text>

      {/* Key metrics */}
      <View style={styles.statsRow}>
        <StatCard label="Articles" value={feedMeta.totalArticles} t={t} />
        <StatCard label="Sources" value={Object.keys(feedMeta.sourceBreakdown).length} t={t} />
        <StatCard label="Discussions" value={`${(totalComments / 1000).toFixed(1)}k`} t={t} />
      </View>

      {/* Freshness */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>Content Freshness</Text>
        <View style={styles.freshnessRow}>
          <View style={[styles.freshnessCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            <Text style={[styles.freshnessValue, { color: t.primary }]}>{today.length}</Text>
            <Text style={[styles.freshnessLabel, { color: t.textMuted }]}>Today ({todayPct}%)</Text>
          </View>
          <View style={[styles.freshnessCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            <Text style={[styles.freshnessValue, { color: t.text }]}>{thisWeek.length}</Text>
            <Text style={[styles.freshnessLabel, { color: t.textMuted }]}>This Week ({weekPct}%)</Text>
          </View>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>Category Distribution</Text>
        {catDist.map((cat) => (
          <View key={cat.label} style={styles.barRow}>
            <Text style={[styles.barLabel, { color: t.textSecondary }]}>{cat.label}</Text>
            <View style={[styles.barTrack, { backgroundColor: t.cardBorder }]}>
              <View style={[styles.barFill, { width: `${(cat.count / catDist[0]!.count) * 100}%` }]} />
            </View>
            <Text style={[styles.barValue, { color: t.textSecondary }]}>{cat.count}</Text>
          </View>
        ))}
      </View>

      {/* Sources */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>Source Distribution</Text>
        {srcDist.map((src) => (
          <View key={src.label} style={styles.barRow}>
            <Text style={[styles.barLabel, { color: t.textSecondary }]}>{src.label}</Text>
            <View style={[styles.barTrack, { backgroundColor: t.cardBorder }]}>
              <View style={[styles.barFill, { width: `${(src.count / srcDist[0]!.count) * 100}%` }]} />
            </View>
            <Text style={[styles.barValue, { color: t.textSecondary }]}>{src.count}</Text>
          </View>
        ))}
      </View>

      <Link href="/" style={styles.backLink}>
        <Text style={[styles.backLinkText, { color: t.primary }]}>Browse all articles</Text>
      </Link>
    </ScrollView>
  );
}

function StatCard({ label, value, t }: { label: string; value: number | string; t: ThemeColors }) {
  return (
    <View style={[styles.statCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
      <Text style={[styles.statValue, { color: t.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: t.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: "800" as const },
  sub: { fontSize: 13, marginTop: 2 },
  statsRow: { flexDirection: "row" as const, gap: 8, marginTop: 16 },
  statCard: { flex: 1, borderRadius: 10, padding: 12, alignItems: "center" as const, borderWidth: 1 },
  statValue: { fontSize: 20, fontWeight: "800" as const },
  statLabel: { fontSize: 10, marginTop: 2 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 14, fontWeight: "700" as const, marginBottom: 10 },
  freshnessRow: { flexDirection: "row" as const, gap: 8 },
  freshnessCard: { flex: 1, borderRadius: 10, padding: 12, alignItems: "center" as const, borderWidth: 1 },
  freshnessValue: { fontSize: 24, fontWeight: "800" as const },
  freshnessLabel: { fontSize: 10, marginTop: 2 },
  barRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, marginBottom: 6 },
  barLabel: { width: 80, fontSize: 11 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" as const },
  barFill: { height: "100%" as unknown as number, backgroundColor: "#3b82f680", borderRadius: 3 },
  barValue: { width: 30, fontSize: 11, textAlign: "right" as const },
  backLink: { marginTop: 20, alignSelf: "center" as const },
  backLinkText: { fontSize: 13, fontWeight: "600" as const },
});
