"use client";

import { useState, useCallback } from "react";


interface SharePrepProps {
  readonly companyName: string;
  readonly companySlug: string;
  readonly totalArticles: number;
}

/**
 * "Share My Prep" button group — copy link, share to X (Twitter), share to LinkedIn.
 * Drives organic acquisition: the shared link leads to the company page which has
 * a rich OG image generated automatically by opengraph-image.tsx.
 */
export function SharePrep({ companyName, companySlug, totalArticles }: SharePrepProps) {
  const [copied, setCopied] = useState(false);

  const prepUrl = typeof window !== "undefined"
    ? `${window.location.origin}/hub/company/${companySlug}`
    : `https://tulmek.vercel.app/hub/company/${companySlug}`;

  const shareText = `I'm prepping for ${companyName} interviews on TULMEK — ${totalArticles} articles from 8 sources. Check it out:`;

  const handleNativeShare = useCallback(async () => {
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/hub/company/${companySlug}`
      : `https://tulmek.vercel.app/hub/company/${companySlug}`;
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

  const handleTwitterShare = useCallback(() => {
    const twitterText = encodeURIComponent(`${shareText}\n${prepUrl}`);
    window.open(
      `https://twitter.com/intent/tweet?text=${twitterText}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400",
    );
  }, [shareText, prepUrl]);

  const handleLinkedInShare = useCallback(() => {
    const encodedUrl = encodeURIComponent(prepUrl);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      "_blank",
      "noopener,noreferrer,width=600,height=500",
    );
  }, [prepUrl]);

  return (
    <div className="flex items-center gap-2">
      {/* Primary: copy / native share */}
      <button
        onClick={handleNativeShare}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition-all hover:bg-primary/10"
        aria-label="Share this company prep page"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
        {copied ? "Copied!" : "Share"}
      </button>

      {/* X (Twitter) share */}
      <button
        onClick={handleTwitterShare}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border bg-card p-2 text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
        aria-label="Share on X (Twitter)"
        title="Share on X"
      >
        {/* X / Twitter logo */}
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>

      {/* LinkedIn share */}
      <button
        onClick={handleLinkedInShare}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border bg-card p-2 text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
        aria-label="Share on LinkedIn"
        title="Share on LinkedIn"
      >
        {/* LinkedIn logo */}
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      </button>
    </div>
  );
}
