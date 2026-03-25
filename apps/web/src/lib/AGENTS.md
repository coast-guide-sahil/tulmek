# lib/

## Files
- `auth.ts` — Re-exports auth from infrastructure/composition-root
- `auth-client.ts` — Client-side auth hooks (signIn, signOut, signUp, useSession) + adminClient plugin
- `session.ts` — Server-side session validation helper (`getServerSession()`)
- `otp.ts` — SHA-256 OTP hashing (used by pre-signup flow)
- `rate-limit.ts` — In-memory sliding-window rate limiter for custom API routes

## Notes
- Constants in `@tulmek/config/constants`
- Auth config at `src/infrastructure/auth/better-auth.config.ts`
- Composition root at `src/infrastructure/composition-root.ts`
