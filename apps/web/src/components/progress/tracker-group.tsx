"use client";

import { useState, type ReactNode } from "react";
import { useProgress } from "@/lib/progress/provider";

interface TrackerGroupProps {
  readonly title: string;
  readonly slugs: readonly string[];
  readonly defaultOpen?: boolean;
  readonly children: ReactNode;
}

export function TrackerGroup({
  title,
  slugs,
  defaultOpen = false,
  children,
}: TrackerGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const completedCount = useProgress((s) => s.countCompleted([...slugs]));
  const totalCount = slugs.length;
  const percentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 sm:px-5"
        aria-expanded={isOpen}
      >
        {/* Chevron */}
        <svg
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>

        {/* Group title */}
        <span className="flex-1 text-sm font-semibold text-card-foreground sm:text-base">
          {title}
        </span>

        {/* Count */}
        <span className="shrink-0 text-xs font-medium text-muted-foreground sm:text-sm">
          {completedCount}/{totalCount}
        </span>

        {/* Progress bar */}
        <div className="hidden w-24 sm:block">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-success transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
              role="progressbar"
              aria-valuenow={completedCount}
              aria-valuemin={0}
              aria-valuemax={totalCount}
              aria-label={`${completedCount} of ${totalCount} completed`}
            />
          </div>
        </div>
      </button>

      {/* Items */}
      {isOpen && (
        <div className="border-t border-border" role="list">
          {children}
        </div>
      )}
    </div>
  );
}
