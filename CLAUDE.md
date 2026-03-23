@ui/AGENTS.md
@ui/CLAUDE.md

# Project: interview-prep

## Structure
- `ui/` — Next.js 16 application (App Router, Turbopack)
- `docker-compose.yml` — Dev (hot reload) and prod Docker profiles

## Quick Start
- Local dev: `cd ui && npm run dev`
- Docker dev: `docker compose --profile dev up --build`
- Docker prod: `docker compose --profile prod up --build`

## Stack
- Next.js 16.2.1 + Tailwind CSS v4 + TypeScript
- Better Auth 1.5.5 (email/password, rate limited)
- Drizzle ORM 0.45.1 + Turso (SQLite cloud)
- Vercel (production deploy, auto-deploy from GitHub main)

## Key Conventions
- Use `proxy.ts` for route protection (NOT middleware.ts — Next.js 16 change)
- `nextCookies()` MUST be the last plugin in Better Auth config
- `BETTER_AUTH_URL` must be set in ALL environments
- Never put secrets in `NEXT_PUBLIC_*` env vars
- After schema changes: run `cd ui && npm run db:push`
