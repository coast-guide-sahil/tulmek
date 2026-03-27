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
import { RandomDiscovery } from "@/components/hub/random-discovery";
import { StatsBanner } from "@/components/hub/stats-banner";
import { DailyDigest } from "@/components/hub/daily-digest";
import { ActiveDiscussions } from "@/components/hub/active-discussions";
import { WelcomeBack } from "@/components/hub/welcome-back";
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

      {/* 1. Hero — clean, focused */}
      <div className="hub-hero-gradient -mx-4 rounded-2xl px-4 py-3 sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="section-enter text-2xl font-bold text-foreground sm:text-3xl">
              Knowledge Hub
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {feedMeta.totalArticles} articles from {Object.keys(feedMeta.sourceBreakdown).length} sources — refreshed daily
            </p>
            <WelcomeBack />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 live-pulse rounded-full bg-success" />
              Live
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

      {/* 2. What's New — return hook */}
      <WhatsNewBanner articles={articles} />

      {/* 3. Stats — compact overview */}
      <StatsBanner articles={articles} lastRefreshedAt={feedMeta.lastRefreshedAt} />

      {/* 4. Daily Digest — THE hero section (newspaper front page) */}
      <DailyDigest articles={articles} refreshedAt={feedMeta.lastRefreshedAt} />

      {/* 5. Top Picks — curated best content */}
      <FeaturedPicks articles={articles} nowMs={BUILD_TIME} />

      {/* 6. Personalized — only shows after 3+ reads */}
      <ForYou articles={articles} />

      {/* 7. Active Discussions — live urgency */}
      <ActiveDiscussions articles={articles} nowMs={BUILD_TIME} />

      {/* 8. Compensation & Experiences — dedicated sections */}
      <CompensationHighlights articles={articles} />

      {/* 9. Discovery — surprise element */}
      <RandomDiscovery articles={articles} />

      {/* 10. Full Feed — the main content */}
      <Suspense fallback={<FeedSkeleton />}>
        <FeedLayout articles={articles} />
      </Suspense>
    </div>
  );
}
