"use client";

import { useRef, useEffect, useSyncExternalStore } from "react";

interface SearchBarProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly resultCount?: number;
  readonly totalCount?: number;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search problems...",
  resultCount,
  totalCount,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isMac = useSyncExternalStore(
    () => () => {},
    () => navigator.platform?.toUpperCase().includes("MAC") ?? false,
    () => false,
  );

  // Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
        onChange("");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onChange]);

  return (
    <div className="relative">
      {/* Search icon */}
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>

      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-border bg-input pl-9 pr-20 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:h-11"
        aria-label="Search"
      />

      {/* Keyboard shortcut hint + count */}
      <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
        {resultCount !== undefined && totalCount !== undefined && (
          <span className="text-xs text-muted-foreground">
            {resultCount}/{totalCount}
          </span>
        )}
        {!value && (
          <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
            {isMac ? "⌘K" : "Ctrl+K"}
          </kbd>
        )}
      </div>
    </div>
  );
}
