import type { ReactNode } from "react";
import type { FeedArticle } from "@tulmek/core/domain";
import feedData from "@/content/hub/feed.json";
import { HubShell } from "@/components/hub/hub-shell";
import { HubProvider } from "@/lib/hub/provider";

export default function HubLayout({ children }: { children: ReactNode }) {
  const articles = feedData as FeedArticle[];

  return (
    <HubProvider articles={articles}>
      <HubShell>{children}</HubShell>
    </HubProvider>
  );
}
