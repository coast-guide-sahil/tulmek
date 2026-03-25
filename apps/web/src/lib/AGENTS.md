# Auth Library

## Files
- `auth.ts` — Re-exports auth from infrastructure/composition-root
- `auth-client.ts` — Client-side auth hooks (signIn, signOut, signUp, useSession) + adminClient plugin
- `session.ts` — Server-side session validation helper (`getServerSession()`)

## Notes
- Constants moved to `@tulmek/config/constants`
- Auth config moved to `src/infrastructure/auth/better-auth.config.ts`
- Composition root at `src/infrastructure/composition-root.ts`
