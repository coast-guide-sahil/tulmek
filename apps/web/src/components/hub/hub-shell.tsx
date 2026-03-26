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
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <p className="text-center text-xs text-muted-foreground">
            Content refreshed daily from HackerNews, Reddit, dev.to, YouTube & more.
            All bookmarks saved locally — no account required.
          </p>
        </div>
      </footer>
    </div>
  );
}
