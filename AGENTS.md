# tulmek

Monorepo: Turborepo + pnpm workspaces. Clean architecture (ports/adapters). Offline-first — no server, no auth, no DB.

**Knowledge Hub** — AI-powered interview prep content aggregator. 750+ articles from 7 sources (Reddit, HN, dev.to, LeetCode, Medium, GitHub, YouTube). 8 categories. TCRA proprietary ranking algorithm. Refreshed every 3 hours via GitHub Actions.

## Commands
- `pnpm dev` — Start dev server (Turbopack)
- `pnpm build` — Build all packages + apps
- `pnpm lint` — Lint all packages
- `pnpm typecheck` — Typecheck all packages
- `pnpm test` — Unit tests (Vitest)
- `pnpm e2e` — E2E tests (Playwright, from `apps/web`)
- `cd apps/web && pnpm validate-content` — Validate content JSON against Zod schemas
- `cd apps/web && pnpm fetch-hub-content` — Fetch fresh content from 7 sources

## NEVER
- Edit `CLAUDE.md` directly — it symlinks to `AGENTS.md`
- Use magic strings — constants live in `@tulmek/config/constants`
- Hardcode colors — use semantic tokens from `globals.css`
- Import adapter libraries (Orama, idb-keyval, Tiptap) outside `infrastructure/` — they are behind port interfaces

## ASK
- Before changing port interfaces in `packages/core/` — they're contracts
- Before modifying adapter wiring (`ProgressProvider` deps)

## ALWAYS
- 44px minimum touch targets (WCAG 2.2 AA)
- Sanitize any `dangerouslySetInnerHTML` with DOMPurify
- Run `pnpm validate-content` after content changes
- Use `workspace:*` protocol for internal package dependencies

## Environment Variables
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Public app URL |

## Documentation
- Single source of truth — each fact in ONE file, others reference it
- `AGENTS.md` is canonical — `CLAUDE.md` symlinks here
- Subdirectory `AGENTS.md` inherits parent rules implicitly — only override what differs
- Never duplicate info — add once, reference elsewhere
- Env vars: `AGENTS.md` table + `.env.example` + `DEPLOYMENT.md` matrix
- Architecture decisions: `docs/decisions/`
- Adapter swap guide: `docs/guides/swapping-providers.md`
