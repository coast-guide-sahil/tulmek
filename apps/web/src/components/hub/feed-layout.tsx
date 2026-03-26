"use client";

import { useState, useMemo, useCallback } from "react";
import type { FeedArticle, HubCategory } from "@tulmek/core/domain";
import { useHub, useHubActions } from "@/lib/hub/provider";
import { ContentCard } from "./content-card";
import { CategoryNav } from "./category-nav";
import { HubSearchBar } from "./hub-search-bar";
import { ViewToggle } from "./view-toggle";
import { FeedSkeleton } from "./feed-skeleton";
import { getSourceLabel } from "./hub-utils";

interface FeedLayoutProps {
  readonly articles: FeedArticle[];
  readonly initialCategory?: HubCategory;
}

type SortMode = "trending" | "latest" | "most-discussed";
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export function FeedLayout({ articles, initialCategory }: FeedLayoutProps) {
  const [nowMs] = useState(() => Date.now());
  const [activeCategory, setActiveCategory] = useState<HubCategory | null>(
    initialCategory ?? null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("trending");
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  const hydrated = useHub((s) => s.hydrated);
  const readIds = useHub((s) => s.readIds);
  const { toggleBookmark, markAsRead } = useHubActions();

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

    // Search filter (simple client-side for immediate feedback)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)) ||
          a.sourceName.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortMode) {
      case "trending":
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
  }, [articles, activeCategory, sourceFilter, searchQuery, sortMode]);

  const handleClearFilters = useCallback(() => {
    setActiveCategory(null);
    setSourceFilter(null);
    setSearchQuery("");
  }, []);

  const hasActiveFilters = activeCategory !== null || sourceFilter !== null || searchQuery.trim() !== "";

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
          <ViewToggle layout={layout} onChange={setLayout} />
        </div>
      </div>

      {/* Category Navigation */}
      <CategoryNav
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        categoryCounts={categoryCounts}
      />

      {/* Sort + Source Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <SortTabs value={sortMode} onChange={setSortMode} />
        <div className="ml-auto flex items-center gap-2">
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

      {/* Results count */}
      {hasActiveFilters && (
        <p className="text-sm text-muted-foreground">
          {filteredArticles.length} result{filteredArticles.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Feed */}
      {filteredArticles.length > 0 ? (
        <div
          className={
            layout === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-3"
          }
        >
          {filteredArticles.map((article) => (
            <ContentCard
              key={article.id}
              article={article}
              onToggleBookmark={toggleBookmark}
              onArticleClick={markAsRead}
              layout={layout}
              isNew={nowMs - new Date(article.publishedAt).getTime() < SIX_HOURS_MS}
              isRead={readIds.has(article.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState onClear={handleClearFilters} />
      )}
    </div>
  );
}

// ── Sub-components ──

function SortTabs({ value, onChange }: { value: SortMode; onChange: (v: SortMode) => void }) {
  const tabs: { id: SortMode; label: string }[] = [
    { id: "trending", label: "Trending" },
    { id: "latest", label: "Latest" },
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
          className={`min-h-[36px] rounded-md px-3 text-xs font-medium transition-colors sm:text-sm ${
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
      className="h-9 rounded-lg border border-border bg-card px-2 text-xs text-card-foreground sm:text-sm"
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
