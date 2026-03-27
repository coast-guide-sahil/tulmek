"use client";

import { useSyncExternalStore } from "react";
import { useHub } from "@/lib/hub/provider";

const emptySubscribe = () => () => {};

/**
 * Personalized greeting based on time of day and user engagement.
 * Creates emotional connection — "Good morning! You've read 23 articles."
 * Personal touch increases perceived value and daily return.
 */
export function WelcomeBack() {
  const readCount = useHub((s) => s.readIds.size);
  const bookmarkCount = useHub((s) => Object.keys(s.bookmarks).length);
  const hydrated = useHub((s) => s.hydrated);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!mounted || !hydrated) return null;
  if (readCount === 0 && bookmarkCount === 0) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const messages: string[] = [];
  if (readCount > 0) messages.push(`${readCount} articles explored`);
  if (bookmarkCount > 0) messages.push(`${bookmarkCount} saved for later`);

  return (
    <p className="section-enter text-sm text-muted-foreground">
      {greeting}! {messages.join(" · ")}. Keep going!
    </p>
  );
}
