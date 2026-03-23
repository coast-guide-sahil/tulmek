<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Commands
- `npm run dev` — Turbopack dev server
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm run db:push` — Push schema to Turso
- `npm run db:studio` — Drizzle Studio GUI

## Architecture
- `src/db/` — Drizzle client + schema
- `src/lib/auth.ts` — Server-side auth (rate limited)
- `src/lib/auth-client.ts` — Client auth hooks
- `src/app/api/auth/[...all]/route.ts` — Auth API handler
- Standalone output enabled for Docker production builds
