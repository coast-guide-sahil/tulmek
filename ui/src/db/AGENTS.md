# Database Layer

## Files
- `index.ts` — Drizzle client configured for Turso (libSQL)
- `schema.ts` — Database schema (user, session, account, verification tables)

## Schema — Admin Plugin Fields
The Better Auth admin plugin adds these fields to the `user` table:
- `role` — text, default "user" (matches `ROLES.USER` constant)
- `banned` — boolean, default false
- `banReason` — text, nullable
- `banExpires` — timestamp_ms, nullable

The admin plugin adds to the `session` table:
- `impersonatedBy` — text, nullable

## Provider
- Turso (SQLite cloud, libSQL protocol)
- Drizzle ORM with turso dialect
- To modify schema: edit `schema.ts`, then run `npm run db:push`
