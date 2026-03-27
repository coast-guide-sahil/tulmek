"use client";

import { memo, useState } from "react";
import type { FeedArticle } from "@tulmek/core/domain";
import { formatRelativeTime, getCategoryConfig } from "./hub-utils";

interface ContentCardProps {
  readonly article: FeedArticle;
  readonly isBookmarked: boolean;
  readonly onToggleBookmark: (id: string) => void;
  readonly onArticleClick?: (id: string) => void;
  readonly onDismiss?: (id: string) => void;
  readonly layout: "grid" | "list";
  readonly isNew?: boolean;
  readonly isRead?: boolean;
}

const TRENDING_THRESHOLD = 500;
const HOT_DISCUSSION_THRESHOLD = 100;

export const ContentCard = memo(function ContentCard({
  article,
  isBookmarked,
  onToggleBookmark,
  onArticleClick,
  onDismiss,
  layout,
  isNew = false,
  isRead = false,
}: ContentCardProps) {
  const categoryConfig = getCategoryConfig(article.category);
  const relativeTime = formatRelativeTime(article.publishedAt);
  const isTrending = article.score >= TRENDING_THRESHOLD;
  const isHotDiscussion = article.commentCount >= HOT_DISCUSSION_THRESHOLD;
  // Quality tier: engagement + discussion depth
  const qualityScore = article.score + article.commentCount * 3;
  const qualityTier = qualityScore >= 1000 ? "high" : qualityScore >= 200 ? "medium" : "low";

  const handleLinkClick = () => {
    onArticleClick?.(article.id);
  };

  const cardStateClass = isRead ? "hub-card-read" : "hub-card-unread";

  if (layout === "list") {
    return (
      <article data-category={article.category} className={`hub-card group flex items-start gap-3 rounded-xl border border-border bg-card p-3 sm:gap-4 sm:p-4 ${cardStateClass}`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <SourceBadge sourceName={article.sourceName} domain={article.domain} />
            <span aria-label="Published">{relativeTime}</span>
            {isNew && <NewBadge />}
            {isTrending && <TrendingBadge />}
          </div>

          <h3 className="mt-1 text-sm font-semibold leading-snug text-card-foreground group-hover:text-primary sm:text-base">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              onClick={handleLinkClick}
            >
              {article.title}
            </a>
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CategoryPill config={categoryConfig} />
            {article.score > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <UpvoteIcon />
                {formatCount(article.score)}
              </span>
            )}
            {article.commentCount > 0 && article.discussionUrl && (
              <a
                href={article.discussionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <CommentIcon />
                {formatCount(article.commentCount)}
                {isHotDiscussion && <span className="text-destructive">*</span>}
              </a>
            )}
            <span className="text-xs text-muted-foreground">
              {article.readingTime} min read
            </span>
          </div>
        </div>

        <BookmarkButton
          isBookmarked={isBookmarked}
          onClick={() => onToggleBookmark(article.id)}
        />
      </article>
    );
  }

  // Grid layout
  return (
    <article data-category={article.category} className={`hub-card group flex flex-col rounded-xl border border-border bg-card p-4 sm:p-5 ${cardStateClass}`}>
      {/* Header: source + time + badges + bookmark */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <QualityDot tier={qualityTier} />
          <SourceBadge sourceName={article.sourceName} domain={article.domain} />
          <span aria-label="Published">{relativeTime}</span>
        </div>
        <div className="flex items-center gap-0">
          {isNew && <NewBadge />}
          {isTrending && <TrendingBadge />}
          {article.discussionUrl && (
            <DiscussionButton url={article.discussionUrl} commentCount={article.commentCount} />
          )}
          <ShareButton url={article.url} title={article.title} />
          <BookmarkButton
            isBookmarked={isBookmarked}
            onClick={() => onToggleBookmark(article.id)}
          />
          {onDismiss && (
            <button
              onClick={() => onDismiss(article.id)}
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Not interested"
              title="Hide this article"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="mt-2 text-sm font-semibold leading-snug text-card-foreground group-hover:text-primary sm:text-base">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
          onClick={handleLinkClick}
        >
          {article.title}
        </a>
      </h3>

      {/* Excerpt */}
      {article.excerpt && article.excerpt !== article.title && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {article.excerpt}
        </p>
      )}

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {article.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer: category + meta */}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
        <CategoryPill config={categoryConfig} />
        {article.score > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <UpvoteIcon />
            {formatCount(article.score)}
          </span>
        )}
        {article.commentCount > 0 && article.discussionUrl && (
          <a
            href={article.discussionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <CommentIcon />
            {formatCount(article.commentCount)}
          </a>
        )}
        {/* Social proof — estimated readers */}
        {article.score >= 100 && (
          <span className="text-xs text-muted-foreground" title="Estimated readers based on engagement">
            ~{Math.round(article.score * 0.015 + article.commentCount * 0.08)} readers
          </span>
        )}
        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          {article.source === "youtube" && (
            <svg className="h-3.5 w-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
          {article.readingTime} min
        </span>
      </div>

      {/* Engagement bar (visual indicator) */}
      {isTrending && (
        <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary/60 transition-all"
            style={{ width: `${Math.min(100, (article.score / 2000) * 100)}%` }}
          />
        </div>
      )}
    </article>
  );
});

// ── Helpers ──

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ── Sub-components ──

function SourceBadge({ sourceName, domain }: { sourceName: string; domain: string }) {
  return (
    <span className="flex items-center gap-1 font-medium">
      <span>{sourceName}</span>
      {domain !== "reddit.com" && domain !== "dev.to" && domain !== "youtube.com" && (
        <span className="text-muted-foreground/60">({domain})</span>
      )}
    </span>
  );
}

function CategoryPill({ config }: { config: { label: string; className: string } }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

function NewBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-1.5 py-0.5 text-xs font-medium text-success">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
      NEW
    </span>
  );
}

function TrendingBadge() {
  return (
    <span className="trending-badge inline-flex items-center gap-1 rounded-full bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive">
      TRENDING
    </span>
  );
}

function BookmarkButton({ isBookmarked, onClick }: { isBookmarked: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${isBookmarked ? "bookmark-active" : ""}`}
      aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
      aria-pressed={isBookmarked}
    >
      {isBookmarked ? (
        <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 2h14a1 1 0 011 1v19.143a.5.5 0 01-.766.424L12 18.03l-7.234 4.536A.5.5 0 014 22.143V3a1 1 0 011-1z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
        </svg>
      )}
    </button>
  );
}

function QualityDot({ tier }: { tier: "high" | "medium" | "low" }) {
  const colors = {
    high: "bg-success",
    medium: "bg-amber-400",
    low: "bg-muted-foreground/30",
  };
  const labels = {
    high: "High quality",
    medium: "Good quality",
    low: "Standard",
  };
  return (
    <span
      className={`h-2 w-2 shrink-0 rounded-full ${colors[tier]}`}
      title={labels[tier]}
      aria-label={labels[tier]}
    />
  );
}

function DiscussionButton({ url, commentCount }: { url: string; commentCount: number }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label={`View discussion (${commentCount} comments)`}
      title={`${commentCount} comments`}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    </a>
  );
}

function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label={copied ? "Link copied!" : "Share article"}
      title={copied ? "Copied!" : "Share"}
    >
      {copied ? (
        <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
      )}
    </button>
  );
}

function UpvoteIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}
