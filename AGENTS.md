# interview-prep

## Structure
- `ui/` — Next.js 16 application (App Router, Turbopack)
- `docker-compose.yml` — Dev (hot reload) and prod Docker profiles
- `.github/workflows/ci.yml` — CI pipeline (lint, typecheck, build)

## Quick Start
- Local dev: `cd ui && npm run dev`
- Docker dev: `docker compose --profile dev up --build`
- Docker prod: `docker compose --profile prod up --build`

## Stack
- Next.js 16.2.1 + Tailwind CSS v4 + TypeScript
- Better Auth 1.5.6 (email/password, admin plugin, rate limited)
- Drizzle ORM 0.45.1 + Turso (SQLite cloud)
- mailchecker 6.0.20 (disposable email blocking — 55,734+ domains)
- next-themes 0.4.6 (dark/light/system theme, class-based strategy)
- Vercel (production deploy, auto-deploy from GitHub main)
- GitHub Actions CI (lint + typecheck + build on every PR)

## Conventions
- Use `proxy.ts` for route protection (NOT middleware.ts — Next.js 16 change)
- `nextCookies()` MUST be the last plugin in Better Auth config
- `BETTER_AUTH_URL` must be set in ALL environments
- Never put secrets in `NEXT_PUBLIC_*` env vars
- After schema changes: run `cd ui && npm run db:push`
- Schema must be passed to drizzle adapter: `drizzleAdapter(db, { provider: "sqlite", schema })`
- Never trust `getSessionCookie()` alone — always validate server-side
- All roles, rate limits, error messages, and config values live in `src/lib/constants.ts` — no magic strings or numbers
- Use semantic CSS variable tokens from `globals.css` — no hardcoded colors
- All interactive elements must have 44px minimum touch targets (WCAG 2.2 AA)

## Environment Variables
| Variable | Description |
|----------|-------------|
| `TURSO_DATABASE_URL` | Turso database URL (`libsql://...`) |
| `TURSO_AUTH_TOKEN` | Turso auth token (non-expiring) |
| `BETTER_AUTH_SECRET` | Auth secret (min 32 chars) |
| `BETTER_AUTH_URL` | App URL for auth cookies |
| `NEXT_PUBLIC_APP_URL` | Public app URL for client-side auth |
| `MAX_USERS` | Maximum allowed users (default: 100) |
| `ADMIN_EMAIL` | Email auto-promoted to admin on signup |
| `NEXT_PUBLIC_SKIP_AUTH` | Set to `true` to hide auth UI (guest-only view) — used for preview deploys |

## Documentation
All agent documentation lives in `AGENTS.md` files. CLAUDE.md files are symlinks to AGENTS.md.
- **Edit `AGENTS.md` — never edit `CLAUDE.md` directly**
- **Global info goes in root AGENTS.md only** — stack, conventions, env vars, commands
- **Folder-level `AGENTS.md` files contain only folder-specific context** — don't repeat global info
- **One change, one place** — update a convention in root AGENTS.md and it's done everywhere
- See README.md § "Documentation" for the full policy
