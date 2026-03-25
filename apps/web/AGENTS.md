<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Commands
- `pnpm dev` — Turbopack dev server
- `pnpm build` — Production build
- `pnpm lint` — ESLint
- `pnpm typecheck` — TypeScript check
- `pnpm test` — Unit tests (Vitest)
- `pnpm e2e` — E2E tests (Playwright)
- `pnpm validate-content` — Validate content JSON against Zod schemas
- `pnpm db:push` — Push schema to Turso
- `pnpm db:studio` — Drizzle Studio GUI

## Architecture
- `src/app/` — Pages, layouts, API routes (THIN — delegates to use cases)
- `src/components/` — React UI components
- `src/infrastructure/` — Adapters implementing core ports
  - `auth/` — Better Auth config + adapter (implements AuthPort)
  - `database/drizzle/` — DB client, schema, user repository (implements UserRepository)
  - `email/` — Mailchecker adapter (EmailValidatorPort) + Resend OTP sender
  - `storage/` — LocalStorage (ProgressStore) + IndexedDB (NoteStore) adapters
  - `search/` — Orama adapter (SearchEngine port)
  - `composition-root.ts` — Server-side adapter wiring (auth, DB, email)
- `src/lib/` — Auth re-export, client, session helper, OTP hashing, rate limiter
  - `progress/` — Client-side wiring: Zustand store, ProgressProvider (adapters injected via deps prop), content adapter, DOMPurify sanitizer
- `src/content/` — 690 JSON items (28 DSA patterns + HLD + LLD + behavioral) + Zod schemas
- `src/proxy.ts` — Route protection (NOT middleware.ts)
- `e2e/` — Playwright E2E tests (health, navigation, progress tracker)
- `scripts/validate-content.ts` — CI content validation against Zod schemas
- Unit tests live alongside source files (`*.test.ts`)
- Standalone output enabled for Docker production builds

## Progress Tracker Ports (in `packages/core/src/ports/`)
- `ProgressStore` — read/write completion state (adapter: localStorage)
- `NoteStore` — read/write markdown notes (adapter: IndexedDB via idb-keyval)
- `SearchEngine` — index + search items (adapter: Orama client-side)
- `ContentSource` — load content data (adapter: static JSON files)
- All injected via `ProgressProvider` deps prop — swap by changing one line
