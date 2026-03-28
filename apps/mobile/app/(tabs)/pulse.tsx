import { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from "react-native";
import type { FeedArticle } from "@tulmek/core/domain";
import { tulmekRank, getCategoryMeta, getSourceLabel, formatRelativeTime } from "@tulmek/core/domain";
import { TRENDING_SCORE_THRESHOLD } from "@tulmek/config/constants";
import feedData from "@tulmek/content/hub/feed";
import { Link } from "expo-router";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import type { ThemeColors } from "../../src/hooks/useThemeColors";

const articles = feedData as unknown as FeedArticle[];

const DISPLAY_NAMES: Record<string, string> = {
  google: "Google", amazon: "Amazon", meta: "Meta", apple: "Apple",
  microsoft: "Microsoft", openai: "OpenAI", nvidia: "NVIDIA",
};

export default function PulsePage() {
  const t = useThemeColors();
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
    <ScrollView style={[styles.container, { backgroundColor: t.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.heading, { color: t.text }]}>Interview Market Pulse</Text>
      <Text style={[styles.sub, { color: t.textMuted }]}>{thisWeek.length} articles this week</Text>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Articles" value={thisWeek.length} t={t} />
        <StatCard label="Companies" value={companies.length} t={t} />
        <StatCard label="Discussions" value={totalComments >= 1000 ? `${(totalComments / 1000).toFixed(1)}k` : String(totalComments)} t={t} />
      </View>

      {/* Trending companies */}
      {companies.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Trending Companies</Text>
          <View style={styles.chipRow}>
            {companies.map(([name, count]) => (
              <Link
                key={name}
                href={`/company/${name.toLowerCase()}`}
                style={[styles.chip, { backgroundColor: t.chipBg, borderColor: t.cardBorder }]}
              >
                <Text style={[styles.chipText, { color: t.textSecondary }]}>{name} {count}</Text>
              </Link>
            ))}
          </View>
        </View>
      )}

      {/* Categories */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>Categories</Text>
        <View style={styles.catGrid}>
          {catCounts.map(([cat, count]) => (
            <View key={cat} style={[styles.catCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
              <Text style={[styles.catValue, { color: t.text }]}>{count}</Text>
              <Text style={[styles.catLabel, { color: t.textMuted }]}>{getCategoryMeta(cat).label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Top 5 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>Top Articles</Text>
        {top5.map((a, i) => (
          <Pressable
            key={a.id}
            style={({ pressed }) => [
              styles.articleCard,
              { backgroundColor: t.card, borderColor: t.cardBorder },
              pressed && styles.pressed,
            ]}
            onPress={() => Linking.openURL(a.url)}
          >
            <View style={styles.rankBadge}>
              <Text style={[styles.rankText, { color: t.primary }]}>{i + 1}</Text>
            </View>
            <View style={styles.articleContent}>
              <View style={styles.articleMeta}>
                <Text style={[styles.metaText, { color: t.textMuted }]}>{getSourceLabel(a.source)}</Text>
                <Text style={[styles.metaText, { color: t.textMuted }]}>{formatRelativeTime(a.publishedAt)}</Text>
                {a.score >= TRENDING_SCORE_THRESHOLD && <Text style={styles.trendBadge}>TRENDING</Text>}
              </View>
              <Text style={[styles.articleTitle, { color: t.text }]} numberOfLines={2}>{a.title}</Text>
            </View>
          </Pressable>
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
  sectionTitle: { fontSize: 14, fontWeight: "700" as const, marginBottom: 8 },
  chipRow: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 6 },
  chip: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: "600" as const },
  catGrid: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 8 },
  catCard: { width: "30%" as unknown as number, borderRadius: 8, padding: 10, alignItems: "center" as const, borderWidth: 1 },
  catValue: { fontSize: 16, fontWeight: "800" as const },
  catLabel: { fontSize: 9, marginTop: 2 },
  articleCard: { flexDirection: "row" as const, gap: 10, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1 },
  pressed: { opacity: 0.8 },
  rankBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#3b82f620", alignItems: "center" as const, justifyContent: "center" as const },
  rankText: { fontSize: 12, fontWeight: "800" as const },
  articleContent: { flex: 1 },
  articleMeta: { flexDirection: "row" as const, gap: 6, marginBottom: 4 },
  metaText: { fontSize: 10 },
  trendBadge: { fontSize: 9, fontWeight: "700" as const, color: "#ef4444", backgroundColor: "#ef444415", paddingHorizontal: 4, borderRadius: 3, overflow: "hidden" as const },
  articleTitle: { fontSize: 13, fontWeight: "600" as const, lineHeight: 18 },
  backLink: { marginTop: 16, alignSelf: "center" as const },
  backLinkText: { fontSize: 13, fontWeight: "600" as const },
});
