import { useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet, FlatList, Pressable, Linking } from "react-native";
import type { FeedArticle } from "@tulmek/core/domain";
import { tulmekRank, getCategoryMeta, getSourceLabel, formatRelativeTime, getCompanyName } from "@tulmek/core/domain";
import { TRENDING_SCORE_THRESHOLD } from "@tulmek/config/constants";
import feedData from "@tulmek/content/hub/feed";
import { useState } from "react";

const articles = feedData as unknown as FeedArticle[];


const CATEGORY_COLORS: Record<string, string> = {
  dsa: "#10b981", "system-design": "#3b82f6", "ai-ml": "#a855f7",
  behavioral: "#f59e0b", career: "#f43f5e", "interview-experience": "#06b6d4",
  compensation: "#eab308", general: "#6b7280",
};

export default function CompanyPage() {
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
    <View style={styles.container}>
      <FlatList
        data={ranked}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <Text style={styles.heading}>{name} Interview Prep</Text>
            <Text style={styles.sub}>{companyArticles.length} articles</Text>

            {/* Stats */}
            <View style={styles.statsRow}>
              {topCats.map(([cat, count]) => (
                <View key={cat} style={styles.statCard}>
                  <Text style={styles.statValue}>{count}</Text>
                  <Text style={styles.statLabel}>{getCategoryMeta(cat).label}</Text>
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
              style={({ pressed }) => [styles.card, { borderLeftColor: color }, pressed && styles.cardPressed]}
              onPress={() => Linking.openURL(item.url)}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.pill, { backgroundColor: color + "20" }]}>
                  <Text style={[styles.pillText, { color }]}>{meta.label}</Text>
                </View>
                <Text style={styles.source}>{getSourceLabel(item.source)}</Text>
                <Text style={styles.time}>{formatRelativeTime(item.publishedAt)}</Text>
                {item.score >= TRENDING_SCORE_THRESHOLD && <Text style={styles.trending}>TRENDING</Text>}
              </View>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <View style={styles.footer}>
                {item.score > 0 && <Text style={styles.stat}>▲ {item.score >= 1000 ? `${(item.score / 1000).toFixed(1)}k` : item.score}</Text>}
                {item.commentCount > 0 && <Text style={styles.stat}>💬 {item.commentCount}</Text>}
                <Text style={styles.stat}>{item.readingTime} min</Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No articles found for {name}.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  list: { paddingBottom: 32 },
  heading: { fontSize: 22, fontWeight: "800" as const, color: "#fafafa", paddingHorizontal: 16, paddingTop: 8 },
  sub: { fontSize: 13, color: "#71717a", paddingHorizontal: 16, marginTop: 2 },
  statsRow: { flexDirection: "row" as const, gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  statCard: { flex: 1, backgroundColor: "#18181b", borderRadius: 10, padding: 10, alignItems: "center" as const, borderWidth: 1, borderColor: "#27272a" },
  statValue: { fontSize: 18, fontWeight: "800" as const, color: "#fafafa" },
  statLabel: { fontSize: 10, color: "#71717a", marginTop: 2 },
  card: { marginHorizontal: 16, marginBottom: 8, backgroundColor: "#18181b", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#27272a", borderLeftWidth: 3 },
  cardPressed: { opacity: 0.8 },
  cardHeader: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, marginBottom: 6 },
  pill: { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  pillText: { fontSize: 10, fontWeight: "700" as const },
  source: { fontSize: 11, fontWeight: "600" as const, color: "#a1a1aa" },
  time: { fontSize: 11, color: "#71717a" },
  trending: { fontSize: 9, fontWeight: "700" as const, color: "#ef4444", backgroundColor: "#ef444415", paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, overflow: "hidden" as const },
  title: { fontSize: 14, fontWeight: "700" as const, color: "#fafafa", lineHeight: 20 },
  footer: { flexDirection: "row" as const, gap: 10, marginTop: 8 },
  stat: { fontSize: 11, color: "#71717a" },
  empty: { fontSize: 14, color: "#71717a", textAlign: "center" as const, paddingTop: 40 },
});
