# tulmek

Monorepo: Turborepo + pnpm workspaces. Clean architecture (ports/adapters).

## Structure
- `apps/web/` — Next.js 16 application (App Router, Turbopack)
- `packages/core/` — Zero-dependency domain logic (entities, ports, use cases)
- `packages/config/` — Shared constants + type-safe env validation (t3-env + Zod)
- `packages/typescript-config/` — Shared tsconfig bases
- `packages/eslint-config/` — Shared ESLint configs

## Commands
- `pnpm dev` — Run all apps in dev mode
- `pnpm build` — Build all packages + apps
- `pnpm lint` — Lint all packages
- `pnpm typecheck` — Typecheck all packages
- `cd apps/web && pnpm db:push` — Push schema to Turso

## NEVER
- Edit `CLAUDE.md` directly (it's a symlink to `AGENTS.md`)
- Put secrets in `NEXT_PUBLIC_*` env vars
- Trust `getSessionCookie()` alone — always validate server-side
- Use `middleware.ts` — use `proxy.ts` instead (Next.js 16)
- Use magic strings — constants live in `@tulmek/config/constants`
- Hardcode colors — use semantic tokens from `globals.css`
- Import directly from infrastructure in pages — use composition root or lib/

## ASK
- Before changing port interfaces in `packages/core/` (they're contracts)
- Before modifying `composition-root.ts` wiring
- Before changing database schema

## ALWAYS
- `nextCookies()` MUST be the last plugin in Better Auth config
- Pass schema to drizzle adapter: `drizzleAdapter(db, { provider: "sqlite", schema })`
- `BETTER_AUTH_URL` must be set in ALL environments
- 44px minimum touch targets (WCAG 2.2 AA)
- Run `cd apps/web && pnpm db:push` after schema changes
- Use `workspace:*` protocol for internal package dependencies

## Stack
- Next.js 16.2.1 + Tailwind CSS v4 + TypeScript (strict)
- Better Auth 1.5.6 (email/password, admin plugin, pre-signup OTP, rate limited)
- Drizzle ORM 0.45.1 + Turso (SQLite cloud)
- mailchecker 6.0.20 (disposable email blocking)
- next-themes 0.4.6 (class-based dark mode)
- Turborepo + pnpm workspaces

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
- Single source of truth — each fact lives in ONE file, others reference it
- `AGENTS.md` (root) is the canonical config/conventions doc (`CLAUDE.md` symlinks here)
- Subdirectory `AGENTS.md` files scope context to that directory only
- Update docs when adding features, env vars, or changing architecture
- Never duplicate info across docs — add it once, link to it elsewhere
- Env vars: add to `AGENTS.md` table + `.env.example` + DEPLOYMENT.md matrix
- Keep each doc under 200 lines — split into subdirectory files if growing
