import { Suspense } from "react";
import type { Metadata } from "next";
import type { FeedArticle } from "@tulmek/core/domain";
import type { FeedMetadata } from "@tulmek/core/domain";
import feedData from "@/content/hub/feed.json";
import metadataJson from "@/content/hub/metadata.json";
import { FeedLayout } from "@/components/hub/feed-layout";
import { WhatsNewBanner } from "@/components/hub/whats-new-banner";
import { FeedSkeleton } from "@/components/hub/feed-skeleton";
import { FeaturedPicks } from "@/components/hub/featured-picks";
import { CompensationHighlights } from "@/components/hub/compensation-highlights";
import { ForYou } from "@/components/hub/for-you";
import { SimilarToSaved } from "@/components/hub/similar-to-saved";
import { RandomDiscovery } from "@/components/hub/random-discovery";
import { SourceDiversity } from "@/components/hub/source-diversity";
import { PrepPulse } from "@/components/hub/prep-pulse";
import { StatsBanner } from "@/components/hub/stats-banner";
import { CategoryHealth } from "@/components/hub/category-health";
import { DailyDigest } from "@/components/hub/daily-digest";
import { ActiveDiscussions } from "@/components/hub/active-discussions";
import { WeeklyHighlights } from "@/components/hub/weekly-highlights";
import { APP_NAME } from "@tulmek/config/constants";

const articles = feedData as FeedArticle[];
const feedMeta = metadataJson as FeedMetadata;
const BUILD_TIME = new Date(feedMeta.lastRefreshedAt).getTime();

const ogDescription = `${feedMeta.totalArticles} interview prep articles from ${Object.keys(feedMeta.sourceBreakdown).length} sources across ${Object.keys(feedMeta.categoryBreakdown).length} categories. DSA, System Design, AI/ML, Compensation & more. Refreshed daily.`;

export const metadata: Metadata = {
  title: `Knowledge Hub — ${APP_NAME}`,
  description: ogDescription,
  openGraph: {
    title: `${APP_NAME} Knowledge Hub — Interview Prep Content Aggregator`,
    description: ogDescription,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} Knowledge Hub`,
    description: ogDescription,
  },
  alternates: {
    canonical: "/hub",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: `${APP_NAME} Knowledge Hub`,
  description: "AI-powered interview prep content aggregator — fresh content daily from HackerNews, Reddit, dev.to, YouTube.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "/hub?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export default function HubPage() {
  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Header */}
      <div className="hub-hero-gradient -mx-4 rounded-2xl px-4 py-2 sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="section-enter text-2xl font-bold text-foreground sm:text-3xl">
            Knowledge Hub
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest interview prep content from across the web — refreshed daily.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-success" />
            {feedMeta.totalArticles} articles
          </span>
          <span>·</span>
          <span>
            Updated{" "}
            {new Date(feedMeta.lastRefreshedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
      </div>

      {/* Stats Banner */}
      <StatsBanner
        articles={articles}
        lastRefreshedAt={feedMeta.lastRefreshedAt}
      />

      {/* What's New Banner */}
      <WhatsNewBanner articles={articles} />

      {/* Prep Pulse — latest from each source */}
      <PrepPulse articles={articles} />

      {/* Category Health */}
      <CategoryHealth articles={articles} nowMs={BUILD_TIME} />

      {/* Source Diversity Bar */}
      <SourceDiversity articles={articles} />

      {/* Featured Picks */}
      <FeaturedPicks articles={articles} nowMs={BUILD_TIME} />

      {/* Daily Digest */}
      <DailyDigest articles={articles} refreshedAt={feedMeta.lastRefreshedAt} />

      {/* Personalized Recommendations */}
      <ForYou articles={articles} />

      {/* Similar to Saved */}
      <SimilarToSaved articles={articles} />

      {/* Active Discussions */}
      <ActiveDiscussions articles={articles} nowMs={BUILD_TIME} />

      {/* Compensation & Interview Experience Highlights */}
      <CompensationHighlights articles={articles} />

      {/* Weekly Highlights */}
      <WeeklyHighlights articles={articles} nowMs={BUILD_TIME} />

      {/* Random Discovery */}
      <RandomDiscovery articles={articles} />

      {/* Feed — wrapped in Suspense for nuqs URL state */}
      <Suspense fallback={<FeedSkeleton />}>
        <FeedLayout articles={articles} />
      </Suspense>
    </div>
  );
}
