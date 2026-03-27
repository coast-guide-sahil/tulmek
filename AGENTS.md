# tulmek

Monorepo: Turborepo + pnpm workspaces. Clean architecture (ports/adapters). Offline-first — no server, no auth, no DB.

**Knowledge Hub** — AI-powered interview prep content aggregator. 750+ articles from 7 sources. TCRA multi-signal ranking. Refreshed every 3 hours.

**Cross-platform**: Web (Next.js 16), Desktop (Tauri v2), Mobile (Expo SDK 55 / React Native 0.83). Code shared via `packages/core` — add once, ship everywhere.

## Commands
- `pnpm dev` — Start web dev server (Turbopack, port 3000)
- `pnpm build` — Build all packages + apps
- `pnpm lint` — Lint all packages
- `pnpm typecheck` — Typecheck all packages
- `pnpm test` — Unit tests (Vitest)
- `pnpm e2e` — E2E tests (Playwright, 47 tests, from `apps/web`)
- `cd apps/web && pnpm validate-content` — Validate content JSON against Zod schemas
- `cd apps/web && pnpm fetch-hub-content` — Fetch fresh content from 7 sources
- `cd apps/desktop && pnpm dev` — Launch Tauri desktop (requires web dev server running)
- `cd apps/mobile && pnpm dev` — Start Expo Metro bundler

## NEVER
- Edit `CLAUDE.md` directly — it symlinks to `AGENTS.md`
- Use magic strings — constants live in `@tulmek/config/constants`
- Hardcode colors — use semantic tokens from `globals.css` (web) or `@tulmek/ui` (shared)
- Import adapter libraries (Orama, idb-keyval, Tiptap) outside `infrastructure/` — they are behind port interfaces
- Add dependencies to `@tulmek/core` — it must remain zero-dep
- Import from `apps/` inside `packages/` — dependencies flow downward only

## ASK
- Before changing port interfaces in `packages/core/ports/` — they're contracts shared by all platforms
- Before modifying adapter wiring (`ProgressProvider` or `HubProvider` deps)

## ALWAYS
- 44px minimum touch targets (WCAG 2.2 AA) on all platforms
- Sanitize any `dangerouslySetInnerHTML` with DOMPurify
- Run `pnpm validate-content` after content changes
- Use `workspace:*` protocol for internal package dependencies
- Test all 3 platforms (web, desktop, mobile) before merging PRs
- Put shared logic in `packages/core/src/domain/` — platform-specific code stays in `apps/`

## Code Sharing Architecture
```
packages/core/domain/     → Types, TCRA ranking, hub utils (ALL platforms)
packages/core/ports/      → Interface contracts (ALL platforms)
packages/config/          → Constants, env validation (ALL platforms)
packages/ui/              → Theme tokens, category colors (ALL platforms)
apps/web/infrastructure/  → Web adapters (localStorage, Orama)
apps/web/components/      → Web UI (React + Tailwind)
apps/mobile/app/          → Mobile screens (React Native)
apps/desktop/src-tauri/   → Desktop backend (Rust)
```

## Environment Variables
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Public app URL |
| `ANDROID_HOME` | Android SDK path (mobile development) |

## Documentation
- Single source of truth — each fact in ONE file, others reference it
- `AGENTS.md` is canonical — `CLAUDE.md` symlinks here
- Subdirectory `AGENTS.md` inherits parent rules implicitly — only override what differs
- Never duplicate info — add once, reference elsewhere
- Architecture decisions: `docs/decisions/`
- Adapter swap guide: `docs/guides/swapping-providers.md`
- Platform setup: `README.md` (Developer Setup section)

## Agent Self-Improvement Protocol

When you encounter a non-obvious mistake, unexpected behavior, or discover
a convention not documented anywhere:

1. Fix the immediate problem
2. Append a dated entry to `.claude/rules/learnings.md` under `## Active`
3. Include: date, area tag, what went wrong, the correct approach
4. If the root cause can be fixable (linter rule, better types, rename),
   note it as "Root-cause fix: TODO — [description]"
5. When a root-cause fix is implemented, move entry to `## Resolved`

Do NOT add learnings that the agent can discover by reading code.
Only add things that are genuinely surprising or non-obvious.
The goal: this file SHRINKS over time as root causes are fixed.
