import type { ReactNode } from "react";
import type { FeedArticle } from "@tulmek/core/domain";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import feedData from "@/content/hub/feed.json";
import { HubShell } from "@/components/hub/hub-shell";
import { HubProvider } from "@/lib/hub/provider";

export default function HubLayout({ children }: { children: ReactNode }) {
  const articles = feedData as FeedArticle[];

  return (
    <NuqsAdapter>
      <HubProvider articles={articles}>
        <HubShell>{children}</HubShell>
      </HubProvider>
    </NuqsAdapter>
  );
}
