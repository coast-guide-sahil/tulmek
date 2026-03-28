import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { FlashList, type FlashListRef, type ListRenderItemInfo } from "@shopify/flash-list";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  TextInput,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import type { ThemeColors } from "../../src/hooks/useThemeColors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link } from "expo-router";
import { APP_NAME, TRENDING_SCORE_THRESHOLD, NEW_ARTICLE_WINDOW_MS, STORAGE_KEYS } from "@tulmek/config/constants";
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
function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.hubBookmarks).then((raw) => {
      if (raw) setBookmarks(new Set(JSON.parse(raw) as string[]));
    });
  }, []);

  const toggle = useCallback((id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        next.add(id);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      AsyncStorage.setItem(STORAGE_KEYS.hubBookmarks, JSON.stringify([...next]));
      return next;
    });
  }, []);

  return { bookmarks, toggle };
}

// ── Prep Summary Hook (AsyncStorage) ──
interface PrepSummary {
  readCount: number;
  streakDays: number;
  topCategories: [string, number][];
}

function usePrepSummary(): PrepSummary {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.hubRead).then((raw) => {
      if (raw) setReadIds(new Set(JSON.parse(raw) as string[]));
    });
    AsyncStorage.getItem(STORAGE_KEYS.hubStreak).then((raw) => {
      if (raw) {
        try {
          setStreakDays((JSON.parse(raw) as { currentStreak: number }).currentStreak);
        } catch { /* ignore */ }
      }
    });
  }, []);

  const topCategories = useMemo((): [string, number][] => {
    if (readIds.size === 0) return [];
    const catBreakdown = new Map<string, number>();
    for (const a of articles) {
      if (readIds.has(a.id)) {
        catBreakdown.set(a.category, (catBreakdown.get(a.category) ?? 0) + 1);
      }
    }
    return [...catBreakdown.entries()].sort(([, a], [, b]) => b - a).slice(0, 3);
  }, [readIds]);

  return { readCount: readIds.size, streakDays, topCategories };
}

// ── Article Card ──
function ArticleCard({ article, nowMs, isBookmarked, onToggleBookmark, t }: {
  article: FeedArticle;
  nowMs: number;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  t: ThemeColors;
}) {
  const meta = getCategoryMeta(article.category);
  const color = getCategoryColor(article.category);
  const relTime = formatRelativeTime(article.publishedAt);
  const source = getSourceLabel(article.source);
  const isNew = nowMs - new Date(article.publishedAt).getTime() < NEW_ARTICLE_WINDOW_MS;
  const isTrending = article.score >= TRENDING_SCORE_THRESHOLD;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: t.card, borderColor: t.cardBorder, borderLeftColor: color },
        pressed && styles.cardPressed,
      ]}
      onPress={() => Linking.openURL(article.url)}
      accessibilityRole="link"
      accessibilityLabel={`${article.title} from ${source}`}
    >
      {/* Header: source + time + badges */}
      <View style={styles.cardHeader}>
        <View style={[styles.categoryPill, { backgroundColor: color + "20" }]}>
          <Text style={[styles.categoryPillText, { color }]}>{meta.label}</Text>
        </View>
        <Text style={[styles.cardSource, { color: t.textSecondary }]}>{source}</Text>
        {article.sentiment === "positive" && (
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#10b981" }} />
        )}
        {article.sentiment === "negative" && (
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#ef4444" }} />
        )}
        <Text style={[styles.cardTime, { color: t.textMuted }]}>{relTime}</Text>
        {isNew && <Text style={styles.newBadge}>NEW</Text>}
        {isTrending && <Text style={styles.trendingBadge}>TRENDING</Text>}
      </View>

      {/* Title */}
      <Text style={[styles.cardTitle, { color: t.text }]} numberOfLines={3}>
        {article.title}
      </Text>

      {/* Excerpt */}
      {article.excerpt !== article.title && (
        <Text style={[styles.cardExcerpt, { color: t.textMuted }]} numberOfLines={2}>
          {article.excerpt}
        </Text>
      )}

      {/* Topic pills */}
      {article.topics && article.topics.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
          {article.topics.slice(0, 3).map((topic: string) => (
            <View key={topic} style={{ backgroundColor: t.chipBg, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ fontSize: 10, color: t.textMuted }}>{topic}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer: stats + bookmark */}
      <View style={styles.cardFooter}>
        <View style={styles.cardStats}>
          {article.score > 0 && (
            <Text style={[styles.cardStat, { color: t.textMuted }]}>▲ {formatCount(article.score)}</Text>
          )}
          {article.commentCount > 0 && (
            <Text style={[styles.cardStat, { color: t.textMuted }]}>💬 {formatCount(article.commentCount)}</Text>
          )}
          <Text style={[styles.cardStat, { color: t.textMuted }]}>{article.readingTime} min</Text>
        </View>
        <Pressable
          onPress={(e) => { e.stopPropagation?.(); onToggleBookmark(article.id); }}
          style={styles.bookmarkBtn}
          accessibilityRole="button"
          accessibilityLabel={isBookmarked ? "Remove bookmark" : "Add bookmark"}
          hitSlop={8}
        >
          <Text style={[styles.bookmarkIcon, { color: t.textMuted }, isBookmarked && styles.bookmarkIconActive]}>
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
  t,
}: {
  active: HubCategory | null;
  onSelect: (cat: HubCategory | null) => void;
  counts: Record<string, number>;
  t: ThemeColors;
}) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <FlashList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={[{ id: null as HubCategory | null, label: "All", count: total }, ...ALL_CATEGORIES.map((id) => ({
        id: id as HubCategory | null,
        label: getCategoryMeta(id).label,
        count: counts[id] ?? 0,
      }))].filter((c) => c.count > 0)}
      keyExtractor={(item) => item.id ?? "all"}
      contentContainerStyle={styles.categoryList}
      renderItem={({ item }) => {
        const isActive = active === item.id;
        return (
          <Pressable
            style={[
              styles.categoryChip,
              { backgroundColor: isActive ? t.chipActiveBg : t.chipBg },
            ]}
            onPress={() => {
              void Haptics.selectionAsync();
              onSelect(isActive ? null : item.id);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.categoryChipText,
                { color: isActive ? t.chipActiveText : t.textSecondary },
              ]}
            >
              {item.label}
            </Text>
            <View style={[
              styles.countBadge,
              { backgroundColor: isActive ? t.chipActiveText + "20" : t.cardBorder },
            ]}>
              <Text style={[
                styles.countText,
                { color: isActive ? t.chipActiveText : t.textMuted },
              ]}>
                {item.count}
              </Text>
            </View>
          </Pressable>
        );
      }}
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

function SortPicker({ value, onChange, t }: { value: SortMode; onChange: (v: SortMode) => void; t: ThemeColors }) {
  return (
    <FlashList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={SORT_OPTIONS}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.sortList}
      renderItem={({ item }) => {
        const isActive = value === item.id;
        return (
          <Pressable
            style={[
              styles.sortChip,
              { backgroundColor: isActive ? t.primary : t.chipBg },
            ]}
            onPress={() => {
              void Haptics.selectionAsync();
              onChange(item.id);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.sortChipText, { color: isActive ? "#ffffff" : t.textMuted }]}>
              {item.label}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

// ── Difficulty Filter ──
type DifficultyLevel = "beginner" | "intermediate" | "advanced";

const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  beginner: "#10b981",
  intermediate: "#f59e0b",
  advanced: "#ef4444",
};

const DIFFICULTY_LEVELS: DifficultyLevel[] = ["beginner", "intermediate", "advanced"];

function DifficultyFilter({
  active,
  onSelect,
  t,
}: {
  active: DifficultyLevel | null;
  onSelect: (level: DifficultyLevel | null) => void;
  t: ThemeColors;
}) {
  return (
    <View style={styles.difficultyRow}>
      {DIFFICULTY_LEVELS.map((level) => {
        const isActive = active === level;
        const color = DIFFICULTY_COLORS[level];
        return (
          <Pressable
            key={level}
            onPress={() => {
              void Haptics.selectionAsync();
              onSelect(isActive ? null : level);
            }}
            style={[
              styles.difficultyChip,
              { backgroundColor: isActive ? color : t.chipBg },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`Filter by ${level} difficulty`}
          >
            <Text style={[styles.difficultyChipText, { color: isActive ? "#ffffff" : t.textSecondary }]}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Main Screen ──
export default function HomeScreen() {
  const [nowMs] = useState(() => Date.now());
  const [activeCategory, setActiveCategory] = useState<HubCategory | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyLevel | null>(null);
  const [actionableOnly, setActionableOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("for-you");
  const listRef = useRef<FlashListRef<FeedArticle>>(null);
  const { bookmarks, toggle: toggleBookmark } = useBookmarks();
  const { readCount, streakDays, topCategories } = usePrepSummary();
  const t = useThemeColors();

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

    if (difficultyFilter) {
      result = result.filter((a) => a.difficulty === difficultyFilter);
    }

    if (actionableOnly) {
      result = result.filter((a) => a.actionability >= 0.7);
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
  }, [activeCategory, difficultyFilter, actionableOnly, searchQuery, sortMode, nowMs]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<FeedArticle>) => (
      <ArticleCard
        article={item}
        nowMs={nowMs}
        isBookmarked={bookmarks.has(item.id)}
        onToggleBookmark={toggleBookmark}
        t={t}
      />
    ),
    [nowMs, bookmarks, toggleBookmark, t]
  );

  const keyExtractor = useCallback((item: FeedArticle) => item.id, []);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <FlashList
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
                <Text style={[styles.heroTitle, { color: t.text }]}>Knowledge Hub</Text>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>Live</Text>
                </View>
              </View>
              <View style={styles.heroStatsRow}>
                <Text style={[styles.heroStats, { color: t.textMuted }]}>
                  {totalArticles} articles · {sourceCount} sources
                </Text>
                <View style={styles.heroLinks}>
                  <Link href="/pulse" style={styles.savedLink}>
                    <Text style={[styles.savedLinkText, { color: t.primary }]}>Pulse</Text>
                  </Link>
                  {bookmarks.size > 0 && (
                    <Link href="/saved" style={styles.savedLink}>
                      <Text style={[styles.savedLinkText, { color: t.primary }]}>★ {bookmarks.size}</Text>
                    </Link>
                  )}
                </View>
              </View>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
              <TextInput
                style={[
                  styles.searchInput,
                  { backgroundColor: t.searchBg, color: t.text, borderColor: t.searchBorder },
                ]}
                placeholder="Search articles..."
                placeholderTextColor={t.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                accessibilityLabel="Search articles"
              />
            </View>

            {/* Weekly Prep Summary */}
            {readCount >= 3 && (
              <View style={[styles.summaryCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
                <Text style={[styles.summaryTitle, { color: t.text }]}>Your Prep Summary</Text>
                <View style={styles.summaryStats}>
                  <View style={styles.summaryStat}>
                    <Text style={[styles.summaryNumber, { color: t.text }]}>{readCount}</Text>
                    <Text style={[styles.summaryLabel, { color: t.textMuted }]}>read</Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={[styles.summaryNumber, { color: t.text }]}>{bookmarks.size}</Text>
                    <Text style={[styles.summaryLabel, { color: t.textMuted }]}>saved</Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={[styles.summaryNumber, { color: t.text }]}>{streakDays}d</Text>
                    <Text style={[styles.summaryLabel, { color: t.textMuted }]}>streak</Text>
                  </View>
                </View>
                {topCategories.length > 0 && (
                  <View style={[styles.summaryCategories, { borderTopColor: t.cardBorder }]}>
                    {topCategories.map(([cat, count]) => (
                      <View
                        key={cat}
                        style={[styles.summaryCategoryChip, { backgroundColor: getCategoryColor(cat) + "20" }]}
                      >
                        <Text style={[styles.summaryCategoryText, { color: getCategoryColor(cat) }]}>
                          {getCategoryMeta(cat).label} ({count})
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Categories */}
            <CategoryFilter
              active={activeCategory}
              onSelect={setActiveCategory}
              counts={categoryCounts}
              t={t}
            />

            {/* Difficulty */}
            <DifficultyFilter
              active={difficultyFilter}
              onSelect={setDifficultyFilter}
              t={t}
            />

            {/* Actionable filter */}
            <View style={styles.actionableRow}>
              <Pressable
                onPress={() => {
                  setActionableOnly(!actionableOnly);
                  void Haptics.selectionAsync();
                }}
                style={[
                  styles.actionableChip,
                  { backgroundColor: actionableOnly ? "#06b6d4" : t.chipBg },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: actionableOnly }}
                accessibilityLabel="Filter to actionable articles only"
              >
                <Text style={[
                  styles.actionableChipText,
                  { color: actionableOnly ? "#fff" : t.textMuted },
                ]}>
                  ⚡ Actionable
                </Text>
              </Pressable>
            </View>

            {/* Sort */}
            <SortPicker value={sortMode} onChange={setSortMode} t={t} />

            {/* Results count */}
            <Text style={[styles.resultCount, { color: t.textMuted }]}>
              {filteredArticles.length} article{filteredArticles.length !== 1 ? "s" : ""}
              {activeCategory ? ` in ${getCategoryMeta(activeCategory).label}` : ""}
            </Text>
          </>
        }
      />
    </View>
  );
}

// ── Styles ──
const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 32 },

  // Hero
  hero: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  heroRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroTitle: { fontSize: 22, fontWeight: "800" },
  heroStatsRow: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, marginTop: 2 },
  heroStats: { fontSize: 13 },
  heroLinks: { flexDirection: "row" as const, gap: 8 },
  savedLink: { paddingVertical: 4, paddingHorizontal: 8 },
  savedLinkText: { fontSize: 13, fontWeight: "600" as const },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e" },
  liveText: { fontSize: 12, color: "#22c55e", fontWeight: "600" },

  // Search
  searchContainer: { paddingHorizontal: 16, paddingVertical: 8 },
  searchInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
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
    minHeight: 44,
  },
  categoryChipText: { fontSize: 13, fontWeight: "600" },
  countBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  countText: { fontSize: 11, fontWeight: "700" },

  // Difficulty filter
  difficultyRow: {
    flexDirection: "row" as const,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  difficultyChip: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  difficultyChipText: { fontSize: 13, fontWeight: "600" as const },

  // Actionable filter
  actionableRow: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  actionableChip: {
    alignSelf: "flex-start" as const,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: "center" as const,
  },
  actionableChipText: { fontSize: 13, fontWeight: "600" as const },

  // Sort picker
  sortList: { paddingHorizontal: 12, paddingVertical: 4, gap: 6 },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 36,
    justifyContent: "center" as const,
  },
  sortChipText: { fontSize: 13, fontWeight: "600" as const },

  // Weekly Prep Summary
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  summaryTitle: { fontSize: 14, fontWeight: "700" as const, marginBottom: 12 },
  summaryStats: { flexDirection: "row" as const, justifyContent: "space-around" as const },
  summaryStat: { alignItems: "center" as const },
  summaryNumber: { fontSize: 24, fontWeight: "800" as const },
  summaryLabel: { fontSize: 12, marginTop: 2 },
  summaryCategories: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "transparent",
  },
  summaryCategoryChip: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  summaryCategoryText: { fontSize: 12, fontWeight: "600" as const },

  // Results
  resultCount: { fontSize: 13, paddingHorizontal: 16, paddingBottom: 8 },

  // Card
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  cardPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  categoryPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  categoryPillText: { fontSize: 11, fontWeight: "700" },
  cardSource: { fontSize: 12, fontWeight: "600" as const },
  cardTime: { fontSize: 12 },
  newBadge: { fontSize: 10, fontWeight: "700" as const, color: "#22c55e", backgroundColor: "#22c55e15", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, overflow: "hidden" as const },
  trendingBadge: { fontSize: 10, fontWeight: "700" as const, color: "#ef4444", backgroundColor: "#ef444415", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, overflow: "hidden" as const },
  cardTitle: { fontSize: 15, fontWeight: "700", lineHeight: 22 },
  cardExcerpt: { fontSize: 13, marginTop: 6, lineHeight: 20 },
  cardFooter: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, marginTop: 10 },
  cardStats: { flexDirection: "row" as const, gap: 12 },
  cardStat: { fontSize: 12 },
  bookmarkBtn: { minWidth: 44, minHeight: 44, alignItems: "center" as const, justifyContent: "center" as const },
  bookmarkIcon: { fontSize: 20 },
  bookmarkIconActive: { color: "#3b82f6" },
});
