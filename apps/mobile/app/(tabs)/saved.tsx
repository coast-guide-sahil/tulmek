import { useState, useEffect, useCallback } from "react";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FeedArticle } from "@tulmek/core/domain";
import { getCategoryMeta, getSourceLabel, formatRelativeTime } from "@tulmek/core/domain";
import feedData from "@tulmek/content/hub/feed";
import { Link } from "expo-router";

const articles = feedData as unknown as FeedArticle[];
const BOOKMARKS_KEY = "tulmek:hub:bookmarks";

const CATEGORY_COLORS: Record<string, string> = {
  dsa: "#10b981", "system-design": "#3b82f6", "ai-ml": "#a855f7",
  behavioral: "#f59e0b", career: "#f43f5e", "interview-experience": "#06b6d4",
  compensation: "#eab308", general: "#6b7280",
};

export default function SavedPage() {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(BOOKMARKS_KEY).then((raw) => {
      if (raw) setBookmarkedIds(new Set(JSON.parse(raw) as string[]));
    });
  }, []);

  const savedArticles = articles.filter((a) => bookmarkedIds.has(a.id));

  const removeBookmark = useCallback((id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<FeedArticle>) => {
      const meta = getCategoryMeta(item.category);
      const color = CATEGORY_COLORS[item.category] ?? "#6b7280";
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
          </View>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <View style={styles.footer}>
            <Text style={styles.stat}>{item.readingTime} min</Text>
            <Pressable
              onPress={() => removeBookmark(item.id)}
              style={styles.removeBtn}
              hitSlop={8}
            >
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        </Pressable>
      );
    },
    [removeBookmark]
  );

  return (
    <View style={styles.container}>
      <FlashList
        data={savedArticles}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Saved Articles</Text>
            <Text style={styles.count}>{savedArticles.length} saved</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No saved articles yet.</Text>
            <Text style={styles.emptyHint}>Tap the bookmark icon on any article to save it.</Text>
            <Link href="/" style={styles.backLink}>
              <Text style={styles.backLinkText}>Browse articles</Text>
            </Link>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  list: { paddingBottom: 32 },
  header: { padding: 16, paddingTop: 8 },
  heading: { fontSize: 22, fontWeight: "800" as const, color: "#fafafa" },
  count: { fontSize: 13, color: "#71717a", marginTop: 2 },
  card: {
    marginHorizontal: 16, marginBottom: 10, backgroundColor: "#18181b",
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#27272a", borderLeftWidth: 3,
  },
  cardPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  cardHeader: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, marginBottom: 6 },
  pill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { fontSize: 11, fontWeight: "700" as const },
  source: { fontSize: 12, fontWeight: "600" as const, color: "#a1a1aa" },
  time: { fontSize: 12, color: "#71717a" },
  title: { fontSize: 15, fontWeight: "700" as const, color: "#fafafa", lineHeight: 22 },
  footer: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const, marginTop: 10 },
  stat: { fontSize: 12, color: "#71717a" },
  removeBtn: { minWidth: 44, minHeight: 44, justifyContent: "center" as const, alignItems: "center" as const },
  removeText: { fontSize: 12, color: "#ef4444", fontWeight: "600" as const },
  empty: { alignItems: "center" as const, paddingTop: 80, paddingHorizontal: 32 },
  emptyText: { fontSize: 16, fontWeight: "600" as const, color: "#fafafa" },
  emptyHint: { fontSize: 13, color: "#71717a", marginTop: 8, textAlign: "center" as const },
  backLink: { marginTop: 16 },
  backLinkText: { fontSize: 14, color: "#3b82f6", fontWeight: "600" as const },
});
