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

## Resolved (delete after 30 days)

(none yet)
