"use client";

import Link from "next/link";

/**
 * Root-level error boundary for non-hub routes.
 * Catches errors in /progress and other top-level routes.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-bold text-foreground">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        An error occurred while loading this page.
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-muted-foreground">Error ID: {error.digest}</p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="min-h-[44px] rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
        <Link
          href="/hub"
          className="min-h-[44px] rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          Go to Hub
        </Link>
      </div>
    </div>
  );
}
