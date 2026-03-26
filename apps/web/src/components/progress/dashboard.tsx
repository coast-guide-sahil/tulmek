"use client";

import Link from "next/link";
import { useProgress } from "@/lib/progress/provider";
import type { CategorizedItem, ContentCategory } from "@tulmek/core/domain";

interface DashboardProps {
  readonly sections: readonly {
    readonly category: ContentCategory;
    readonly label: string;
    readonly href: string;
    readonly items: readonly CategorizedItem[];
    readonly description: string;
  }[];
}

export function Dashboard({ sections }: DashboardProps) {
  const progress = useProgress((s) => s.progress);
  const hydrated = useProgress((s) => s.hydrated);

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);
  const totalCompleted = sections.reduce(
    (sum, s) =>
      sum + s.items.filter((i) => progress[i.slug]?.completed).length,
    0,
  );
  const overallPercentage =
    totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Overall summary */}
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Progress Tracker
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your interview preparation across DSA, System Design, and
          Behavioral.
        </p>

        {/* Overall progress */}
        <div className="mt-4 rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Overall Progress
              </p>
              <p className="text-2xl font-bold text-card-foreground sm:text-3xl">
                {totalCompleted}
                <span className="text-base font-normal text-muted-foreground">
                  /{totalItems}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-card-foreground sm:text-4xl">
                {overallPercentage}%
              </p>
            </div>
          </div>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-success transition-all duration-700 ease-out"
              style={{ width: `${overallPercentage}%` }}
              role="progressbar"
              aria-valuenow={totalCompleted}
              aria-valuemin={0}
              aria-valuemax={totalItems}
              aria-label={`Overall progress: ${totalCompleted} of ${totalItems} completed`}
            />
          </div>
        </div>
      </div>

      {/* Section cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => {
          const completed = section.items.filter(
            (i) => progress[i.slug]?.completed,
          ).length;
          const total = section.items.length;
          const pct =
            total > 0 ? Math.round((completed / total) * 100) : 0;

          return (
            <Link
              key={section.category}
              href={section.href}
              className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm sm:p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-card-foreground group-hover:text-primary">
                    {section.label}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {section.description}
                  </p>
                </div>
                <span className="text-2xl font-bold text-card-foreground">
                  {pct}%
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {completed}/{total} completed
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-success transition-all duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={completed}
                    aria-valuemin={0}
                    aria-valuemax={total}
                    aria-label={`${section.label} progress: ${completed} of ${total} completed`}
                  />
                </div>
              </div>

              {/* Arrow */}
              <div className="mt-3 flex items-center text-sm font-medium text-muted-foreground group-hover:text-primary">
                Continue
                <svg
                  className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Storage info */}
      <p className="text-center text-xs text-muted-foreground">
        All progress is saved locally on this device. No account required.
      </p>
    </div>
  );
}
