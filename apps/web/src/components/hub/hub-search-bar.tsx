"use client";

interface HubSearchBarProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly resultCount?: number;
  readonly totalCount: number;
}

export function HubSearchBar({
  value,
  onChange,
  resultCount,
  totalCount,
}: HubSearchBarProps) {
  return (
    <div className="relative flex-1">
      <svg
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search articles, topics, sources..."
        className="h-11 w-full rounded-lg border border-border bg-input pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
        aria-label="Search articles"
      />
      {resultCount !== undefined && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {resultCount}/{totalCount}
        </span>
      )}
    </div>
  );
}
