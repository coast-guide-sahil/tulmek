import type { Metadata } from "next";
import type { FeedArticle } from "@tulmek/core/domain";
import feedData from "@/content/hub/feed.json";
import { SavedFeed } from "@/components/hub/saved-feed";
import { APP_NAME } from "@tulmek/config/constants";

export const metadata: Metadata = {
  title: `Saved — ${APP_NAME}`,
  description: "Your bookmarked interview prep articles.",
};

export default function SavedPage() {
  const articles = feedData as FeedArticle[];

  return <SavedFeed articles={articles} />;
}
