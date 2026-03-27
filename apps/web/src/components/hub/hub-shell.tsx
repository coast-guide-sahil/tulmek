"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { ScrollToTop } from "./scroll-to-top";
import { KeyboardShortcutsHelp } from "./keyboard-shortcuts-help";
import { ReadingProgressBar } from "./reading-progress-bar";
import { KeyboardNav } from "./keyboard-nav";
import { ReadingStreak } from "./reading-streak";
import { PrepCountdown } from "./prep-countdown";
import { UserStats } from "./user-stats";
import { useHub } from "@/lib/hub/provider";
import { APP_NAME } from "@tulmek/config/constants";

const NAV_ITEMS = [
  { href: "/hub", label: "Feed", exact: true, showBadge: false },
  { href: "/hub/saved", label: "Saved", exact: true, showBadge: true },
  { href: "/progress", label: "Practice", exact: false, showBadge: false },
] as const;

export function HubShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const bookmarkCount = useHub((s) => Object.keys(s.bookmarks).length);
  const [headerHidden, setHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handler = () => {
      const currentY = window.scrollY;
      if (currentY > 200 && currentY > lastScrollY.current) {
        setHeaderHidden(true);
      } else {
        setHeaderHidden(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <ReadingProgressBar />
      <KeyboardNav />
      {/* Header */}
      <header className={`header-auto-hide sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm ${headerHidden ? "header-hidden" : ""}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/hub"
              className="text-base font-semibold text-foreground sm:text-lg"
            >
              {APP_NAME}
            </Link>
            <span className="hidden rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary sm:inline-flex">
              Knowledge Hub
            </span>
          </div>
          <div className="flex items-center gap-2">
            <PrepCountdown />
            <ReadingStreak />
            <ThemeToggle />
          </div>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Hub sections"
          className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6"
        >
          <div className="flex gap-1 pb-2">
            {NAV_ITEMS.map(({ href, label, exact, showBadge }) => {
              const isActive = exact
                ? pathname === href
                : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors sm:px-4 ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {label}
                  {showBadge && bookmarkCount > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {bookmarkCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>

      <ScrollToTop />
      <KeyboardShortcutsHelp />

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="text-sm font-medium text-foreground">{APP_NAME}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                AI-powered interview prep knowledge hub
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
              <span>Powered by</span>
              <a href="https://news.ycombinator.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">HackerNews</a>
              <span>·</span>
              <a href="https://reddit.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Reddit</a>
              <span>·</span>
              <a href="https://dev.to" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">dev.to</a>
              <span>·</span>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">YouTube</a>
              <span>·</span>
              <a href="https://leetcode.com/discuss" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">LeetCode</a>
              <span>·</span>
              <a href="https://medium.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Medium</a>
              <span>·</span>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">GitHub</a>
              <span>·</span>
              <a href="https://substack.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Newsletters</a>
            </div>
          </div>
          <div className="mt-3 flex flex-col items-center gap-2">
            <UserStats />
            <p className="text-center text-xs text-muted-foreground">
              Content refreshed every 3 hours from 8 sources. All bookmarks saved locally — no account required.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
