"use client";

import { useSession } from "@/lib/auth-client";
import { AuthHeader } from "@/components/auth-header";
import Link from "next/link";
import { ROLES } from "@tulmek/config/constants";

const skipAuth = process.env.NEXT_PUBLIC_SKIP_AUTH === "true";

export default function Home() {
  const { data: session, isPending } = useSession();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AuthHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        {skipAuth ? (
          <div className="w-full max-w-[min(28rem,100%)] rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
            <h1 className="mb-1 text-xl font-semibold text-card-foreground sm:text-2xl">
              Welcome, Guest
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in is available in the production environment
            </p>
          </div>
        ) : isPending ? (
          <div
            className="w-full max-w-[min(28rem,100%)] rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
            role="status"
            aria-label="Loading your profile"
          >
            <div className="mb-4 h-6 w-48 animate-pulse rounded bg-muted" />
            <div className="space-y-3">
              <div className="h-12 w-full animate-pulse rounded-lg bg-muted" />
              <div className="h-12 w-full animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
        ) : session ? (
          <div className="w-full max-w-[min(28rem,100%)] rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h1 className="mb-1 text-xl font-semibold text-card-foreground sm:text-2xl">
              Welcome, {session.user.name}
            </h1>
            <p className="mb-4 text-sm text-muted-foreground">
              Your account details
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="max-w-[60%] truncate text-right text-sm font-medium text-card-foreground">
                  {session.user.email}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
                <span className="text-sm text-muted-foreground">Role</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    session.user.role === ROLES.ADMIN
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {session.user.role}
                </span>
              </div>
            </div>
            {session.user.role === ROLES.ADMIN && (
              <div className="mt-4">
                <Link
                  href="/admin"
                  className="flex min-h-[44px] items-center justify-center rounded-lg border border-border text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Go to Admin Panel
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-[min(28rem,100%)] rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
            <h1 className="mb-1 text-xl font-semibold text-card-foreground sm:text-2xl">
              Welcome, Guest
            </h1>
            <p className="mb-6 text-sm text-muted-foreground">
              Sign in to access all features
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/sign-in"
                className="flex min-h-[44px] items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="flex min-h-[44px] items-center justify-center rounded-lg border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
