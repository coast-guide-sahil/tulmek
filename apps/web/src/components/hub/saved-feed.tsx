"use client";

import { useMemo } from "react";
import type { FeedArticle } from "@tulmek/core/domain";
import { useHub, useHubActions } from "@/lib/hub/provider";
import { ContentCard } from "./content-card";
import { ExportReadingList } from "./export-reading-list";
import { FeedSkeleton } from "./feed-skeleton";

interface SavedFeedProps {
  readonly articles: FeedArticle[];
}

export function SavedFeed({ articles }: SavedFeedProps) {
  const bookmarks = useHub((s) => s.bookmarks);
  const hydrated = useHub((s) => s.hydrated);
  const { toggleBookmark } = useHubActions();

  const savedArticles = useMemo(() => {
    const bookmarkedIds = Object.keys(bookmarks);
    return articles
      .filter((a) => bookmarkedIds.includes(a.id))
      .sort((a, b) => {
        const aTime = bookmarks[a.id]?.savedAt ?? "";
        const bTime = bookmarks[b.id]?.savedAt ?? "";
        return bTime.localeCompare(aTime);
      });
  }, [articles, bookmarks]);

  if (!hydrated) {
    return <FeedSkeleton />;
  }

  if (savedArticles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
        <svg
          className="h-16 w-16 text-muted-foreground/30"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
          />
        </svg>
        <h2 className="mt-4 text-lg font-semibold text-foreground">
          No saved articles yet
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Bookmark articles from the feed to save them here for later reading.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Saved Articles
        </h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{savedArticles.length} saved</span>
          <span>·</span>
          <span>{savedArticles.reduce((sum, a) => sum + a.readingTime, 0)} min total</span>
          <ExportReadingList articles={articles} />
        </div>
      </div>

      <div className="space-y-3">
        {savedArticles.map((article) => (
          <ContentCard
            key={article.id}
            article={article}
            isBookmarked={article.id in bookmarks}
            onToggleBookmark={toggleBookmark}
            layout="list"
          />
        ))}
      </div>
    </div>
  );
}
