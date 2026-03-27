"use client";

import { useEffect } from "react";

/**
 * J/K keyboard navigation between articles (Vim-style).
 * Power users navigate the feed without touching the mouse.
 * Increases engagement depth — users who learn J/K stay longer.
 */
export function KeyboardNav() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        e.ctrlKey || e.metaKey || e.altKey
      ) return;

      if (e.key === "j" || e.key === "k") {
        e.preventDefault();
        const articles = Array.from(document.querySelectorAll("article"));
        if (articles.length === 0) return;

        // Find currently focused/nearest article
        const scrollY = window.scrollY + window.innerHeight / 3;
        let currentIdx = 0;
        for (let i = 0; i < articles.length; i++) {
          if (articles[i]!.getBoundingClientRect().top + window.scrollY <= scrollY) {
            currentIdx = i;
          }
        }

        const nextIdx = e.key === "j"
          ? Math.min(currentIdx + 1, articles.length - 1)
          : Math.max(currentIdx - 1, 0);

        articles[nextIdx]?.scrollIntoView({ behavior: "smooth", block: "center" });
        // Focus for keyboard accessibility
        const link = articles[nextIdx]?.querySelector("a");
        link?.focus({ preventScroll: true });
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return null;
}
