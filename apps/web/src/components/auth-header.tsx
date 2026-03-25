"use client";

import { useSession, signOut } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { ROLES, APP_NAME } from "@tulmek/config/constants";

export function AuthHeader() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex w-full items-center justify-between border-b border-border px-4 py-3 sm:px-6 sm:py-4">
      <Link
        href="/"
        className="text-base font-semibold text-foreground sm:text-lg"
      >
        {APP_NAME}
      </Link>

      <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-3">
        {process.env.NEXT_PUBLIC_SKIP_AUTH === "true" ? null : isPending ? (
          <div
            className="h-8 w-20 animate-pulse rounded bg-muted"
            aria-hidden="true"
          />
        ) : !session ? (
          <>
            <Link
              href="/sign-in"
              className="flex min-h-[44px] items-center px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-3"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="flex min-h-[44px] items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 sm:px-4"
            >
              Sign Up
            </Link>
          </>
        ) : (
          <>
            <span className="hidden max-w-[10rem] truncate text-sm text-muted-foreground sm:inline lg:max-w-[16rem]">
              {session.user.name}
            </span>
            {session.user.role === ROLES.ADMIN && (
              <Link
                href="/admin"
                className="flex min-h-[44px] items-center rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Admin
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="flex min-h-[44px] items-center px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-3"
            >
              Sign Out
            </button>
          </>
        )}
        <ThemeToggle />
      </nav>
    </header>
  );
}
