<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Commands
- `pnpm dev` — Turbopack dev server
- `pnpm build` — Production build
- `pnpm lint` — ESLint
- `pnpm typecheck` — TypeScript check
- `pnpm db:push` — Push schema to Turso
- `pnpm db:studio` — Drizzle Studio GUI

## Architecture
- `src/app/` — Pages, layouts, API routes (THIN — delegates to use cases)
- `src/components/` — React UI components
- `src/infrastructure/` — Adapters implementing core ports
  - `auth/` — Better Auth config + adapter (implements AuthPort)
  - `database/drizzle/` — DB client, schema, user repository (implements UserRepository)
  - `email/` — Mailchecker adapter (implements EmailValidatorPort)
  - `composition-root.ts` — THE one file to change when swapping providers
- `src/lib/` — Auth re-export, client, session helper
- `src/proxy.ts` — Route protection (NOT middleware.ts)
- Standalone output enabled for Docker production builds
