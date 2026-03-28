import { useLocalSearchParams } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import type { FeedArticle } from "@tulmek/core/domain";
import { tulmekRank, getCategoryMeta, getSourceLabel, formatRelativeTime, getCompanyName } from "@tulmek/core/domain";
import { TRENDING_SCORE_THRESHOLD } from "@tulmek/config/constants";
import feedData from "@tulmek/content/hub/feed";
import { useState } from "react";
import { useThemeColors } from "../../src/hooks/useThemeColors";

const articles = feedData as unknown as FeedArticle[];


const CATEGORY_COLORS: Record<string, string> = {
  dsa: "#10b981", "system-design": "#3b82f6", "ai-ml": "#a855f7",
  behavioral: "#f59e0b", career: "#f43f5e", "interview-experience": "#06b6d4",
  compensation: "#eab308", general: "#6b7280",
};

export default function CompanyPage() {
  const t = useThemeColors();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [nowMs] = useState(() => Date.now());

  const name = getCompanyName(slug ?? "");
  const lower = (slug ?? "").toLowerCase();

  const companyArticles = articles.filter((a) => {
    const text = `${a.title} ${a.excerpt}`.toLowerCase();
    if (a.title.includes("|")) {
      const first = a.title.split("|")[0]!.trim().toLowerCase();
      if (first === lower) return true;
    }
    return text.includes(lower);
  });

  const ranked = tulmekRank(companyArticles, nowMs, new Set(), {});

  // Category counts
  const catCounts: Record<string, number> = {};
  for (const a of companyArticles) {
    catCounts[a.category] = (catCounts[a.category] ?? 0) + 1;
  }
  const topCats = Object.entries(catCounts).sort(([, a], [, b]) => b - a).slice(0, 4);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <FlashList
        data={ranked}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <Text style={[styles.heading, { color: t.text }]}>{name} Interview Prep</Text>
            <Text style={[styles.sub, { color: t.textMuted }]}>{companyArticles.length} articles</Text>

            {/* Stats */}
            <View style={styles.statsRow}>
              {topCats.map(([cat, count]) => (
                <View key={cat} style={[styles.statCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
                  <Text style={[styles.statValue, { color: t.text }]}>{count}</Text>
                  <Text style={[styles.statLabel, { color: t.textMuted }]}>{getCategoryMeta(cat).label}</Text>
                </View>
              ))}
            </View>
          </>
        }
        renderItem={({ item }) => {
          const color = CATEGORY_COLORS[item.category] ?? "#6b7280";
          const meta = getCategoryMeta(item.category);
          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: t.card, borderColor: t.cardBorder, borderLeftColor: color },
                pressed && styles.cardPressed,
              ]}
              onPress={() => Linking.openURL(item.url)}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.pill, { backgroundColor: color + "20" }]}>
                  <Text style={[styles.pillText, { color }]}>{meta.label}</Text>
                </View>
                <Text style={[styles.source, { color: t.textSecondary }]}>{getSourceLabel(item.source)}</Text>
                <Text style={[styles.time, { color: t.textMuted }]}>{formatRelativeTime(item.publishedAt)}</Text>
                {item.score >= TRENDING_SCORE_THRESHOLD && <Text style={styles.trending}>TRENDING</Text>}
              </View>
              <Text style={[styles.title, { color: t.text }]} numberOfLines={2}>{item.title}</Text>
              <View style={styles.footer}>
                {item.score > 0 && <Text style={[styles.stat, { color: t.textMuted }]}>▲ {item.score >= 1000 ? `${(item.score / 1000).toFixed(1)}k` : item.score}</Text>}
                {item.commentCount > 0 && <Text style={[styles.stat, { color: t.textMuted }]}>💬 {item.commentCount}</Text>}
                <Text style={[styles.stat, { color: t.textMuted }]}>{item.readingTime} min</Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: t.textMuted }]}>No articles found for {name}.</Text>
        }
        ListFooterComponent={
          companyArticles.length > 0 ? (() => {
            const catCounts = new Map<string, number>();
            for (const a of companyArticles) {
              catCounts.set(a.category, (catCounts.get(a.category) ?? 0) + 1);
            }
            const total = [...catCounts.values()].reduce((s, v) => s + v, 0);
            const topCats = [...catCounts.entries()]
              .map(([cat, count]) => ({ cat, count, pct: Math.round((count / total) * 100) }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 5);

            return (
              <View style={[styles.prepSection, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
                <Text style={[styles.prepTitle, { color: t.text }]}>
                  Prep Plan for {name}
                </Text>
                <Text style={[styles.prepSub, { color: t.textMuted }]}>
                  Based on {companyArticles.length} articles
                </Text>
                {topCats.map(({ cat, pct }) => (
                  <View key={cat} style={styles.barRow}>
                    <View style={styles.barLabel}>
                      <Text style={[styles.barCatText, { color: t.text }]}>
                        {getCategoryMeta(cat).label}
                      </Text>
                      <Text style={[styles.barPctText, { color: t.textMuted }]}>{pct}%</Text>
                    </View>
                    <View style={[styles.barTrack, { backgroundColor: t.cardBorder }]}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${pct}%`, backgroundColor: CATEGORY_COLORS[cat] ?? t.primary },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            );
          })() : null
        }
      />
    </View>
  );
}



const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingBottom: 32 },
  heading: { fontSize: 22, fontWeight: "800" as const, paddingHorizontal: 16, paddingTop: 8 },
  sub: { fontSize: 13, paddingHorizontal: 16, marginTop: 2 },
  statsRow: { flexDirection: "row" as const, gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  statCard: { flex: 1, borderRadius: 10, padding: 10, alignItems: "center" as const, borderWidth: 1 },
  statValue: { fontSize: 18, fontWeight: "800" as const },
  statLabel: { fontSize: 10, marginTop: 2 },
  card: { marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 14, borderWidth: 1, borderLeftWidth: 3 },
  cardPressed: { opacity: 0.8 },
  cardHeader: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, marginBottom: 6 },
  pill: { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  pillText: { fontSize: 10, fontWeight: "700" as const },
  source: { fontSize: 11, fontWeight: "600" as const },
  time: { fontSize: 11 },
  trending: { fontSize: 9, fontWeight: "700" as const, color: "#ef4444", backgroundColor: "#ef444415", paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, overflow: "hidden" as const },
  title: { fontSize: 14, fontWeight: "700" as const, lineHeight: 20 },
  footer: { flexDirection: "row" as const, gap: 10, marginTop: 8 },
  stat: { fontSize: 11 },
  empty: { fontSize: 14, textAlign: "center" as const, paddingTop: 40 },
  prepSection: { margin: 16, marginTop: 8, borderRadius: 12, padding: 16, borderWidth: 1 },
  prepTitle: { fontSize: 17, fontWeight: "800" as const, marginBottom: 4 },
  prepSub: { fontSize: 13, marginBottom: 12 },
  barRow: { marginBottom: 8 },
  barLabel: { flexDirection: "row" as const, justifyContent: "space-between" as const, marginBottom: 4 },
  barCatText: { fontSize: 13 },
  barPctText: { fontSize: 12 },
  barTrack: { height: 6, borderRadius: 3, overflow: "hidden" as const },
  barFill: { height: "100%" as const, borderRadius: 3 },
});
