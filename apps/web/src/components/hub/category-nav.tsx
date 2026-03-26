"use client";

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

  return (
    <nav aria-label="Content categories" className="category-scroll overflow-x-auto">
      <div className="flex gap-2 px-1 pb-1">
        {/* All */}
        <button
          onClick={() => onCategoryChange(null)}
          className={`flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors sm:px-4 ${
            activeCategory === null
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          aria-pressed={activeCategory === null}
        >
          All
          <span
            className={`rounded-full px-1.5 py-0.5 text-xs ${
              activeCategory === null
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {totalCount}
          </span>
        </button>

        {/* Category buttons */}
        {categories.map(({ id, config }) => {
          const count = categoryCounts[id] ?? 0;
          if (count === 0) return null;

          return (
            <button
              key={id}
              onClick={() =>
                onCategoryChange(activeCategory === id ? null : id)
              }
              className={`flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors sm:px-4 ${
                activeCategory === id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              aria-pressed={activeCategory === id}
            >
              {config.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs ${
                  activeCategory === id
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
