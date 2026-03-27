"use client";

import { useRef, useCallback } from "react";
import type { HubCategory } from "@tulmek/core/domain";
import { getAllCategories } from "./hub-utils";

interface CategoryNavProps {
  readonly activeCategory: HubCategory | null;
  readonly onCategoryChange: (category: HubCategory | null) => void;
  readonly categoryCounts: Record<string, number>;
}

export function CategoryNav({
  activeCategory,
  onCategoryChange,
  categoryCounts,
}: CategoryNavProps) {
  const categories = getAllCategories();
  const totalCount = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
  const navRef = useRef<HTMLDivElement>(null);

  // Roving tabindex — arrow key navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

    const buttons = navRef.current?.querySelectorAll<HTMLButtonElement>("button");
    if (!buttons) return;

    const current = document.activeElement as HTMLButtonElement;
    const items = Array.from(buttons);
    const idx = items.indexOf(current);
    if (idx === -1) return;

    e.preventDefault();
    const next = e.key === "ArrowRight"
      ? items[(idx + 1) % items.length]
      : items[(idx - 1 + items.length) % items.length];
    next?.focus();
  }, []);

  const visibleCategories = categories.filter(({ id }) => (categoryCounts[id] ?? 0) > 0);

  return (
    <nav aria-label="Content categories" className="category-scroll overflow-x-auto">
      <div
        ref={navRef}
        className="flex gap-2 px-1 pb-1"
        role="toolbar"
        aria-label="Filter by category"
        onKeyDown={handleKeyDown}
      >
        {/* All */}
        <CategoryButton
          label="All"
          count={totalCount}
          isActive={activeCategory === null}
          onClick={() => onCategoryChange(null)}
          tabIndex={activeCategory === null ? 0 : -1}
        />

        {/* Category buttons */}
        {visibleCategories.map(({ id, config }) => (
          <CategoryButton
            key={id}
            label={config.label}
            count={categoryCounts[id] ?? 0}
            isActive={activeCategory === id}
            onClick={() => onCategoryChange(activeCategory === id ? null : id)}
            tabIndex={activeCategory === id ? 0 : -1}
          />
        ))}
      </div>
    </nav>
  );
}

function CategoryButton({
  label,
  count,
  isActive,
  onClick,
  tabIndex,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  tabIndex: number;
}) {
  return (
    <button
      onClick={onClick}
      tabIndex={tabIndex}
      className={`flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors sm:px-4 ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
      aria-pressed={isActive}
    >
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-xs ${
          isActive
            ? "bg-primary-foreground/20 text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
