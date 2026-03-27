"use client";

import { useState } from "react";

export function CopyFeedLink() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <button
      onClick={handleCopy}
      className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:text-sm"
      aria-label={copied ? "Feed link copied!" : "Copy feed link"}
    >
      {copied ? (
        <>
          <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
          <span className="hidden sm:inline">Share feed</span>
        </>
      )}
    </button>
  );
}
