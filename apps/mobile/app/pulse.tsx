import { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from "react-native";
import type { FeedArticle } from "@tulmek/core/domain";
import { tulmekRank, getCategoryMeta, getSourceLabel, formatRelativeTime } from "@tulmek/core/domain";
import { TRENDING_SCORE_THRESHOLD } from "@tulmek/config/constants";
import feedData from "@tulmek/content/hub/feed";
import { Link } from "expo-router";

const articles = feedData as unknown as FeedArticle[];

const DISPLAY_NAMES: Record<string, string> = {
  google: "Google", amazon: "Amazon", meta: "Meta", apple: "Apple",
  microsoft: "Microsoft", openai: "OpenAI", nvidia: "NVIDIA",
};

export default function PulsePage() {
  const [nowMs] = useState(() => Date.now());
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  const thisWeek = useMemo(
    () => articles.filter((a) => nowMs - new Date(a.publishedAt).getTime() < weekMs),
    [nowMs, weekMs]
  );

  const top5 = useMemo(
    () => tulmekRank(thisWeek, nowMs, new Set(), {}).slice(0, 5),
    [thisWeek, nowMs]
  );

  // Category counts
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of thisWeek) counts[a.category] = (counts[a.category] ?? 0) + 1;
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 6);
  }, [thisWeek]);

  // Company mentions
  const companies = useMemo(() => {
    const regex = /\b(google|amazon|meta|microsoft|openai|nvidia|apple)\b/gi;
    const counts: Record<string, number> = {};
    for (const a of thisWeek) {
      const matches = `${a.title} ${a.excerpt}`.match(regex);
      if (matches) for (const m of matches) {
        const name = DISPLAY_NAMES[m.toLowerCase()] ?? m;
        counts[name] = (counts[name] ?? 0) + 1;
      }
    }
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 6);
  }, [thisWeek]);

  const totalComments = thisWeek.reduce((s, a) => s + a.commentCount, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Interview Market Pulse</Text>
      <Text style={styles.sub}>{thisWeek.length} articles this week</Text>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Articles" value={thisWeek.length} />
        <StatCard label="Companies" value={companies.length} />
        <StatCard label="Discussions" value={totalComments >= 1000 ? `${(totalComments / 1000).toFixed(1)}k` : String(totalComments)} />
      </View>

      {/* Trending companies */}
      {companies.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending Companies</Text>
          <View style={styles.chipRow}>
            {companies.map(([name, count]) => (
              <Link key={name} href={`/company/${name.toLowerCase()}`} style={styles.chip}>
                <Text style={styles.chipText}>{name} {count}</Text>
              </Link>
            ))}
          </View>
        </View>
      )}

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.catGrid}>
          {catCounts.map(([cat, count]) => (
            <View key={cat} style={styles.catCard}>
              <Text style={styles.catValue}>{count}</Text>
              <Text style={styles.catLabel}>{getCategoryMeta(cat).label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Top 5 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Articles</Text>
        {top5.map((a, i) => (
          <Pressable
            key={a.id}
            style={({ pressed }) => [styles.articleCard, pressed && styles.pressed]}
            onPress={() => Linking.openURL(a.url)}
          >
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{i + 1}</Text>
            </View>
            <View style={styles.articleContent}>
              <View style={styles.articleMeta}>
                <Text style={styles.metaText}>{getSourceLabel(a.source)}</Text>
                <Text style={styles.metaText}>{formatRelativeTime(a.publishedAt)}</Text>
                {a.score >= TRENDING_SCORE_THRESHOLD && <Text style={styles.trendBadge}>TRENDING</Text>}
              </View>
              <Text style={styles.articleTitle} numberOfLines={2}>{a.title}</Text>
            </View>
          </Pressable>
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
  sectionTitle: { fontSize: 14, fontWeight: "700" as const, color: "#fafafa", marginBottom: 8 },
  chipRow: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 6 },
  chip: { backgroundColor: "#18181b", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: "#27272a" },
  chipText: { fontSize: 12, fontWeight: "600" as const, color: "#a1a1aa" },
  catGrid: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 8 },
  catCard: { width: "30%" as unknown as number, backgroundColor: "#18181b", borderRadius: 8, padding: 10, alignItems: "center" as const, borderWidth: 1, borderColor: "#27272a" },
  catValue: { fontSize: 16, fontWeight: "800" as const, color: "#fafafa" },
  catLabel: { fontSize: 9, color: "#71717a", marginTop: 2 },
  articleCard: { flexDirection: "row" as const, gap: 10, backgroundColor: "#18181b", borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#27272a" },
  pressed: { opacity: 0.8 },
  rankBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#3b82f620", alignItems: "center" as const, justifyContent: "center" as const },
  rankText: { fontSize: 12, fontWeight: "800" as const, color: "#3b82f6" },
  articleContent: { flex: 1 },
  articleMeta: { flexDirection: "row" as const, gap: 6, marginBottom: 4 },
  metaText: { fontSize: 10, color: "#71717a" },
  trendBadge: { fontSize: 9, fontWeight: "700" as const, color: "#ef4444", backgroundColor: "#ef444415", paddingHorizontal: 4, borderRadius: 3, overflow: "hidden" as const },
  articleTitle: { fontSize: 13, fontWeight: "600" as const, color: "#fafafa", lineHeight: 18 },
  backLink: { marginTop: 16, alignSelf: "center" as const },
  backLinkText: { fontSize: 13, color: "#3b82f6", fontWeight: "600" as const },
});
