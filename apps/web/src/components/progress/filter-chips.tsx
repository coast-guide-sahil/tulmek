"use client";

import type { FacetCount } from "@tulmek/core/domain";

interface FilterChipsProps {
  readonly label: string;
  readonly facets: readonly FacetCount[];
  readonly selected: string[];
  readonly onChange: (selected: string[]) => void;
  readonly limit?: number;
}

export function FilterChips({
  label,
  facets,
  selected,
  onChange,
  limit = 10,
}: FilterChipsProps) {
  if (facets.length === 0) return null;

  const visible = facets.slice(0, limit);

  const toggleValue = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {visible.map(({ value, count }) => {
          const isActive = selected.includes(value);
          return (
            <button
              key={value}
              onClick={() => toggleValue(value)}
              className={`inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={isActive}
            >
              {value}
              <span
                className={`text-[10px] ${isActive ? "opacity-70" : "opacity-50"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface StatusFilterProps {
  readonly value: "all" | "completed" | "remaining";
  readonly onChange: (value: "all" | "completed" | "remaining") => void;
  readonly completedCount: number;
  readonly totalCount: number;
}

export function StatusFilter({
  value,
  onChange,
  completedCount,
  totalCount,
}: StatusFilterProps) {
  const options = [
    { key: "all" as const, label: "All", count: totalCount },
    { key: "completed" as const, label: "Done", count: completedCount },
    {
      key: "remaining" as const,
      label: "Remaining",
      count: totalCount - completedCount,
    },
  ];

  return (
    <div className="flex rounded-lg bg-muted p-0.5" role="radiogroup" aria-label="Filter by status">
      {options.map(({ key, label, count }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`inline-flex min-h-[32px] items-center gap-1 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
            value === key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          role="radio"
          aria-checked={value === key}
        >
          {label}
          <span className="opacity-50">{count}</span>
        </button>
      ))}
    </div>
  );
}
