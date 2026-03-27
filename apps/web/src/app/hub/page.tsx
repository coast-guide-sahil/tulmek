import { Suspense } from "react";
import type { Metadata } from "next";
import type { FeedArticle } from "@tulmek/core/domain";
import type { FeedMetadata } from "@tulmek/core/domain";
import feedData from "@/content/hub/feed.json";
import metadataJson from "@/content/hub/metadata.json";
import { FeedLayout } from "@/components/hub/feed-layout";
import { FeedSkeleton } from "@/components/hub/feed-skeleton";
import { FeaturedPicks } from "@/components/hub/featured-picks";
import { CompensationHighlights } from "@/components/hub/compensation-highlights";
import { ForYou } from "@/components/hub/for-you";
import { SourceDiversity } from "@/components/hub/source-diversity";
import { PrepPulse } from "@/components/hub/prep-pulse";
import { StatsBanner } from "@/components/hub/stats-banner";
import { APP_NAME } from "@tulmek/config/constants";

const articles = feedData as FeedArticle[];
const feedMeta = metadataJson as FeedMetadata;
const BUILD_TIME = new Date(feedMeta.lastRefreshedAt).getTime();

export const metadata: Metadata = {
  title: `Knowledge Hub — ${APP_NAME}`,
  description:
    "Stay current with the latest interview prep content aggregated from HackerNews, Reddit, dev.to, YouTube and more. Updated daily.",
};

export default function HubPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
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

      {/* Stats Banner */}
      <StatsBanner
        articles={articles}
        lastRefreshedAt={feedMeta.lastRefreshedAt}
      />

      {/* Prep Pulse — latest from each source */}
      <PrepPulse articles={articles} />

      {/* Source Diversity Bar */}
      <SourceDiversity articles={articles} />

      {/* Featured Picks */}
      <FeaturedPicks articles={articles} nowMs={BUILD_TIME} />

      {/* Personalized Recommendations */}
      <ForYou articles={articles} />

      {/* Compensation & Interview Experience Highlights */}
      <CompensationHighlights articles={articles} />

      {/* Feed — wrapped in Suspense for nuqs URL state */}
      <Suspense fallback={<FeedSkeleton />}>
        <FeedLayout articles={articles} />
      </Suspense>
    </div>
  );
}
