import { Suspense } from "react";
import type { Metadata } from "next";
import type { FeedArticle } from "@tulmek/core/domain";
import type { FeedMetadata } from "@tulmek/core/domain";
import feedData from "@tulmek/content/hub/feed";
import metadataJson from "@tulmek/content/hub/metadata";
import { FeedLayout } from "@/components/hub/feed-layout";
import { FeedSkeleton } from "@/components/hub/feed-skeleton";
import { FeaturedPicks } from "@/components/hub/featured-picks";
import { TodaysBriefWrapper } from "@/components/hub/todays-brief-wrapper";
import { WhatsNewBanner } from "@/components/hub/whats-new-banner";
import { WelcomeBack } from "@/components/hub/welcome-back";
import { FirstVisit } from "@/components/hub/first-visit";
import { APP_NAME } from "@tulmek/config/constants";

const articles = feedData as unknown as FeedArticle[];
const feedMeta = metadataJson as unknown as FeedMetadata;
const BUILD_TIME = new Date(feedMeta.lastRefreshedAt).getTime();

const ogDescription = `${feedMeta.totalArticles} interview prep articles from ${Object.keys(feedMeta.sourceBreakdown).length} sources across ${Object.keys(feedMeta.categoryBreakdown).length} categories. DSA, System Design, AI/ML, Compensation & more. Refreshed every 3 hours.`;

export const metadata: Metadata = {
  title: "Knowledge Hub",
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
  alternates: { canonical: "/hub" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: `${APP_NAME} Knowledge Hub`,
  description: ogDescription,
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: "/hub?q={search_term_string}" },
    "query-input": "required name=search_term_string",
  },
};

export default function HubPage() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Compact Hero — title + stats + welcome in one block */}
      <div>
        <div className="flex items-center justify-between">
          <h1 className="section-enter text-2xl font-extrabold text-foreground sm:text-3xl">
            Knowledge Hub
          </h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 live-pulse rounded-full bg-success" />
              Live
            </span>
            <span>·</span>
            <span>{feedMeta.totalArticles} articles · {Object.keys(feedMeta.sourceBreakdown).length} sources</span>
          </div>
        </div>
        <WelcomeBack />
        <WhatsNewBanner articles={articles} />
      </div>

      {/* First visit onboarding */}
      <FirstVisit articleCount={feedMeta.totalArticles} sourceCount={Object.keys(feedMeta.sourceBreakdown).length} />

      {/* 2. Today's Brief — daily digest with per-category breakdown */}
      <TodaysBriefWrapper articles={articles} nowMs={BUILD_TIME} />

      {/* 3. Featured Picks — bento layout, the ONE curated section */}
      <FeaturedPicks articles={articles} nowMs={BUILD_TIME} />

      {/* 4. The Feed — search, categories, sort, infinite scroll */}
      <Suspense fallback={<FeedSkeleton />}>
        <FeedLayout articles={articles} />
      </Suspense>
    </div>
  );
}
