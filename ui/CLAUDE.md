@AGENTS.md

## Project-Specific Context

### Stack
- Better Auth 1.5.5+ with Drizzle adapter (SQLite/Turso)
- Rate limiting enabled on auth endpoints
- Standalone output for Docker production builds

### Key Commands
- `npm run dev` — Turbopack dev server
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm run db:push` — Push schema to Turso
- `npm run db:studio` — Drizzle Studio GUI

### Architecture
- `src/db/` — Drizzle client + schema
- `src/lib/auth.ts` — Server-side auth (rate limited)
- `src/lib/auth-client.ts` — Client auth hooks
- `src/app/api/auth/[...all]/route.ts` — Auth API
- Use `proxy.ts` for route protection (NOT middleware.ts)

### Security Rules
- `nextCookies()` MUST be last plugin in Better Auth
- `BETTER_AUTH_URL` must be set in ALL environments
- Never trust `getSessionCookie()` alone — validate server-side
- Never put secrets in `NEXT_PUBLIC_*` vars
- Schema must be passed to drizzle adapter
