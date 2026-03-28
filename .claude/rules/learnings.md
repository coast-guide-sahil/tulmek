---
description: "Accumulated agent learnings from past mistakes — auto-loaded every session"
---

# Agent Learnings

Rules below were discovered through real mistakes. Each entry includes the
date, what went wrong, and the fix. When the root cause is fixed in code
(linter rule, better types, etc.), delete the entry.

## Active

### 2026-03-28 | architecture | No data duplication between apps
NEVER copy content data (feed.json, metadata.json) between apps. Use a shared
`@tulmek/content` package. All apps import from the same source of truth.
Root-cause fix: DONE -- created `packages/content/` in sprint 104.

### 2026-03-28 | architecture | Research before implementing
ALWAYS search the web for latest best practices before writing ANY code.
Things change by the minute in March 2026. Never assume. This applies to
every decision — not just code, but architecture, UX, content strategy.

### 2026-03-28 | monorepo | Relative imports across apps are wrong
Do NOT import from sibling apps via relative paths (../../web/src/...).
Use shared packages in `packages/`. Turborepo cannot track invisible
cross-app dependencies, breaking caching and task scheduling.
Root-cause fix: DONE -- `@tulmek/content` package.

### 2026-03-28 | constants | No magic numbers
All thresholds, time constants, and storage keys must be in
`@tulmek/config/constants` — not hardcoded in components or adapters.
Root-cause fix: IN PROGRESS -- sprint 106-107.

### 2026-03-28 | types | Use `as const satisfies` for config maps
All `Record<string, X>` config objects should use `as const satisfies Record<UnionType, X>`
to catch missing keys at compile time. Applies to ranking weights, half-lives, source credibility.
Root-cause fix: IN PROGRESS -- sprint 107.

### 2026-03-28 | licensing | Repo is MIT open source
Never use "proprietary" language in docs or comments. The repo is MIT-licensed.
Root-cause fix: DONE -- sprint 103.

### 2026-03-28 | testing | Scope e2e selectors carefully
When adding new UI sections (Today's Brief, Company Filter), existing e2e
selectors may match multiple elements. Scope selectors to specific ARIA
landmarks (e.g., `getByRole("toolbar", { name: "Filter by category" })`).
Root-cause fix: DONE -- sprint 104 fixed DSA button selector.

### 2026-03-28 | commit | Lowercase subject for commitlint
Commit message subjects must be lowercase (commitlint subject-case rule).
"feat: TCRA v2" fails, "feat: tcra v2" passes.

### 2026-03-28 | testing | NEVER skip mobile live test
inotify limit (65536) blocks Metro on Linux. After any system crash/reboot,
ALWAYS check `cat /proc/sys/fs/inotify/max_user_watches` and ask user to run
`sudo sysctl -w fs.inotify.max_user_watches=524288` BEFORE attempting mobile test.
Do NOT merge PRs with "inotify blocked" as an excuse — wait for the fix.
Root-cause fix: TODO — add to /etc/sysctl.conf for persistence across reboots.

### 2026-03-28 | docs | Never write install links that don't exist
Do NOT write download links, store URLs, or website URLs in README unless
the actual deployment/release exists and has been verified. Placeholder links
like "Coming soon" or links to empty GitHub Releases pages are misleading.
Only document what is LIVE and WORKING right now.
Root-cause fix: N/A — this is a permanent principle.

### 2026-03-28 | ci | EVERY CI failure must be fixed immediately
NEVER dismiss CI failures as "expected" or "not our fault." Every red check
is a problem. Fix it, disable the check, or make it pass — but never ignore it.
Desktop build failures, mobile typecheck failures, rate limits — ALL must be
addressed before merging. This includes failures in workflows that "only run
on tags" but still show as PR checks.
Root-cause fix: N/A — this is a permanent principle.

### 2026-03-28 | git | Always stage file deletions when moving files
When moving files (e.g., `app/index.tsx` → `app/(tabs)/index.tsx`), the
deletions of the old files must be explicitly staged with `git add` or
`git rm`. Unstaged deletions persist in git and CI checks the stale copies.
Root-cause fix: N/A — permanent principle.

## Resolved (delete after 30 days)

(none yet)
