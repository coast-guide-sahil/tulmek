import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Linking,
  TextInput,
  type ListRenderItemInfo,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link } from "expo-router";
import { APP_NAME, TRENDING_SCORE_THRESHOLD, NEW_ARTICLE_WINDOW_MS } from "@tulmek/config/constants";
import type { FeedArticle, HubCategory } from "@tulmek/core/domain";
import {
  tulmekRank,
  getCategoryMeta,
  getSourceLabel,
  formatRelativeTime,
  ALL_CATEGORIES,
} from "@tulmek/core/domain";
// Single source of truth — content shared via @tulmek/content package
import feedData from "@tulmek/content/hub/feed";
import metadataJson from "@tulmek/content/hub/metadata";

const articles = feedData as unknown as FeedArticle[];
const totalArticles = metadataJson.totalArticles;
const sourceCount = Object.keys(metadataJson.sourceBreakdown).length;

// ── Category colors (platform-agnostic, no Tailwind) ──
const CATEGORY_COLORS: Record<string, string> = {
  dsa: "#10b981",
  "system-design": "#3b82f6",
  "ai-ml": "#a855f7",
  behavioral: "#f59e0b",
  career: "#f43f5e",
  "interview-experience": "#06b6d4",
  compensation: "#eab308",
  general: "#6b7280",
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? "#6b7280";
}

// ── Bookmark Hook (AsyncStorage) ──
const BOOKMARKS_KEY = "tulmek:hub:bookmarks";

function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(BOOKMARKS_KEY).then((raw) => {
      if (raw) setBookmarks(new Set(JSON.parse(raw) as string[]));
    });
  }, []);

  const toggle = useCallback((id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  return { bookmarks, toggle };
}

// ── Article Card ──
function ArticleCard({ article, nowMs, isBookmarked, onToggleBookmark }: {
  article: FeedArticle;
  nowMs: number;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}) {
  const meta = getCategoryMeta(article.category);
  const color = getCategoryColor(article.category);
  const relTime = formatRelativeTime(article.publishedAt);
  const source = getSourceLabel(article.source);
  const isNew = nowMs - new Date(article.publishedAt).getTime() < NEW_ARTICLE_WINDOW_MS;
  const isTrending = article.score >= TRENDING_SCORE_THRESHOLD;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { borderLeftColor: color }, pressed && styles.cardPressed]}
      onPress={() => Linking.openURL(article.url)}
      accessibilityRole="link"
      accessibilityLabel={`${article.title} from ${source}`}
    >
      {/* Header: source + time + badges */}
      <View style={styles.cardHeader}>
        <View style={[styles.categoryPill, { backgroundColor: color + "20" }]}>
          <Text style={[styles.categoryPillText, { color }]}>{meta.label}</Text>
        </View>
        <Text style={styles.cardSource}>{source}</Text>
        <Text style={styles.cardTime}>{relTime}</Text>
        {isNew && <Text style={styles.newBadge}>NEW</Text>}
        {isTrending && <Text style={styles.trendingBadge}>TRENDING</Text>}
      </View>

      {/* Title */}
      <Text style={styles.cardTitle} numberOfLines={3}>
        {article.title}
      </Text>

      {/* Excerpt */}
      {article.excerpt !== article.title && (
        <Text style={styles.cardExcerpt} numberOfLines={2}>
          {article.excerpt}
        </Text>
      )}

      {/* Footer: stats + bookmark */}
      <View style={styles.cardFooter}>
        <View style={styles.cardStats}>
          {article.score > 0 && (
            <Text style={styles.cardStat}>▲ {formatCount(article.score)}</Text>
          )}
          {article.commentCount > 0 && (
            <Text style={styles.cardStat}>💬 {formatCount(article.commentCount)}</Text>
          )}
          <Text style={styles.cardStat}>{article.readingTime} min</Text>
        </View>
        <Pressable
          onPress={(e) => { e.stopPropagation?.(); onToggleBookmark(article.id); }}
          style={styles.bookmarkBtn}
          accessibilityRole="button"
          accessibilityLabel={isBookmarked ? "Remove bookmark" : "Add bookmark"}
          hitSlop={8}
        >
          <Text style={[styles.bookmarkIcon, isBookmarked && styles.bookmarkIconActive]}>
            {isBookmarked ? "★" : "☆"}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ── Category Filter ──
function CategoryFilter({
  active,
  onSelect,
  counts,
}: {
  active: HubCategory | null;
  onSelect: (cat: HubCategory | null) => void;
  counts: Record<string, number>;
}) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={[{ id: null as HubCategory | null, label: "All", count: total }, ...ALL_CATEGORIES.map((id) => ({
        id: id as HubCategory | null,
        label: getCategoryMeta(id).label,
        count: counts[id] ?? 0,
      }))].filter((c) => c.count > 0)}
      keyExtractor={(item) => item.id ?? "all"}
      contentContainerStyle={styles.categoryList}
      renderItem={({ item }) => (
        <Pressable
          style={[
            styles.categoryChip,
            active === item.id && styles.categoryChipActive,
          ]}
          onPress={() => onSelect(active === item.id ? null : item.id)}
          accessibilityRole="button"
          accessibilityState={{ selected: active === item.id }}
        >
          <Text
            style={[
              styles.categoryChipText,
              active === item.id && styles.categoryChipTextActive,
            ]}
          >
            {item.label}
          </Text>
          <View style={[styles.countBadge, active === item.id && styles.countBadgeActive]}>
            <Text style={[styles.countText, active === item.id && styles.countTextActive]}>
              {item.count}
            </Text>
          </View>
        </Pressable>
      )}
    />
  );
}

// ── Sort Mode ──
type SortMode = "for-you" | "latest" | "rising" | "popular";

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: "for-you", label: "For You" },
  { id: "latest", label: "Latest" },
  { id: "rising", label: "Rising" },
  { id: "popular", label: "Popular" },
];

function SortPicker({ value, onChange }: { value: SortMode; onChange: (v: SortMode) => void }) {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={SORT_OPTIONS}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.sortList}
      renderItem={({ item }) => (
        <Pressable
          style={[styles.sortChip, value === item.id && styles.sortChipActive]}
          onPress={() => onChange(item.id)}
          accessibilityRole="button"
          accessibilityState={{ selected: value === item.id }}
        >
          <Text style={[styles.sortChipText, value === item.id && styles.sortChipTextActive]}>
            {item.label}
          </Text>
        </Pressable>
      )}
    />
  );
}

// ── Main Screen ──
export default function HomeScreen() {
  const [nowMs] = useState(() => Date.now());
  const [activeCategory, setActiveCategory] = useState<HubCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("for-you");
  const listRef = useRef<FlatList>(null);
  const { bookmarks, toggle: toggleBookmark } = useBookmarks();

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of articles) {
      counts[a.category] = (counts[a.category] ?? 0) + 1;
    }
    return counts;
  }, []);

  const filteredArticles = useMemo(() => {
    let result = [...articles];

    if (activeCategory) {
      result = result.filter((a) => a.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort based on selected mode
    switch (sortMode) {
      case "for-you":
        return tulmekRank(result, nowMs, new Set(), {});
      case "latest":
        result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        return result;
      case "rising":
        result.sort((a, b) => {
          const ageA = Math.max(1, (nowMs - new Date(a.publishedAt).getTime()) / 3600000);
          const ageB = Math.max(1, (nowMs - new Date(b.publishedAt).getTime()) / 3600000);
          return (b.score + b.commentCount * 3) / ageB - (a.score + a.commentCount * 3) / ageA;
        });
        return result;
      case "popular":
        result.sort((a, b) => b.score - a.score);
        return result;
    }
  }, [activeCategory, searchQuery, sortMode, nowMs]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<FeedArticle>) => (
      <ArticleCard
        article={item}
        nowMs={nowMs}
        isBookmarked={bookmarks.has(item.id)}
        onToggleBookmark={toggleBookmark}
      />
    ),
    [nowMs, bookmarks, toggleBookmark]
  );

  const keyExtractor = useCallback((item: FeedArticle) => item.id, []);

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={filteredArticles}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Hero */}
            <View style={styles.hero}>
              <View style={styles.heroRow}>
                <Text style={styles.heroTitle}>Knowledge Hub</Text>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>Live</Text>
                </View>
              </View>
              <View style={styles.heroStatsRow}>
                <Text style={styles.heroStats}>
                  {totalArticles} articles · {sourceCount} sources
                </Text>
                {bookmarks.size > 0 && (
                  <Link href="/saved" style={styles.savedLink}>
                    <Text style={styles.savedLinkText}>★ {bookmarks.size} saved</Text>
                  </Link>
                )}
              </View>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search articles..."
                placeholderTextColor="#71717a"
                value={searchQuery}
                onChangeText={setSearchQuery}
                accessibilityLabel="Search articles"
              />
            </View>

            {/* Categories */}
            <CategoryFilter
              active={activeCategory}
              onSelect={setActiveCategory}
              counts={categoryCounts}
            />

            {/* Sort */}
            <SortPicker value={sortMode} onChange={setSortMode} />

            {/* Results count */}
            <Text style={styles.resultCount}>
              {filteredArticles.length} article{filteredArticles.length !== 1 ? "s" : ""}
              {activeCategory ? ` in ${getCategoryMeta(activeCategory).label}` : ""}
            </Text>
          </>
        }
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </View>
  );
}

// ── Styles ──
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  listContent: { paddingBottom: 32 },

  // Hero
  hero: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  heroRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroTitle: { fontSize: 22, fontWeight: "800", color: "#fafafa" },
  heroStatsRow: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, marginTop: 2 },
  heroStats: { fontSize: 13, color: "#71717a" },
  savedLink: { paddingVertical: 4, paddingHorizontal: 8 },
  savedLinkText: { fontSize: 13, color: "#3b82f6", fontWeight: "600" as const },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e" },
  liveText: { fontSize: 12, color: "#22c55e", fontWeight: "600" },

  // Search
  searchContainer: { paddingHorizontal: 16, paddingVertical: 8 },
  searchInput: {
    backgroundColor: "#18181b",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#fafafa",
    borderWidth: 1,
    borderColor: "#27272a",
  },

  // Category filter
  categoryList: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#18181b",
    minHeight: 44,
  },
  categoryChipActive: { backgroundColor: "#fafafa" },
  categoryChipText: { fontSize: 13, fontWeight: "600", color: "#a1a1aa" },
  categoryChipTextActive: { color: "#09090b" },
  countBadge: { backgroundColor: "#27272a", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  countBadgeActive: { backgroundColor: "#09090b20" },
  countText: { fontSize: 11, fontWeight: "700", color: "#71717a" },
  countTextActive: { color: "#09090b" },

  // Sort picker
  sortList: { paddingHorizontal: 12, paddingVertical: 4, gap: 6 },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#18181b",
    minHeight: 36,
    justifyContent: "center" as const,
  },
  sortChipActive: { backgroundColor: "#3b82f6" },
  sortChipText: { fontSize: 13, fontWeight: "600" as const, color: "#71717a" },
  sortChipTextActive: { color: "#ffffff" },

  // Results
  resultCount: { fontSize: 13, color: "#71717a", paddingHorizontal: 16, paddingBottom: 8 },

  // Card
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#18181b",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#27272a",
    borderLeftWidth: 3,
  },
  cardPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  categoryPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  categoryPillText: { fontSize: 11, fontWeight: "700" },
  cardSource: { fontSize: 12, fontWeight: "600" as const, color: "#a1a1aa" },
  cardTime: { fontSize: 12, color: "#71717a" },
  newBadge: { fontSize: 10, fontWeight: "700" as const, color: "#22c55e", backgroundColor: "#22c55e15", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, overflow: "hidden" as const },
  trendingBadge: { fontSize: 10, fontWeight: "700" as const, color: "#ef4444", backgroundColor: "#ef444415", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, overflow: "hidden" as const },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#fafafa", lineHeight: 22 },
  cardExcerpt: { fontSize: 13, color: "#71717a", marginTop: 6, lineHeight: 20 },
  cardFooter: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, marginTop: 10 },
  cardStats: { flexDirection: "row" as const, gap: 12 },
  cardStat: { fontSize: 12, color: "#71717a" },
  bookmarkBtn: { minWidth: 44, minHeight: 44, alignItems: "center" as const, justifyContent: "center" as const },
  bookmarkIcon: { fontSize: 20, color: "#71717a" },
  bookmarkIconActive: { color: "#3b82f6" },
});
