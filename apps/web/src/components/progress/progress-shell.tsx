"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProgressProvider } from "@/lib/progress/provider";
import { APP_NAME } from "@tulmek/config/constants";

const NAV_ITEMS = [
  { href: "/progress", label: "Dashboard", exact: true },
  { href: "/progress/dsa", label: "DSA", exact: false },
  { href: "/progress/hld", label: "HLD", exact: false },
  { href: "/progress/lld", label: "LLD", exact: false },
  { href: "/progress/behavioral", label: "Behavioral", exact: false },
] as const;

export function ProgressShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <ProgressProvider>
      <div className="flex min-h-dvh flex-col bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <Link
              href="/"
              className="text-base font-semibold text-foreground sm:text-lg"
            >
              {APP_NAME}
            </Link>
            <ThemeToggle />
          </div>

          {/* Category navigation */}
          <nav
            aria-label="Progress sections"
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
                    className={`flex min-h-[36px] items-center whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors sm:min-h-[40px] sm:px-4 ${
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
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </ProgressProvider>
  );
}
