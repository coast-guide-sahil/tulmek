"use client";

type ReadingDepth = "all" | "quick" | "medium" | "deep";

interface ReadingTimeFilterProps {
  readonly value: ReadingDepth;
  readonly onChange: (v: ReadingDepth) => void;
}

const DEPTHS: { id: ReadingDepth; label: string }[] = [
  { id: "all", label: "Any length" },
  { id: "quick", label: "Quick (1-3 min)" },
  { id: "medium", label: "Medium (4-8 min)" },
  { id: "deep", label: "Deep (9+ min)" },
];

export function ReadingTimeFilter({ value, onChange }: ReadingTimeFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ReadingDepth)}
      className="h-11 rounded-lg border border-border bg-card px-2 text-xs text-card-foreground sm:text-sm"
      aria-label="Filter by reading time"
    >
      {DEPTHS.map((d) => (
        <option key={d.id} value={d.id}>
          {d.label}
        </option>
      ))}
    </select>
  );
}

export type { ReadingDepth };
