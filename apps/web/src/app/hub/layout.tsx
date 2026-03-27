import type { ReactNode } from "react";
import type { FeedArticle } from "@tulmek/core/domain";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import feedData from "@tulmek/content/hub/feed";
import { HubShell } from "@/components/hub/hub-shell";
import { HubProvider } from "@/lib/hub/provider";
import { ToastProvider } from "@/components/hub/toast";

export default function HubLayout({ children }: { children: ReactNode }) {
  const articles = feedData as FeedArticle[];

  return (
    <NuqsAdapter>
      <HubProvider articles={articles}>
        <ToastProvider>
          <HubShell>{children}</HubShell>
        </ToastProvider>
      </HubProvider>
    </NuqsAdapter>
  );
}
