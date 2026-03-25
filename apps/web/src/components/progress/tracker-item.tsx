"use client";

import { useState, useCallback } from "react";
import { useProgress, useProgressActions } from "@/lib/progress/provider";
import type { CategorizedItem } from "@tulmek/core/domain";
import { NoteEditor } from "./note-editor";

interface TrackerItemProps {
  readonly item: CategorizedItem;
  readonly isSelecting?: boolean;
  readonly isSelected?: boolean;
  readonly onToggleSelect?: (slug: string) => void;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  medium:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  hard: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  beginner:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  intermediate:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  advanced:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function TrackerItem({ item, isSelecting, isSelected, onToggleSelect }: TrackerItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const completed = useProgress((s) => s.progress[item.slug]?.completed ?? false);
  const hasNote = useProgress((s) => s.noteSlugs.has(item.slug));
  const { toggle } = useProgressActions();

  const handleToggle = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
      toggle(item.slug);
    },
    [toggle, item.slug],
  );

  const topCompanies = item.companies.slice(0, 2);
  const moreCount = Math.max(0, item.companies.length - 2);

  return (
    <div role="listitem" className="border-b border-border last:border-b-0">
      {/* Main row */}
      <div
        className="flex min-h-[48px] cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/30 sm:px-5"
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
        aria-label={`${item.title}${completed ? " (completed)" : ""}`}
      >
        {/* Selection checkbox */}
        {isSelecting && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect?.(item.slug);
            }}
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center"
            role="checkbox"
            aria-checked={isSelected}
            aria-label={`Select ${item.title}`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                isSelected
                  ? "border-primary bg-primary"
                  : "border-border hover:border-primary"
              }`}
            >
              {isSelected && (
                <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
          </button>
        )}

        {/* Completion checkbox */}
        <button
          onClick={handleToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleToggle(e);
            }
          }}
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          role="checkbox"
          aria-checked={completed}
          aria-label={`Mark ${item.title} as ${completed ? "not completed" : "completed"}`}
        >
          <span
            className="flex h-5 w-5 items-center justify-center rounded border-2 transition-colors"
            style={{
              borderColor: completed
                ? "var(--success)"
                : "var(--border)",
              backgroundColor: completed
                ? "var(--success)"
                : "transparent",
            }}
          >
            {completed && (
              <svg
                className="h-3 w-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </span>
        </button>

        {/* Title */}
        <span
          className={`flex-1 text-sm font-medium transition-colors ${
            completed
              ? "text-muted-foreground line-through"
              : "text-card-foreground"
          }`}
        >
          {item.title}
        </span>

        {/* Note indicator */}
        {hasNote && (
          <span
            className="shrink-0 text-muted-foreground"
            title="Has notes"
            aria-label="Has notes"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </span>
        )}

        {/* Difficulty pill */}
        {item.difficulty && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_STYLES[item.difficulty] ?? "bg-muted text-muted-foreground"}`}
          >
            {item.difficulty}
          </span>
        )}

        {/* Companies */}
        <div className="hidden shrink-0 items-center gap-1 sm:flex">
          {topCompanies.map((c) => (
            <span
              key={c.name}
              className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground"
            >
              {c.name}
            </span>
          ))}
          {moreCount > 0 && (
            <span className="text-xs text-muted-foreground">
              +{moreCount}
            </span>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="border-t border-border bg-muted/20 px-4 py-4 sm:px-5">
          {/* External link */}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Open externally
            </a>
          )}

          {/* Tags */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* All companies */}
          {item.companies.length > 0 && (
            <div className="mb-4">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Companies
              </span>
              <div className="flex flex-wrap gap-1.5">
                {item.companies.map((c) => (
                  <span
                    key={c.name}
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                  >
                    {c.name}
                    {c.frequency > 0 && (
                      <span className="text-amber-500">
                        {"★".repeat(Math.min(c.frequency, 5))}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Note editor */}
          <NoteEditor slug={item.slug} />
        </div>
      )}
    </div>
  );
}
