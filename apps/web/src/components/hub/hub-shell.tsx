"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_NAME } from "@tulmek/config/constants";

const NAV_ITEMS = [
  { href: "/hub", label: "Feed", exact: true },
  { href: "/hub/saved", label: "Saved", exact: true },
  { href: "/progress", label: "Practice", exact: false },
] as const;

export function HubShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
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
          <ThemeToggle />
        </div>

        {/* Navigation */}
        <nav
          aria-label="Hub sections"
          className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6"
        >
          <div className="flex gap-1 pb-2">
            {NAV_ITEMS.map(({ href, label, exact }) => {
              const isActive = exact
                ? pathname === href
                : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex min-h-[44px] items-center whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors sm:px-4 ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {label}
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
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Content refreshed daily. All bookmarks saved locally — no account required.
          </p>
        </div>
      </footer>
    </div>
  );
}
