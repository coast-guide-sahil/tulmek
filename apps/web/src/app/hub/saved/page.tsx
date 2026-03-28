import type { Metadata } from "next";
import type { FeedArticle } from "@tulmek/core/domain";
import feedData from "@tulmek/content/hub/feed";
import { SavedFeed } from "@/components/hub/saved-feed";
import { APP_NAME } from "@tulmek/config/constants";

export const metadata: Metadata = {
  title: `Saved Articles — ${APP_NAME}`,
  description: "Your bookmarked interview prep articles. All saved locally — no account required.",
  alternates: { canonical: "/hub/saved" },
};

export default function SavedPage() {
  const articles = feedData as unknown as FeedArticle[];

  return <SavedFeed articles={articles} />;
}
