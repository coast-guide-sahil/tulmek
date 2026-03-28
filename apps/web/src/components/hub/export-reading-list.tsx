"use client";

import type { FeedArticle } from "@tulmek/core/domain";
import { useHub } from "@/lib/hub/provider";

interface ExportReadingListProps {
  readonly articles: FeedArticle[];
}

/**
 * Export bookmarked articles as shareable markdown.
 * Users can share their curated reading lists — viral loop.
 * "Check out my interview prep reading list on TULMEK"
 */
export function ExportReadingList({ articles }: ExportReadingListProps) {
  const bookmarks = useHub((s) => s.bookmarks);
  const hydrated = useHub((s) => s.hydrated);

  if (!hydrated) return null;

  const savedArticles = articles.filter((a) => a.id in bookmarks);
  if (savedArticles.length === 0) return null;

  const handleExport = () => {
    const lines = [
      "# My Interview Prep Reading List",
      `*Curated on TULMEK — ${savedArticles.length} articles*`,
      "",
      ...savedArticles.map((a) =>
        `- [${a.title}](${a.url}) — ${a.sourceName} · ${a.readingTime} min`
      ),
      "",
      "---",
      "*Created with [TULMEK Knowledge Hub](https://tulmek.vercel.app/hub)*",
    ];
    const markdown = lines.join("\n");

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(markdown);
    }
  };

  return (
    <button
      onClick={handleExport}
      className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:text-sm"
      aria-label="Export reading list as markdown"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      Export list
    </button>
  );
}
