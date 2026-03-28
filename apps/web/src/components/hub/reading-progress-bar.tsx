"use client";

import { useSyncExternalStore } from "react";
import { useHub } from "@/lib/hub/provider";

const emptySubscribe = () => () => {};

interface ReadingProgressBarProps {
  totalArticles: number;
}

/**
 * Thin fixed bar at the very top of the page showing overall reading progress.
 * Reads total articles read from the hub store vs the total feed size.
 * Only renders after hydration and once at least one article has been read.
 */
export function ReadingProgressBar({ totalArticles }: ReadingProgressBarProps) {
  const readCount = useHub((s) => s.readIds.size);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!mounted || readCount === 0) return null;

  const progress = Math.min(100, Math.round((readCount / totalArticles) * 100));

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-muted/50">
      <div
        className="h-full bg-primary transition-all duration-700 ease-out"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Reading progress: ${readCount} of ${totalArticles} articles (${progress}%)`}
      />
    </div>
  );
}
