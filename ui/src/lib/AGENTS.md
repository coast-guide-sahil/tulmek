# Auth Library

## Files
- `auth.ts` — Server-side Better Auth instance (Drizzle adapter, SQLite/Turso)
- `auth-client.ts` — Client-side auth hooks (signIn, signOut, signUp, useSession)

## Rules
- `nextCookies()` MUST be the last plugin in the plugins array
- Schema must be passed to adapter: `drizzleAdapter(db, { provider: "sqlite", schema })`
- Rate limits: 3 sign-ins/10s, 5 sign-ups/60s, 100 global/60s
