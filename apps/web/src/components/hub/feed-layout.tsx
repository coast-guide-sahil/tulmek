"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQueryStates, parseAsString, parseAsStringEnum } from "nuqs";
import type { FeedArticle, HubCategory } from "@tulmek/core/domain";
import { useHub, useHubActions } from "@/lib/hub/provider";
import { ContentCard } from "./content-card";
import { CategoryNav } from "./category-nav";
import { HubSearchBar } from "./hub-search-bar";
import { ViewToggle } from "./view-toggle";
import { FeedSkeleton } from "./feed-skeleton";
import { getSourceLabel, getCategoryMeta } from "./hub-utils";
import { tulmekRank } from "@/lib/hub/ranking";
import { TrendingTopics } from "./trending-topics";
// AutoTopics removed per UX redesign — TrendingTopics is sufficient
// ContentTypeFilter removed — simplified per UX feedback
// ReadingTimeFilter removed — too many filter dimensions (QA feedback)
import { CompanyFilter, extractCompany } from "./company-filter";
import { CopyFeedLink } from "./copy-feed-link";
import { FocusSuggestion } from "./focus-suggestion";
import { FeedActions } from "./feed-actions";
import { useToast } from "./toast";
import { MobileActionBar } from "./mobile-action-bar";

interface FeedLayoutProps {
  readonly articles: FeedArticle[];
  readonly initialCategory?: HubCategory;
}

type SortMode = "for-you" | "latest" | "rising" | "popular" | "most-discussed";
type TimeRange = "today" | "week" | "month" | "all";
import { NEW_ARTICLE_WINDOW_MS, DISCOVERY_MIN_TOTAL_READS, DISCOVERY_MAX_CATEGORY_READS } from "@tulmek/config/constants";
const TIME_RANGE_MS: Record<TimeRange, number> = {
  today: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  all: Infinity,
};

const HUB_CATEGORIES: HubCategory[] = ["dsa", "system-design", "ai-ml", "behavioral", "interview-experience", "compensation", "career", "general"];
const SORT_MODES: SortMode[] = ["for-you", "latest", "rising", "popular", "most-discussed"];
const TIME_RANGES: TimeRange[] = ["today", "week", "month", "all"];
const VIEW_MODES: ("grid" | "list")[] = ["grid", "list"];

export function FeedLayout({ articles }: FeedLayoutProps) {
  const [nowMs] = useState(() => Date.now());

  // URL-synced filter state (shareable links!)
  const [params, setParams] = useQueryStates({
    category: parseAsStringEnum<HubCategory>(HUB_CATEGORIES),
    q: parseAsString.withDefault(""),
    source: parseAsString,
    sort: parseAsStringEnum<SortMode>(SORT_MODES).withDefault("for-you"),
    time: parseAsStringEnum<TimeRange>(TIME_RANGES).withDefault("all"),
    view: parseAsStringEnum<"grid" | "list">(VIEW_MODES).withDefault("grid"),
  }, { shallow: true });

  const activeCategory = params.category;
  const [activeCompany, setActiveCompany] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
  const [actionableOnly, setActionableOnly] = useState(false);
  const [sentimentFilter, setSentimentFilter] = useState<string | null>(null);
  const [readingTimeFilter, setReadingTimeFilter] = useState<"quick" | "deep" | null>(null);
  const searchQuery = params.q;
  const sourceFilter = params.source;
  const sortMode = params.sort;
  const timeRange = params.time;
  const layout = params.view;

  const setActiveCategory = useCallback(
    (cat: HubCategory | null) => setParams({ category: cat }),
    [setParams]
  );
  const setSearchQuery = useCallback(
    (q: string) => setParams({ q: q || null }),
    [setParams]
  );
  const setSourceFilter = useCallback(
    (source: string | null) => setParams({ source }),
    [setParams]
  );
  const setTimeRange = useCallback(
    (time: TimeRange) => setParams({ time: time === "all" ? null : time }),
    [setParams]
  );
  const setSortMode = useCallback(
    (sort: SortMode) => setParams({ sort }),
    [setParams]
  );
  const setLayout = useCallback(
    (view: "grid" | "list") => setParams({ view }),
    [setParams]
  );


  const hydrated = useHub((s) => s.hydrated);
  const readIds = useHub((s) => s.readIds);
  const bookmarks = useHub((s) => s.bookmarks);
  const dismissedIds = useHub((s) => s.dismissedIds);
  const mutedSources = useHub((s) => s.mutedSources);
  const mutedCategories = useHub((s) => s.mutedCategories);
  const searchResults = useHub((s) => s.searchResults);
  const { toggleBookmark, markAsRead, dismiss, search: searchOrama, recordEngagement, startDwellTimer, stopDwellTimer } = useHubActions();
  const showToast = useToast();

  // Stop dwell timer when user returns to the page
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") stopDwellTimer();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [stopDwellTimer]);

  const handleArticleClick = useCallback((articleId: string) => {
    markAsRead(articleId);
    // Find the article to get category/source for engagement tracking
    const article = articles.find((a) => a.id === articleId);
    if (article) {
      recordEngagement(article.category, article.source);
      startDwellTimer(articleId, article.category);
    }
  }, [markAsRead, recordEngagement, startDwellTimer, articles]);

  const handleBookmark = useCallback((articleId: string) => {
    const wasBookmarked = articleId in bookmarks;
    toggleBookmark(articleId);
    showToast(wasBookmarked ? "Removed from saved" : "Saved to reading list");
  }, [toggleBookmark, bookmarks, showToast]);

  // Default to list view on mobile if no explicit view param in URL
  const mobileDefaultApplied = useRef(false);
  useEffect(() => {
    if (!mobileDefaultApplied.current && typeof window !== "undefined") {
      mobileDefaultApplied.current = true;
      const urlHasView = new URLSearchParams(window.location.search).has("view");
      if (!urlHasView && window.innerWidth < 640) {
        setLayout("list");
      }
    }
  }, [setLayout]);

  // Debounce search query (250ms) and run through Orama for typo tolerance
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      if (searchQuery.trim()) {
        searchOrama({ query: searchQuery, category: activeCategory ?? undefined, source: sourceFilter ?? undefined });
      }
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, activeCategory, sourceFilter, searchOrama]);

  // Category counts — reflects all active non-category filters so tabs show
  // how many articles exist in each category given the current filter context.
  const categoryCounts = useMemo(() => {
    // Apply every filter except the category filter itself
    let base = articles.filter(
      (a) =>
        !dismissedIds.has(a.id) &&
        !mutedSources.has(a.source) &&
        !mutedCategories.has(a.category)
    );

    if (sourceFilter) {
      base = base.filter((a) => a.source === sourceFilter);
    }

    if (activeCompany) {
      const companyLower = activeCompany.toLowerCase();
      base = base.filter((a) => {
        const extracted = extractCompany(a.title);
        return extracted?.toLowerCase() === companyLower;
      });
    }

    if (difficultyFilter) {
      base = base.filter((a) => a.difficulty === difficultyFilter);
    }

    if (actionableOnly) {
      base = base.filter((a) => a.actionability >= 0.7);
    }

    if (sentimentFilter) {
      base = base.filter((a) => a.sentiment === sentimentFilter);
    }

    if (readingTimeFilter === "quick") base = base.filter((a) => a.readingTime <= 3);
    if (readingTimeFilter === "deep") base = base.filter((a) => a.readingTime >= 10);

    if (timeRange !== "all") {
      const cutoff = nowMs - TIME_RANGE_MS[timeRange];
      base = base.filter((a) => new Date(a.publishedAt).getTime() >= cutoff);
    }

    if (debouncedQuery.trim()) {
      if (searchResults && searchResults.hits.length > 0) {
        const matchIds = new Set(searchResults.hits.map((h) => h.article.id));
        base = base.filter((a) => matchIds.has(a.id));
      } else {
        const q = debouncedQuery.toLowerCase();
        base = base.filter(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            a.excerpt.toLowerCase().includes(q) ||
            a.tags.some((t) => t.toLowerCase().includes(q)) ||
            a.sourceName.toLowerCase().includes(q)
        );
      }
    }

    const counts: Record<string, number> = {};
    for (const a of base) {
      counts[a.category] = (counts[a.category] ?? 0) + 1;
    }
    return counts;
  }, [articles, dismissedIds, mutedSources, mutedCategories, sourceFilter, activeCompany, difficultyFilter, actionableOnly, sentimentFilter, readingTimeFilter, timeRange, debouncedQuery, searchResults, nowMs]);

  // Per-category read counts (for progress indicators)
  const categoryReadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of articles) {
      if (readIds.has(a.id)) {
        counts[a.category] = (counts[a.category] ?? 0) + 1;
      }
    }
    return counts;
  }, [articles, readIds]);

  // Discovery categories — categories the user hasn't explored much yet
  // Shown only once the user has a reading baseline (>= DISCOVERY_MIN_TOTAL_READS total)
  const discoveryCategories = useMemo(() => {
    const totalReads = readIds.size;
    if (totalReads < DISCOVERY_MIN_TOTAL_READS) return new Set<string>();
    const result = new Set<string>();
    for (const a of articles) {
      if (!result.has(a.category) && (categoryReadCounts[a.category] ?? 0) < DISCOVERY_MAX_CATEGORY_READS) {
        result.add(a.category);
      }
    }
    return result;
  }, [articles, readIds, categoryReadCounts]);

  // Source counts
  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of articles) {
      counts[a.source] = (counts[a.source] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([source, count]) => ({ source, label: getSourceLabel(source), count }))
      .sort((a, b) => b.count - a.count);
  }, [articles]);

  // Filter + sort
  const filteredArticles = useMemo(() => {
    // Remove dismissed articles first
    let result = articles.filter((a) =>
      !dismissedIds.has(a.id) &&
      !mutedSources.has(a.source) &&
      !mutedCategories.has(a.category)
    );

    // Category filter
    if (activeCategory) {
      result = result.filter((a) => a.category === activeCategory);
    }

    // Source filter
    if (sourceFilter) {
      result = result.filter((a) => a.source === sourceFilter);
    }

    // Company filter
    if (activeCompany) {
      const companyLower = activeCompany.toLowerCase();
      result = result.filter((a) => {
        const extracted = extractCompany(a.title);
        return extracted?.toLowerCase() === companyLower;
      });
    }

    // Difficulty filter
    if (difficultyFilter) {
      result = result.filter((a) => a.difficulty === difficultyFilter);
    }

    // Actionable filter
    if (actionableOnly) {
      result = result.filter((a) => a.actionability >= 0.7);
    }

    // Sentiment filter
    if (sentimentFilter) {
      result = result.filter((a) => a.sentiment === sentimentFilter);
    }

    // Reading time filter
    if (readingTimeFilter === "quick") result = result.filter((a) => a.readingTime <= 3);
    if (readingTimeFilter === "deep") result = result.filter((a) => a.readingTime >= 10);

    // Time range filter
    if (timeRange !== "all") {
      const cutoff = nowMs - TIME_RANGE_MS[timeRange];
      result = result.filter((a) => new Date(a.publishedAt).getTime() >= cutoff);
    }

    // Search filter — use Orama results (typo-tolerant) when available, fallback to inline
    if (debouncedQuery.trim()) {
      if (searchResults && searchResults.hits.length > 0) {
        const matchIds = new Set(searchResults.hits.map((h) => h.article.id));
        result = result.filter((a) => matchIds.has(a.id));
      } else {
        const q = debouncedQuery.toLowerCase();
        result = result.filter(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            a.excerpt.toLowerCase().includes(q) ||
            a.tags.some((t) => t.toLowerCase().includes(q)) ||
            a.sourceName.toLowerCase().includes(q)
        );
      }
    }

    // Sort — TCRA for "For You", standard for others
    switch (sortMode) {
      case "for-you":
        // TULMEK Core Ranking Algorithm: multi-signal, personalized, diversity-aware
        result = tulmekRank(result, nowMs, readIds, bookmarks);
        break;
      case "rising":
        // Velocity: engagement per hour of age — catches trending early
        result.sort((a, b) => {
          const ageA = Math.max(1, (nowMs - new Date(a.publishedAt).getTime()) / 3600000);
          const ageB = Math.max(1, (nowMs - new Date(b.publishedAt).getTime()) / 3600000);
          const velA = (a.score + a.commentCount * 3) / ageA;
          const velB = (b.score + b.commentCount * 3) / ageB;
          return velB - velA;
        });
        break;
      case "popular":
        result.sort((a, b) => b.score - a.score);
        break;
      case "latest":
        result.sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
        break;
      case "most-discussed":
        result.sort((a, b) => b.commentCount - a.commentCount);
        break;
    }

    return result;
  }, [articles, dismissedIds, mutedSources, mutedCategories, activeCategory, activeCompany, difficultyFilter, actionableOnly, sentimentFilter, readingTimeFilter, sourceFilter, timeRange, debouncedQuery, sortMode, searchResults, nowMs, readIds, bookmarks]);

  const handleClearFilters = useCallback(() => {
    setParams({ category: null, source: null, q: null, time: null });
    setActiveCompany(null);
    setDifficultyFilter(null);
    setActionableOnly(false);
    setSentimentFilter(null);
    setReadingTimeFilter(null);
  }, [setParams]);

  const [visibleCount, setVisibleCount] = useState(24);

  const hasActiveFilters = activeCategory !== null || activeCompany !== null || difficultyFilter !== null || actionableOnly || sentimentFilter !== null || readingTimeFilter !== null || sourceFilter !== null || timeRange !== "all" || searchQuery.trim() !== "";
  const visibleArticles = filteredArticles.slice(0, visibleCount);
  const hasMore = visibleCount < filteredArticles.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + 24);
  }, []);

  if (!hydrated) {
    return <FeedSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search + View Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <HubSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          resultCount={hasActiveFilters ? filteredArticles.length : undefined}
          totalCount={articles.length}
          articles={articles}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const unread = filteredArticles.filter(a => !readIds.has(a.id));
              if (unread.length === 0) return;
              const random = unread[Math.floor(Math.random() * unread.length)]!;
              window.open(random.url, "_blank", "noopener,noreferrer");
              markAsRead(random.id);
            }}
            className="min-h-[44px] inline-flex items-center gap-1 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            title="Open a random unread article"
          >
            🎲 Surprise Me
          </button>
          <CopyFeedLink />
          <ViewToggle layout={layout} onChange={setLayout} />
        </div>
      </div>

      {/* Focus Suggestion */}
      <FocusSuggestion onCategoryClick={setActiveCategory} />

      {/* Category Navigation */}
      <CategoryNav
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        categoryCounts={categoryCounts}
        readCounts={categoryReadCounts}
      />

      {/* Trending Topics — hidden on mobile to reduce vertical sprawl */}
      {!hasActiveFilters && (
        <div className="hidden sm:block">
          <TrendingTopics articles={articles} onTopicClick={setSearchQuery} />
        </div>
      )}

      {/* Sort + Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <SortTabs value={sortMode} onChange={setSortMode} />
        <div className="ml-auto flex items-center gap-2">
          <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
          {sourceCounts.length > 1 && (
            <SourceFilter
              sources={sourceCounts}
              active={sourceFilter}
              onChange={setSourceFilter}
            />
          )}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Difficulty filter + Actionable toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Level:</span>
        {(["beginner", "intermediate", "advanced"] as const).map(level => (
          <button
            key={level}
            onClick={() => setDifficultyFilter(difficultyFilter === level ? null : level)}
            className={`min-h-[44px] rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              difficultyFilter === level
                ? level === "beginner" ? "bg-emerald-500 text-white"
                : level === "intermediate" ? "bg-amber-500 text-white"
                : "bg-red-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-primary/10"
            }`}
          >
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
        <button
          onClick={() => setActionableOnly(!actionableOnly)}
          className={`min-h-[44px] rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            actionableOnly
              ? "bg-cyan-500 text-white"
              : "bg-muted text-muted-foreground hover:bg-primary/10"
          }`}
        >
          ⚡ Actionable
        </button>
        <button
          onClick={() => setSentimentFilter(sentimentFilter === "positive" ? null : "positive")}
          className={`min-h-[44px] rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            sentimentFilter === "positive" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground hover:bg-primary/10"
          }`}
        >
          😊 Positive
        </button>
        <button
          onClick={() => setSentimentFilter(sentimentFilter === "negative" ? null : "negative")}
          className={`min-h-[44px] rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            sentimentFilter === "negative" ? "bg-red-500 text-white" : "bg-muted text-muted-foreground hover:bg-primary/10"
          }`}
        >
          😟 Negative
        </button>
        <button
          onClick={() => setReadingTimeFilter(readingTimeFilter === "quick" ? null : "quick")}
          className={`min-h-[44px] rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            readingTimeFilter === "quick" ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground hover:bg-primary/10"
          }`}
        >
          ⚡ Quick
        </button>
        <button
          onClick={() => setReadingTimeFilter(readingTimeFilter === "deep" ? null : "deep")}
          className={`min-h-[44px] rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            readingTimeFilter === "deep" ? "bg-violet-500 text-white" : "bg-muted text-muted-foreground hover:bg-primary/10"
          }`}
        >
          📖 Deep Dive
        </button>
      </div>

      {/* Company filter — auto-extracted from article titles */}
      <CompanyFilter
        articles={articles}
        activeCompany={activeCompany}
        onCompanyClick={setActiveCompany}
      />

      {/* Screen reader announcement for filter results */}
      <div className="sr-only" aria-live="polite" role="status">
        {hasActiveFilters
          ? `Showing ${filteredArticles.length} of ${articles.length} articles`
          : `${articles.length} articles`}
      </div>

      {/* Results count */}
      {hasActiveFilters && (
        <p className="text-sm text-muted-foreground">
          {filteredArticles.length} result{filteredArticles.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Feed */}
      {filteredArticles.length > 0 ? (
        <>
          <div
            key={`${activeCategory}-${sourceFilter}-${sortMode}`}
            className={`section-enter ${
              layout === "grid"
                ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                : "space-y-3"
            }`}
          >
            {visibleArticles.map((article) => (
              <ContentCard
                key={article.id}
                article={article}
                isBookmarked={article.id in bookmarks}
                onToggleBookmark={handleBookmark}
                onArticleClick={handleArticleClick}
                onDismiss={dismiss}
                layout={layout}
                isNew={nowMs - new Date(article.publishedAt).getTime() < NEW_ARTICLE_WINDOW_MS}
                isRead={readIds.has(article.id)}
                isDiscovery={discoveryCategories.has(article.category)}
              />
            ))}
          </div>

          {/* Infinite scroll trigger */}
          {hasMore && <InfiniteScrollTrigger onVisible={handleLoadMore} />}

          {/* Feed actions */}
          <div className="flex items-center justify-center pt-4">
            <FeedActions visibleArticles={visibleArticles} />
          </div>
        </>
      ) : (
        <EmptyState onClear={handleClearFilters} activeCategory={activeCategory} />
      )}

      {/* Mobile filter bar */}
      <MobileActionBar
        activeCategory={activeCategory}
        articleCount={filteredArticles.length}
        onClearFilters={handleClearFilters}
        hasFilters={hasActiveFilters}
      />
    </div>
  );
}

// ── Sub-components ──

function SortTabs({ value, onChange }: { value: SortMode; onChange: (v: SortMode) => void }) {
  const tabs: { id: SortMode; label: string; desc: string }[] = [
    { id: "for-you", label: "For You", desc: "Personalized" },
    { id: "latest", label: "Latest", desc: "Newest first" },
    { id: "rising", label: "Rising", desc: "Heating up" },
    { id: "popular", label: "Popular", desc: "Most upvoted" },
    { id: "most-discussed", label: "Discussed", desc: "Most comments" },
  ];

  return (
    <div className="category-scroll flex gap-1 overflow-x-auto rounded-lg bg-muted p-1" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex min-h-[44px] shrink-0 flex-col items-center justify-center rounded-md px-3 transition-colors ${
            value === tab.id
              ? "bg-card text-card-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title={tab.desc}
        >
          <span className="text-xs font-medium sm:text-sm">{tab.label}</span>
          <span className={`text-[10px] leading-tight ${
            value === tab.id ? "text-muted-foreground" : "text-muted-foreground"
          }`}>
            {tab.desc}
          </span>
        </button>
      ))}
    </div>
  );
}

function SourceFilter({
  sources,
  active,
  onChange,
}: {
  sources: { source: string; label: string; count: number }[];
  active: string | null;
  onChange: (source: string | null) => void;
}) {
  return (
    <select
      value={active ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="h-11 rounded-lg border border-border bg-card px-2 text-xs text-card-foreground sm:text-sm"
      aria-label="Filter by source"
    >
      <option value="">All sources</option>
      {sources.map((s) => (
        <option key={s.source} value={s.source}>
          {s.label} ({s.count})
        </option>
      ))}
    </select>
  );
}

function TimeRangeFilter({ value, onChange }: { value: TimeRange; onChange: (v: TimeRange) => void }) {
  const options: { id: TimeRange; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "week", label: "This week" },
    { id: "month", label: "This month" },
    { id: "all", label: "All time" },
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TimeRange)}
      className="h-11 rounded-lg border border-border bg-card px-2 text-xs text-card-foreground sm:text-sm"
      aria-label="Filter by time range"
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>{o.label}</option>
      ))}
    </select>
  );
}

function EmptyState({ onClear, activeCategory }: { onClear: () => void; activeCategory: HubCategory | null }) {
  return (
    <div className="section-enter flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
      <div className="mb-4 text-4xl">🔍</div>
      <h3 className="text-lg font-bold text-foreground mb-2">No articles match your filters</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4">
        Try adjusting your filters or search query.
        {activeCategory && ` The "${getCategoryMeta(activeCategory).label}" category may have fewer articles with these filters.`}
      </p>
      <button
        onClick={onClear}
        className="min-h-[44px] rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Clear all filters
      </button>
    </div>
  );
}

function InfiniteScrollTrigger({ onVisible }: { onVisible: () => void }) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) onVisible(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onVisible]);

  return (
    <div ref={triggerRef} className="flex justify-center py-4">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  );
}
