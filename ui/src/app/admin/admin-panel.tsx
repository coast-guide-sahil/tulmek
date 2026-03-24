"use client";

import { authClient } from "@/lib/auth-client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ADMIN_PAGE_SIZE,
  ROLES,
  ERROR_MESSAGES,
  APP_NAME,
  type Role,
} from "@/lib/constants";

const SEARCH_DEBOUNCE_MS = 300;

interface User {
  id: string;
  name: string;
  email: string;
  role: Role | null;
  banned: boolean | null;
  banReason: string | null;
  createdAt: Date;
}

async function fetchUsers(search: string, offset: number) {
  const { data } = await authClient.admin.listUsers({
    query: {
      limit: ADMIN_PAGE_SIZE,
      offset,
      ...(search
        ? {
            searchValue: search,
            searchField: "email" as const,
            searchOperator: "contains" as const,
          }
        : {}),
      sortBy: "createdAt" as const,
      sortDirection: "desc" as const,
    },
  });
  return data;
}

export function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchUsers(search, offset)
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setUsers(data.users as User[]);
          setTotal(data.total);
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, offset, refreshKey]);

  async function handleSetRole(userId: string, newRole: Role) {
    setActionLoading(userId);
    setActionError(null);
    const { error } = await authClient.admin.setRole({
      userId,
      role: newRole,
    });
    setActionLoading(null);
    if (error) {
      setActionError(error.message ?? ERROR_MESSAGES.SET_ROLE_FAILED);
      return;
    }
    setRefreshKey((k) => k + 1);
  }

  async function handleBan(userId: string) {
    setActionLoading(userId);
    setActionError(null);
    const { error } = await authClient.admin.banUser({ userId });
    setActionLoading(null);
    if (error) {
      setActionError(error.message ?? ERROR_MESSAGES.BAN_FAILED);
      return;
    }
    setRefreshKey((k) => k + 1);
  }

  async function handleUnban(userId: string) {
    setActionLoading(userId);
    setActionError(null);
    const { error } = await authClient.admin.unbanUser({ userId });
    setActionLoading(null);
    if (error) {
      setActionError(error.message ?? ERROR_MESSAGES.UNBAN_FAILED);
      return;
    }
    setRefreshKey((k) => k + 1);
  }

  async function handleRemove(userId: string) {
    if (
      !window.confirm(
        ERROR_MESSAGES.REMOVE_CONFIRM
      )
    ) {
      return;
    }
    setActionLoading(userId);
    setActionError(null);
    const { error } = await authClient.admin.removeUser({ userId });
    setActionLoading(null);
    if (error) {
      setActionError(error.message ?? ERROR_MESSAGES.REMOVE_FAILED);
      return;
    }
    setRefreshKey((k) => k + 1);
  }

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [searchInput, setSearchInput] = useState("");

  const handleSearch = useCallback((value: string) => {
    setSearchInput(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearch(value);
      setOffset(0);
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  const totalPages = Math.ceil(total / ADMIN_PAGE_SIZE);
  const currentPage = Math.floor(offset / ADMIN_PAGE_SIZE) + 1;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="text-base font-semibold text-foreground sm:text-lg"
          >
            {APP_NAME}
          </Link>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex min-h-[44px] items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Home</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-semibold text-foreground sm:text-xl">
            User Management
          </h1>
          <span className="text-sm text-muted-foreground">
            {total} user{total !== 1 ? "s" : ""} total
          </span>
        </div>

        <div className="mb-4">
          <label htmlFor="user-search" className="sr-only">
            Search by email
          </label>
          <input
            id="user-search"
            type="search"
            placeholder="Search by email..."
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:max-w-sm"
          />
        </div>

        {actionError && (
          <div
            className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            <svg
              className="mt-0.5 h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <span>{actionError}</span>
          </div>
        )}

        {/* Table view for md+ */}
        <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
          <table className="w-full min-w-[640px]">
            <caption className="sr-only">User management table</caption>
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-36 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="ml-auto h-8 w-32 animate-pulse rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="h-8 w-8 text-muted-foreground/50"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128H5.228A2.25 2.25 0 0 1 3 16.878v-.002c0-1.113.285-2.16.786-3.07M15 19.128H5.228A2.25 2.25 0 0 1 3 16.878v-.002c0-1.113.285-2.16.786-3.07m0 0A5.995 5.995 0 0 1 12 12.75a5.995 5.995 0 0 1 5.058 2.772m0 0a3 3 0 1 0-3.225-4.125M12 6.75a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                        />
                      </svg>
                      <p className="text-sm text-muted-foreground">
                        {search ? "No users match your search" : "No users found"}
                      </p>
                      {search && (
                        <p className="text-xs text-muted-foreground/70">
                          Try adjusting your search term
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 text-sm text-card-foreground">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge banned={user.banned} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <UserActions
                          user={user}
                          actionLoading={actionLoading}
                          onSetRole={handleSetRole}
                          onBan={handleBan}
                          onUnban={handleUnban}
                          onRemove={handleRemove}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Card view for mobile */}
        <div className="flex flex-col gap-3 md:hidden">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-border bg-card p-4"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-28 rounded bg-muted" />
                    <div className="h-3 w-40 rounded bg-muted" />
                  </div>
                  <div className="ml-2 flex gap-2">
                    <div className="h-5 w-12 rounded-full bg-muted" />
                    <div className="h-5 w-12 rounded-full bg-muted" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-9 w-20 rounded bg-muted" />
                  <div className="h-9 w-12 rounded bg-muted" />
                  <div className="h-9 w-16 rounded bg-muted" />
                </div>
              </div>
            ))
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <svg
                className="h-8 w-8 text-muted-foreground/50"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128H5.228A2.25 2.25 0 0 1 3 16.878v-.002c0-1.113.285-2.16.786-3.07M15 19.128H5.228A2.25 2.25 0 0 1 3 16.878v-.002c0-1.113.285-2.16.786-3.07m0 0A5.995 5.995 0 0 1 12 12.75a5.995 5.995 0 0 1 5.058 2.772m0 0a3 3 0 1 0-3.225-4.125M12 6.75a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                />
              </svg>
              <p className="text-sm text-muted-foreground">
                {search ? "No users match your search" : "No users found"}
              </p>
              {search && (
                <p className="text-xs text-muted-foreground/70">
                  Try adjusting your search term
                </p>
              )}
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-card-foreground">
                      {user.name}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <div className="ml-2 flex flex-shrink-0 gap-2">
                    <RoleBadge role={user.role} />
                    <StatusBadge banned={user.banned} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <UserActions
                    user={user}
                    actionLoading={actionLoading}
                    onSetRole={handleSetRole}
                    onBan={handleBan}
                    onUnban={handleUnban}
                    onRemove={handleRemove}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - ADMIN_PAGE_SIZE))}
              className="min-h-[44px] rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={offset + ADMIN_PAGE_SIZE >= total}
              onClick={() => setOffset(offset + ADMIN_PAGE_SIZE)}
              className="min-h-[44px] rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function RoleBadge({ role }: { role: Role | null }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        role === ROLES.ADMIN
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {role ?? ROLES.USER}
    </span>
  );
}

function StatusBadge({ banned }: { banned: boolean | null }) {
  return banned ? (
    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
      Banned
    </span>
  ) : (
    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
      Active
    </span>
  );
}

function UserActions({
  user,
  actionLoading,
  onSetRole,
  onBan,
  onUnban,
  onRemove,
}: {
  user: User;
  actionLoading: string | null;
  onSetRole: (id: string, role: Role) => void;
  onBan: (id: string) => void;
  onUnban: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  if (actionLoading === user.id) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <svg
          className="h-3.5 w-3.5 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        Working...
      </span>
    );
  }

  const userName = user.name;

  return (
    <>
      <button
        onClick={() =>
          onSetRole(user.id, user.role === ROLES.ADMIN ? ROLES.USER : ROLES.ADMIN)
        }
        aria-label={`${user.role === ROLES.ADMIN ? "Demote" : "Make Admin"}: ${userName}`}
        className="min-h-[44px] rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
      >
        {user.role === ROLES.ADMIN ? "Demote" : "Make Admin"}
      </button>
      {user.banned ? (
        <button
          onClick={() => onUnban(user.id)}
          aria-label={`Unban ${userName}`}
          className="min-h-[44px] rounded-lg border border-green-300 px-3 py-2 text-xs font-medium text-green-700 transition-colors hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
        >
          Unban
        </button>
      ) : (
        <button
          onClick={() => onBan(user.id)}
          aria-label={`Ban ${userName}`}
          className="min-h-[44px] rounded-lg border border-amber-300 px-3 py-2 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
        >
          Ban
        </button>
      )}
      <button
        onClick={() => onRemove(user.id)}
        aria-label={`Remove ${userName}`}
        className="min-h-[44px] rounded-lg border border-red-300 px-3 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
      >
        Remove
      </button>
    </>
  );
}
