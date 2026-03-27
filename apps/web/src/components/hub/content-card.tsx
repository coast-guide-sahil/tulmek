"use client";

import { memo } from "react";
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

  // Detect interview outcome from title for experience articles
  const titleLower = article.title.toLowerCase();
  const outcome = (article.category === "interview-experience" || article.category === "compensation")
    ? titleLower.includes("offer") || titleLower.includes("selected") || titleLower.includes("accepted")
      ? "offer"
      : titleLower.includes("reject") ? "reject" : null
    : null;

  // Extract level from title (L3, L4, E5, SDE1, SDE2, etc.)
  const levelMatch = article.title.match(/\b(L[3-7]|E[3-7]|SDE\s?[1-3]|ICT[3-6]|SSE|Staff|Principal|Senior|Junior)\b/i);
  const level = levelMatch ? levelMatch[1]!.toUpperCase() : null;

  // Extract salary/TC mention from title or excerpt
  const salaryMatch = (article.category === "compensation")
    ? (article.title + " " + article.excerpt).match(/(\d+[\.,]?\d*)\s*(LPA|lpa|CTC|ctc|k\/yr|TC|tc)/i)
    : null;
  const salary = salaryMatch ? `${salaryMatch[1]} ${salaryMatch[2]!.toUpperCase()}` : null;

  // Extract location from pipe-separated titles (last segment often is location)
  const segments = article.title.split("|").map((s) => s.trim());
  const lastSeg = segments.length >= 3 ? segments[segments.length - 1] : null;
  const locationKeywords = /\b(bangalore|bengaluru|hyderabad|mumbai|delhi|pune|gurgaon|noida|chennai|seattle|san francisco|new york|london|berlin|singapore|tokyo|remote|india|usa|uk|germany|canada)\b/i;
  const location = lastSeg && locationKeywords.test(lastSeg) ? lastSeg : null;

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
        <div className="flex items-center gap-0.5">
          {isNew && <NewBadge />}
          {isTrending && <TrendingBadge />}
          {outcome === "offer" && (
            <span className="rounded-full bg-success/15 px-1.5 py-0.5 text-xs font-medium text-success">OFFER</span>
          )}
          {outcome === "reject" && (
            <span className="rounded-full bg-destructive/15 px-1.5 py-0.5 text-xs font-medium text-destructive">REJECT</span>
          )}
          <BookmarkButton
            isBookmarked={isBookmarked}
            onClick={() => onToggleBookmark(article.id)}
          />
          {onDismiss && (
            <button
              onClick={() => onDismiss(article.id)}
              className="flex min-h-[44px] min-w-[36px] shrink-0 items-center justify-center rounded-lg text-muted-foreground/40 transition-colors hover:text-muted-foreground"
              aria-label="Not interested"
              title="Hide"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
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

      {/* Tags — extract company from pipe-separated titles like "Google | L4 | Offer" */}
      <div className="mt-2 flex flex-wrap gap-1">
        {article.title.includes("|") && article.title.split("|")[0]!.trim().length <= 20 && (
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
            {article.title.split("|")[0]!.trim()}
          </span>
        )}
        {article.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Footer: category + meta */}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
        <CategoryPill config={categoryConfig} />
        {level && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-bold text-card-foreground">
            {level}
          </span>
        )}
        {salary && (
          <span className="rounded bg-yellow-500/15 px-1.5 py-0.5 text-xs font-bold text-yellow-700 dark:text-yellow-300">
            {salary}
          </span>
        )}
        {location && (
          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {location}
          </span>
        )}
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
  const knownDomains = new Set(["reddit.com", "dev.to", "youtube.com", "leetcode.com", "medium.com", "github.com"]);
  return (
    <span className="flex items-center gap-1 font-medium">
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
        alt=""
        width={14}
        height={14}
        className="rounded-sm"
        loading="lazy"
      />
      <span>{sourceName}</span>
      {!knownDomains.has(domain) && (
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

// DiscussionButton and ShareButton removed — declutter card header per UX audit
// Discussion link available via comment count in footer
// Share available via "s" keyboard shortcut

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
