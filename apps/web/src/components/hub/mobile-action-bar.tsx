"use client";

import type { HubCategory } from "@tulmek/core/domain";
import { getCategoryConfig } from "./hub-utils";

interface MobileActionBarProps {
  readonly activeCategory: HubCategory | null;
  readonly articleCount: number;
  readonly onClearFilters: () => void;
  readonly hasFilters: boolean;
}

/**
 * Fixed bottom bar on mobile showing active filter state.
 * Provides quick context and one-tap clear.
 * Hidden on desktop (>640px).
 */
export function MobileActionBar({
  activeCategory,
  articleCount,
  onClearFilters,
  hasFilters,
}: MobileActionBarProps) {
  if (!hasFilters) return null;

  const config = activeCategory ? getCategoryConfig(activeCategory) : null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-2 backdrop-blur-sm sm:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {config && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
              {config.label}
            </span>
          )}
          <span className="text-muted-foreground">
            {articleCount} result{articleCount !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          onClick={onClearFilters}
          className="min-h-[44px] rounded-lg px-3 text-sm font-medium text-primary"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
