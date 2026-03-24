# Auth Library

## Files
- `auth.ts` — Server-side Better Auth instance (Drizzle adapter, admin plugin, mailchecker, databaseHooks)
- `auth-client.ts` — Client-side auth hooks (signIn, signOut, signUp, useSession) + adminClient plugin
- `session.ts` — Server-side session validation helper (`getServerSession()`)
- `constants.ts` — Centralized config: ROLES, RATE_LIMIT, ERROR_MESSAGES, ADMIN_PAGE_SIZE, PASSWORD_MIN_LENGTH, APP_NAME

## Rules
- `nextCookies()` MUST be the last plugin in the plugins array
- Schema must be passed to adapter: `drizzleAdapter(db, { provider: "sqlite", schema })`
- Rate limits (from constants.ts): 10 sign-ins/60s, 5 sign-ups/60s, 100 global/60s

## databaseHooks (user.create.before)
Runs on every user creation (any auth method). Order of checks:
1. **Disposable email check** — `MailChecker.isValid()` rejects temporary/disposable emails
2. **Max user limit** — `MAX_USERS` env var (default 100), blocks signup when reached
3. **Admin auto-promote** — `ADMIN_EMAIL` env var, assigns admin role on signup
