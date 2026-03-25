# tulmek

Monorepo: Turborepo + pnpm workspaces. Clean architecture (ports/adapters).

## Commands
- `pnpm dev` — Start dev server (Turbopack)
- `pnpm build` — Build all packages + apps
- `pnpm lint` — Lint all packages
- `pnpm typecheck` — Typecheck all packages
- `pnpm test` — Unit tests (Vitest)
- `pnpm e2e` — E2E tests (Playwright, from `apps/web`)
- `cd apps/web && pnpm db:push` — Push schema changes to Turso
- `cd apps/web && pnpm validate-content` — Validate content JSON against Zod schemas

## NEVER
- Edit `CLAUDE.md` directly — it symlinks to `AGENTS.md`
- Put secrets in `NEXT_PUBLIC_*` env vars
- Trust `getSessionCookie()` alone — always validate server-side
- Use `middleware.ts` — use `proxy.ts` instead (Next.js 16)
- Use magic strings — constants live in `@tulmek/config/constants`
- Hardcode colors — use semantic tokens from `globals.css`
- Import from `infrastructure/` in pages/components — go through `composition-root.ts` (server) or `lib/progress/provider.tsx` (client)
- Import adapter libraries (Orama, idb-keyval, Tiptap, Drizzle, Better Auth) outside `infrastructure/` — they are behind port interfaces

## ASK
- Before changing port interfaces in `packages/core/` — they're contracts
- Before modifying adapter wiring (`composition-root.ts`, `ProgressProvider` deps)
- Before changing database schema

## ALWAYS
- `nextCookies()` MUST be the last plugin in Better Auth config
- Pass schema to drizzle adapter: `drizzleAdapter(db, { provider: "sqlite", schema })`
- `BETTER_AUTH_URL` must be set in ALL environments
- 44px minimum touch targets (WCAG 2.2 AA)
- Sanitize any `dangerouslySetInnerHTML` with DOMPurify
- Run `pnpm db:push` after schema changes, `pnpm validate-content` after content changes
- Use `workspace:*` protocol for internal package dependencies

## Environment Variables
| Variable | Description |
|----------|-------------|
| `TURSO_DATABASE_URL` | Turso database URL (`libsql://...`) |
| `TURSO_AUTH_TOKEN` | Turso auth token |
| `BETTER_AUTH_SECRET` | Auth secret (min 32 chars) |
| `BETTER_AUTH_URL` | App URL for auth cookies |
| `NEXT_PUBLIC_APP_URL` | Public app URL for client-side auth |
| `MAX_USERS` | Maximum allowed users (default: 100) |
| `ADMIN_EMAIL` | Email auto-promoted to admin on signup |
| `NEXT_PUBLIC_SKIP_AUTH` | `true` to hide auth UI — used for preview deploys |
| `REQUIRE_EMAIL_VERIFICATION` | `true` to require OTP email verification before signup |
| `RESEND_API_KEY` | Resend API key for sending OTP emails |
| `EMAIL_FROM` | Email sender (default: `TULMEK <onboarding@resend.dev>`) |

## Documentation
- Single source of truth — each fact in ONE file, others reference it
- `AGENTS.md` is canonical — `CLAUDE.md` symlinks here
- Subdirectory `AGENTS.md` inherits parent rules implicitly — only override what differs
- Never duplicate info — add once, reference elsewhere
- Env vars: `AGENTS.md` table + `.env.example` + `DEPLOYMENT.md` matrix
- Architecture decisions: `docs/decisions/`
- Adapter swap guide: `docs/guides/swapping-providers.md`
