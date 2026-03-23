# Lib — Shared Utilities

## Authentication
- `auth.ts` — Server-side Better Auth instance (Drizzle adapter, SQLite/Turso)
- `auth-client.ts` — Client-side auth hooks (signIn, signOut, signUp, useSession)

## Auth Architecture
- Better Auth 1.5.5+ with email/password
- Session stored in cookies via `nextCookies()` plugin
- Rate limiting enabled on auth endpoints (3 sign-ins/10s, 5 sign-ups/60s)
- API route: `/api/auth/[...all]` handles all auth requests
- For route protection, use `proxy.ts` (NOT middleware.ts — Next.js 16 change)

## Important
- `nextCookies()` MUST always be the last plugin in the plugins array
- `BETTER_AUTH_URL` must be set in all environments to avoid cookie Secure flag bypass
- Never use `getSessionCookie()` alone for auth checks — always validate server-side
- Schema must be passed to drizzle adapter: `drizzleAdapter(db, { provider: "sqlite", schema })`
