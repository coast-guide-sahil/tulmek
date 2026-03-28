"use client";

import { useState, useCallback } from "react";


interface SharePrepProps {
  readonly companyName: string;
  readonly companySlug: string;
  readonly totalArticles: number;
}

/**
 * "Share My Prep" button — copies a shareable URL with stats.
 * Drives organic acquisition: the shared link leads to the company page.
 */
export function SharePrep({ companyName, companySlug, totalArticles }: SharePrepProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/hub/company/${companySlug}`;
    const text = `I'm prepping for ${companyName} interviews on TULMEK — ${totalArticles} articles from 8 sources. Check it out:`;

    // Try native share first (mobile), fallback to clipboard
    if (navigator.share) {
      try {
        await navigator.share({ title: `${companyName} Interview Prep — TULMEK`, text, url });
        return;
      } catch { /* user cancelled or not supported */ }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard not available */ }
  }, [companyName, companySlug, totalArticles]);

  return (
    <button
      onClick={handleShare}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition-all hover:bg-primary/10"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
      </svg>
      {copied ? "Copied!" : "Share My Prep"}
    </button>
  );
}
