import { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import type { FeedArticle } from "@tulmek/core/domain";
import { getCategoryMeta, getSourceLabel } from "@tulmek/core/domain";
import feedData from "@tulmek/content/hub/feed";
import metadataJson from "@tulmek/content/hub/metadata";
import type { FeedMetadata } from "@tulmek/core/domain";
import { Link } from "expo-router";

const articles = feedData as unknown as FeedArticle[];
const feedMeta = metadataJson as unknown as FeedMetadata;

export default function ReportPage() {
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Interview Market Report</Text>
      <Text style={styles.sub}>{feedMeta.totalArticles} articles from {Object.keys(feedMeta.sourceBreakdown).length} sources</Text>

      {/* Key metrics */}
      <View style={styles.statsRow}>
        <StatCard label="Articles" value={feedMeta.totalArticles} />
        <StatCard label="Sources" value={Object.keys(feedMeta.sourceBreakdown).length} />
        <StatCard label="Discussions" value={`${(totalComments / 1000).toFixed(1)}k`} />
      </View>

      {/* Freshness */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Content Freshness</Text>
        <View style={styles.freshnessRow}>
          <View style={styles.freshnessCard}>
            <Text style={[styles.freshnessValue, { color: "#3b82f6" }]}>{today.length}</Text>
            <Text style={styles.freshnessLabel}>Today ({todayPct}%)</Text>
          </View>
          <View style={styles.freshnessCard}>
            <Text style={styles.freshnessValue}>{thisWeek.length}</Text>
            <Text style={styles.freshnessLabel}>This Week ({weekPct}%)</Text>
          </View>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category Distribution</Text>
        {catDist.map((cat) => (
          <View key={cat.label} style={styles.barRow}>
            <Text style={styles.barLabel}>{cat.label}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${(cat.count / catDist[0]!.count) * 100}%` }]} />
            </View>
            <Text style={styles.barValue}>{cat.count}</Text>
          </View>
        ))}
      </View>

      {/* Sources */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Source Distribution</Text>
        {srcDist.map((src) => (
          <View key={src.label} style={styles.barRow}>
            <Text style={styles.barLabel}>{src.label}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${(src.count / srcDist[0]!.count) * 100}%` }]} />
            </View>
            <Text style={styles.barValue}>{src.count}</Text>
          </View>
        ))}
      </View>

      <Link href="/" style={styles.backLink}>
        <Text style={styles.backLinkText}>Browse all articles</Text>
      </Link>
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: "800" as const, color: "#fafafa" },
  sub: { fontSize: 13, color: "#71717a", marginTop: 2 },
  statsRow: { flexDirection: "row" as const, gap: 8, marginTop: 16 },
  statCard: { flex: 1, backgroundColor: "#18181b", borderRadius: 10, padding: 12, alignItems: "center" as const, borderWidth: 1, borderColor: "#27272a" },
  statValue: { fontSize: 20, fontWeight: "800" as const, color: "#fafafa" },
  statLabel: { fontSize: 10, color: "#71717a", marginTop: 2 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 14, fontWeight: "700" as const, color: "#fafafa", marginBottom: 10 },
  freshnessRow: { flexDirection: "row" as const, gap: 8 },
  freshnessCard: { flex: 1, backgroundColor: "#18181b", borderRadius: 10, padding: 12, alignItems: "center" as const, borderWidth: 1, borderColor: "#27272a" },
  freshnessValue: { fontSize: 24, fontWeight: "800" as const, color: "#fafafa" },
  freshnessLabel: { fontSize: 10, color: "#71717a", marginTop: 2 },
  barRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, marginBottom: 6 },
  barLabel: { width: 80, fontSize: 11, color: "#a1a1aa" },
  barTrack: { flex: 1, height: 6, backgroundColor: "#27272a", borderRadius: 3, overflow: "hidden" as const },
  barFill: { height: "100%" as unknown as number, backgroundColor: "#3b82f680", borderRadius: 3 },
  barValue: { width: 30, fontSize: 11, color: "#a1a1aa", textAlign: "right" as const },
  backLink: { marginTop: 20, alignSelf: "center" as const },
  backLinkText: { fontSize: 13, color: "#3b82f6", fontWeight: "600" as const },
});
