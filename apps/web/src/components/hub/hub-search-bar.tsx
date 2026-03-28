"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import type { FeedArticle } from "@tulmek/core/domain";
import { getTrendingTopics } from "@tulmek/core/domain";

interface HubSearchBarProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly resultCount?: number;
  readonly totalCount: number;
  readonly articles?: FeedArticle[];
}

export function HubSearchBar({
  value,
  onChange,
  resultCount,
  totalCount,
  articles = [],
}: HubSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Press "/" or Ctrl+K to focus search, Escape to clear and blur
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // "/" without modifiers (standard aggregator shortcut)
      if (
        e.key === "/" &&
        !e.ctrlKey &&
        !e.metaKey &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Ctrl+K or Cmd+K (VS Code / Notion / Linear standard)
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        onChange("");
        setShowSuggestions(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onChange]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSuggestionSelect = (query: string) => {
    onChange(query);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={containerRef} className="relative flex-1">
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
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => { if (!value.trim()) setShowSuggestions(true); }}
        onInput={(e) => {
          const q = (e.target as HTMLInputElement).value;
          setShowSuggestions(!q.trim());
        }}
        placeholder="Search articles, topics, sources..."
        className="h-11 w-full rounded-lg border border-border bg-input pl-10 pr-16 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
        aria-label="Search articles (press / or Ctrl+K to focus)"
      />
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
        {resultCount !== undefined ? (
          <span className="text-xs text-muted-foreground">
            {resultCount}/{totalCount}
          </span>
        ) : (
          <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground sm:inline-block">
            /
          </kbd>
        )}
      </div>
      <SearchSuggestions
        articles={articles}
        onSelect={handleSuggestionSelect}
        visible={showSuggestions}
      />
    </div>
  );
}

// ── SearchSuggestions ──

function SearchSuggestions({
  articles,
  onSelect,
  visible,
}: {
  articles: FeedArticle[];
  onSelect: (query: string) => void;
  visible: boolean;
}) {
  const [nowMs] = useState(() => Date.now());
  const trending = useMemo(() => getTrendingTopics(articles, nowMs, 5), [articles, nowMs]);

  if (!visible || trending.length === 0) return null;

  return (
    <div
      role="listbox"
      aria-label="Trending topic suggestions"
      className="absolute left-0 right-0 top-full z-40 mt-1 rounded-lg border border-border bg-card p-2 shadow-lg"
    >
      <span className="px-2 text-xs font-medium text-muted-foreground">Trending topics</span>
      <div className="mt-1 space-y-0.5">
        {trending.map(({ topic, sourceCount }) => (
          <button
            key={topic}
            role="option"
            aria-selected={false}
            onClick={() => onSelect(topic)}
            className="flex min-h-[44px] w-full items-center justify-between rounded-md px-2 py-1.5 text-sm text-card-foreground hover:bg-muted"
          >
            <span className="capitalize">{topic}</span>
            <span className="text-xs text-muted-foreground">{sourceCount} sources</span>
          </button>
        ))}
      </div>
    </div>
  );
}
