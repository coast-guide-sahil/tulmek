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
import { getSourceLabel } from "./hub-utils";
import { tulmekRank } from "@/lib/hub/ranking";
import { TrendingTopics } from "./trending-topics";
import { CompanyPulse } from "./company-pulse";
import { AutoTopics } from "./auto-topics";
import { ContentTypeFilter, type ContentType } from "./content-type-filter";
import { ReadingTimeFilter, type ReadingDepth } from "./reading-time-filter";
import { CopyFeedLink } from "./copy-feed-link";

interface FeedLayoutProps {
  readonly articles: FeedArticle[];
  readonly initialCategory?: HubCategory;
}

type SortMode = "for-you" | "latest" | "popular" | "most-discussed";
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

const HUB_CATEGORIES: HubCategory[] = ["dsa", "system-design", "ai-ml", "behavioral", "interview-experience", "compensation", "career", "general"];
const SORT_MODES: SortMode[] = ["for-you", "latest", "popular", "most-discussed"];
const VIEW_MODES: ("grid" | "list")[] = ["grid", "list"];

export function FeedLayout({ articles }: FeedLayoutProps) {
  const [nowMs] = useState(() => Date.now());

  // URL-synced filter state (shareable links!)
  const [params, setParams] = useQueryStates({
    category: parseAsStringEnum<HubCategory>(HUB_CATEGORIES),
    q: parseAsString.withDefault(""),
    source: parseAsString,
    sort: parseAsStringEnum<SortMode>(SORT_MODES).withDefault("for-you"),
    view: parseAsStringEnum<"grid" | "list">(VIEW_MODES).withDefault("grid"),
  }, { shallow: true });

  const activeCategory = params.category;
  const searchQuery = params.q;
  const sourceFilter = params.source;
  const sortMode = params.sort;
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
  const setSortMode = useCallback(
    (sort: SortMode) => setParams({ sort }),
    [setParams]
  );
  const setLayout = useCallback(
    (view: "grid" | "list") => setParams({ view }),
    [setParams]
  );

  const [contentType, setContentType] = useState<ContentType>("all");
  const [readingDepth, setReadingDepth] = useState<ReadingDepth>("all");

  const hydrated = useHub((s) => s.hydrated);
  const readIds = useHub((s) => s.readIds);
  const bookmarks = useHub((s) => s.bookmarks);
  const searchResults = useHub((s) => s.searchResults);
  const { toggleBookmark, markAsRead, search: searchOrama } = useHubActions();

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

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of articles) {
      counts[a.category] = (counts[a.category] ?? 0) + 1;
    }
    return counts;
  }, [articles]);

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

  // Content type counts
  const contentTypeCounts = useMemo(() => ({
    all: articles.length,
    articles: articles.filter((a) => a.source !== "youtube" && a.readingTime >= 3).length,
    videos: articles.filter((a) => a.source === "youtube").length,
    discussions: articles.filter((a) => a.commentCount >= 10).length,
  }), [articles]);

  // Filter + sort
  const filteredArticles = useMemo(() => {
    let result = [...articles];

    // Category filter
    if (activeCategory) {
      result = result.filter((a) => a.category === activeCategory);
    }

    // Source filter
    if (sourceFilter) {
      result = result.filter((a) => a.source === sourceFilter);
    }

    // Reading depth filter
    if (readingDepth === "quick") {
      result = result.filter((a) => a.readingTime <= 3);
    } else if (readingDepth === "medium") {
      result = result.filter((a) => a.readingTime >= 4 && a.readingTime <= 8);
    } else if (readingDepth === "deep") {
      result = result.filter((a) => a.readingTime >= 9);
    }

    // Content type filter
    if (contentType === "videos") {
      result = result.filter((a) => a.source === "youtube");
    } else if (contentType === "discussions") {
      result = result.filter((a) => a.commentCount >= 10);
    } else if (contentType === "articles") {
      result = result.filter((a) => a.source !== "youtube" && a.readingTime >= 3);
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
  }, [articles, activeCategory, sourceFilter, contentType, readingDepth, debouncedQuery, sortMode, searchResults, nowMs, readIds, bookmarks]);

  const handleClearFilters = useCallback(() => {
    setParams({ category: null, source: null, q: null });
  }, [setParams]);

  const [visibleCount, setVisibleCount] = useState(24);

  const hasActiveFilters = activeCategory !== null || sourceFilter !== null || searchQuery.trim() !== "";
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
        />
        <div className="flex items-center gap-2">
          <CopyFeedLink />
          <ViewToggle layout={layout} onChange={setLayout} />
        </div>
      </div>

      {/* Category Navigation */}
      <CategoryNav
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        categoryCounts={categoryCounts}
      />

      {/* Dynamic Discovery — all auto-extracted from content */}
      {!hasActiveFilters && (
        <>
          <TrendingTopics articles={articles} onTopicClick={setSearchQuery} />
          <CompanyPulse articles={articles} onCompanyClick={setSearchQuery} />
          <AutoTopics articles={articles} onTopicClick={setSearchQuery} />
        </>
      )}

      {/* Content Type + Sort + Source Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <ContentTypeFilter value={contentType} onChange={setContentType} counts={contentTypeCounts} />
        <SortTabs value={sortMode} onChange={setSortMode} />
        <div className="ml-auto flex items-center gap-2">
          <ReadingTimeFilter value={readingDepth} onChange={setReadingDepth} />
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
            className={
              layout === "grid"
                ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                : "space-y-3"
            }
          >
            {visibleArticles.map((article) => (
              <ContentCard
                key={article.id}
                article={article}
                isBookmarked={article.id in bookmarks}
                onToggleBookmark={toggleBookmark}
                onArticleClick={markAsRead}
                layout={layout}
                isNew={nowMs - new Date(article.publishedAt).getTime() < SIX_HOURS_MS}
                isRead={readIds.has(article.id)}
              />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                className="min-h-[44px] rounded-lg border border-border bg-card px-6 text-sm font-medium text-card-foreground transition-colors hover:bg-muted"
              >
                Show more ({filteredArticles.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState onClear={handleClearFilters} />
      )}
    </div>
  );
}

// ── Sub-components ──

function SortTabs({ value, onChange }: { value: SortMode; onChange: (v: SortMode) => void }) {
  const tabs: { id: SortMode; label: string }[] = [
    { id: "for-you", label: "For You" },
    { id: "latest", label: "Latest" },
    { id: "popular", label: "Popular" },
    { id: "most-discussed", label: "Most Discussed" },
  ];

  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={`min-h-[44px] rounded-md px-3 text-xs font-medium transition-colors sm:text-sm ${
            value === tab.id
              ? "bg-card text-card-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
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

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
      <svg
        className="h-12 w-12 text-muted-foreground/40"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"
        />
      </svg>
      <p className="mt-3 text-sm font-medium text-muted-foreground">
        No articles match your filters
      </p>
      <button
        onClick={onClear}
        className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Clear all filters
      </button>
    </div>
  );
}
