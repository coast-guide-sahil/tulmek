"use client";

import { useEffect } from "react";

/**
 * Full keyboard navigation for the feed:
 * j/k = next/previous article (with visual highlight)
 * o = open in new tab
 * b = toggle bookmark
 * s = share (copy link)
 */
export function KeyboardNav() {
  useEffect(() => {
    let focusedArticleIdx = -1;

    const highlightArticle = (idx: number) => {
      // Remove previous highlight
      document.querySelectorAll("article.keyboard-focused").forEach((el) => {
        el.classList.remove("keyboard-focused");
      });
      const articles = document.querySelectorAll("article");
      if (idx >= 0 && idx < articles.length) {
        articles[idx]?.classList.add("keyboard-focused");
        articles[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
        const link = articles[idx]?.querySelector("a");
        link?.focus({ preventScroll: true });
      }
    };

    const handler = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        e.ctrlKey || e.metaKey || e.altKey
      ) return;

      const articles = Array.from(document.querySelectorAll("article"));
      if (articles.length === 0) return;

      // O = open current article in new tab
      if (e.key === "o") {
        const focused = articles[focusedArticleIdx] ?? document.activeElement?.closest("article");
        const link = focused?.querySelector<HTMLAnchorElement>("a[target='_blank']");
        if (link) {
          e.preventDefault();
          window.open(link.href, "_blank", "noopener,noreferrer");
        }
        return;
      }

      // B = toggle bookmark on focused article
      if (e.key === "b") {
        const focused = articles[focusedArticleIdx] ?? document.activeElement?.closest("article");
        const bookmarkBtn = focused?.querySelector<HTMLButtonElement>("button[aria-label*='bookmark' i]");
        if (bookmarkBtn) {
          e.preventDefault();
          bookmarkBtn.click();
        }
        return;
      }

      // S = copy focused article link to clipboard
      if (e.key === "s") {
        const focused = articles[focusedArticleIdx] ?? document.activeElement?.closest("article");
        const link = focused?.querySelector<HTMLAnchorElement>("a[target='_blank']");
        if (link && typeof navigator !== "undefined" && navigator.clipboard) {
          e.preventDefault();
          navigator.clipboard.writeText(link.href).catch(() => {});
        }
        return;
      }

      // N = jump to next unread article (skip read ones)
      if (e.key === "n") {
        e.preventDefault();
        const unreadArticles = articles.filter((a) => !a.classList.contains("hub-card-read"));
        if (unreadArticles.length === 0) return;

        // Find next unread after current position
        const scrollY = window.scrollY + window.innerHeight / 3;
        let nextUnread = unreadArticles[0];
        for (const a of unreadArticles) {
          if (a.getBoundingClientRect().top + window.scrollY > scrollY + 50) {
            nextUnread = a;
            break;
          }
        }
        if (nextUnread) {
          nextUnread.classList.add("keyboard-focused");
          nextUnread.scrollIntoView({ behavior: "smooth", block: "center" });
          const link = nextUnread.querySelector("a");
          link?.focus({ preventScroll: true });
        }
        return;
      }

      // J/K = navigate articles with visual highlight
      if (e.key === "j" || e.key === "k") {
        e.preventDefault();

        if (focusedArticleIdx === -1) {
          // First press — find nearest article
          const scrollY = window.scrollY + window.innerHeight / 3;
          for (let i = 0; i < articles.length; i++) {
            if (articles[i]!.getBoundingClientRect().top + window.scrollY <= scrollY) {
              focusedArticleIdx = i;
            }
          }
        }

        focusedArticleIdx = e.key === "j"
          ? Math.min(focusedArticleIdx + 1, articles.length - 1)
          : Math.max(focusedArticleIdx - 1, 0);

        highlightArticle(focusedArticleIdx);
      }
    };

    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      document.querySelectorAll("article.keyboard-focused").forEach((el) => {
        el.classList.remove("keyboard-focused");
      });
    };
  }, []);

  return null;
}
