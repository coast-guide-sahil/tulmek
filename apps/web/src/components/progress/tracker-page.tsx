"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { CategorizedItem, ContentCategory } from "@tulmek/core/domain";
import { useProgress, useSearchEngine } from "@/lib/progress/provider";
import { SearchBar } from "./search-bar";
import { FilterChips, StatusFilter } from "./filter-chips";
import { TrackerGroup } from "./tracker-group";
import { TrackerItem } from "./tracker-item";
import { BulkActions } from "./bulk-actions";

interface TrackerPageProps {
  readonly title: string;
  readonly category: ContentCategory;
  readonly items: readonly CategorizedItem[];
  /** Ordered list of group names to display */
  readonly groups: readonly string[];
  /** Display name for each group */
  readonly groupLabels: Record<string, string>;
  /** Available difficulty options */
  readonly difficulties: readonly string[];
}

export function TrackerPage({
  title,
  category: _category,
  items,
  groups,
  groupLabels,
  difficulties,
}: TrackerPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string[]>([]);
  const [companyFilter, setCompanyFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "completed" | "remaining"
  >("all");
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());

  const searchEngine = useSearchEngine();
  const [matchingSlugs, setMatchingSlugs] = useState<Set<string> | null>(null);

  const progress = useProgress((s) => s.progress);
  const hydrated = useProgress((s) => s.hydrated);

  const filteredItemsRef = useRef<readonly CategorizedItem[]>(items);

  const toggleSelect = useCallback((slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedSlugs(new Set(filteredItemsRef.current.map((i) => i.slug)));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSlugs(new Set());
  }, []);

  // Compute company facets
  const companyFacets = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      for (const c of item.companies) {
        map.set(c.name, (map.get(c.name) ?? 0) + 1);
      }
    }
    return [...map.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  // Difficulty facets
  const difficultyFacets = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      if (item.difficulty) {
        map.set(item.difficulty, (map.get(item.difficulty) ?? 0) + 1);
      }
    }
    return difficulties
      .map((d) => ({ value: d, count: map.get(d) ?? 0 }))
      .filter((f) => f.count > 0);
  }, [items, difficulties]);

  // Initialize search engine index
  const indexInitialized = useRef(false);
  useEffect(() => {
    if (!indexInitialized.current && items.length > 0) {
      searchEngine.index(items);
      indexInitialized.current = true;
    }
  }, [items, searchEngine]);

  // Run search query through SearchEngine port
  const prevQueryRef = useRef("");
  useEffect(() => {
    if (!searchQuery.trim()) {
      prevQueryRef.current = "";
      return;
    }
    let cancelled = false;
    prevQueryRef.current = searchQuery;
    searchEngine.search({ query: searchQuery }).then((result) => {
      if (!cancelled) {
        setMatchingSlugs(new Set(result.hits.map((h) => h.item.slug)));
      }
    });
    return () => { cancelled = true; };
  }, [searchQuery, searchEngine]);

  // Filter items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Full-text search via SearchEngine port (typo-tolerant, multi-field)
    if (searchQuery.trim() && matchingSlugs) {
      result = result.filter((item) => matchingSlugs.has(item.slug));
    }

    // Difficulty filter
    if (difficultyFilter.length > 0) {
      result = result.filter((i) => difficultyFilter.includes(i.difficulty));
    }

    // Company filter
    if (companyFilter.length > 0) {
      result = result.filter((i) =>
        i.companies.some((c) => companyFilter.includes(c.name)),
      );
    }

    // Status filter
    if (statusFilter === "completed") {
      result = result.filter((i) => progress[i.slug]?.completed);
    } else if (statusFilter === "remaining") {
      result = result.filter((i) => !progress[i.slug]?.completed);
    }

    return result;
  }, [items, searchQuery, matchingSlugs, difficultyFilter, companyFilter, statusFilter, progress]);

  // Keep ref in sync so selectAll uses current filtered list
  useEffect(() => {
    filteredItemsRef.current = filteredItems;
  }, [filteredItems]);

  // Group filtered items
  const groupedItems = useMemo(() => {
    const map = new Map<string, CategorizedItem[]>();
    for (const group of groups) {
      map.set(group, []);
    }
    for (const item of filteredItems) {
      const list = map.get(item.group);
      if (list) {
        list.push(item);
      }
    }
    return map;
  }, [filteredItems, groups]);

  // Counts
  const totalCount = items.length;
  const completedCount = useMemo(
    () => items.filter((i) => progress[i.slug]?.completed).length,
    [items, progress],
  );
  const filteredCount = filteredItems.length;
  const overallPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setDifficultyFilter([]);
    setCompanyFilter([]);
    setStatusFilter("all");
  }, []);

  const hasActiveFilters =
    searchQuery || difficultyFilter.length > 0 || companyFilter.length > 0 || statusFilter !== "all";

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-11 w-full animate-pulse rounded-lg bg-muted" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 w-full animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Screen reader announcement for filter result counts */}
      <div className="sr-only" aria-live="polite" role="status">
        {hasActiveFilters
          ? `Showing ${filteredCount} of ${totalCount} problems`
          : `${totalCount} problems`}
      </div>

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {completedCount} of {totalCount} completed ({overallPercentage}%)
          </p>
        </div>

        {/* Overall progress bar */}
        <div className="w-full sm:w-48">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-success transition-all duration-700 ease-out"
              style={{ width: `${overallPercentage}%` }}
              role="progressbar"
              aria-valuenow={completedCount}
              aria-valuemin={0}
              aria-valuemax={totalCount}
              aria-label={`Overall progress: ${completedCount} of ${totalCount} completed`}
            />
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      <BulkActions
        items={items}
        selectedSlugs={selectedSlugs}
        onToggleSelect={toggleSelect}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
        isSelecting={isSelecting}
        onToggleSelecting={() => {
          setIsSelecting(!isSelecting);
          if (isSelecting) setSelectedSlugs(new Set());
        }}
      />

      {/* Search */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        resultCount={hasActiveFilters ? filteredCount : undefined}
        totalCount={hasActiveFilters ? totalCount : undefined}
      />

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <StatusFilter
          value={statusFilter}
          onChange={setStatusFilter}
          completedCount={completedCount}
          totalCount={totalCount}
        />

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Difficulty chips */}
      {difficultyFacets.length > 1 && (
        <FilterChips
          label="Difficulty"
          facets={difficultyFacets}
          selected={difficultyFilter}
          onChange={setDifficultyFilter}
        />
      )}

      {/* Company chips */}
      <FilterChips
        label="Company"
        facets={companyFacets}
        selected={companyFilter}
        onChange={setCompanyFilter}
        limit={8}
      />

      {/* Grouped items */}
      <div className="space-y-3">
        {groups.map((group) => {
          const groupItems = groupedItems.get(group);
          if (!groupItems || groupItems.length === 0) return null;

          const allSlugs = items
            .filter((i) => i.group === group)
            .map((i) => i.slug);

          return (
            <TrackerGroup
              key={group}
              title={groupLabels[group] ?? group}
              slugs={allSlugs}
              defaultOpen={groupItems.some(
                (i) => progress[i.slug]?.completed,
              )}
            >
              {groupItems.map((item) => (
                <TrackerItem
                  key={item.slug}
                  item={item}
                  isSelecting={isSelecting}
                  isSelected={selectedSlugs.has(item.slug)}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </TrackerGroup>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              No items match your filters
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
