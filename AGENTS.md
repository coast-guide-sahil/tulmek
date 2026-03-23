# interview-prep

## Structure
- `ui/` — Next.js 16 application (App Router, Turbopack)
- `docker-compose.yml` — Dev (hot reload) and prod Docker profiles

## Quick Start
- Local dev: `cd ui && npm run dev`
- Docker dev: `docker compose --profile dev up --build`
- Docker prod: `docker compose --profile prod up --build`

## Stack
- Next.js 16.2.1 + Tailwind CSS v4 + TypeScript
- Better Auth 1.5.6 (email/password, rate limited)
- Drizzle ORM 0.45.1 + Turso (SQLite cloud)
- Vercel (production deploy, auto-deploy from GitHub main)

## Conventions
- Use `proxy.ts` for route protection (NOT middleware.ts — Next.js 16 change)
- `nextCookies()` MUST be the last plugin in Better Auth config
- `BETTER_AUTH_URL` must be set in ALL environments
- Never put secrets in `NEXT_PUBLIC_*` env vars
- After schema changes: run `cd ui && npm run db:push`
- Schema must be passed to drizzle adapter: `drizzleAdapter(db, { provider: "sqlite", schema })`
- Never trust `getSessionCookie()` alone — always validate server-side

## Documentation
All agent documentation lives in `AGENTS.md` files. CLAUDE.md files are symlinks to AGENTS.md.
- Edit `AGENTS.md` — never edit `CLAUDE.md` directly
- Folder-level `AGENTS.md` files contain only folder-specific context
- See README.md § "Documentation" for the full policy
