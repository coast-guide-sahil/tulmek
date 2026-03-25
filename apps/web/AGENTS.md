<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Commands
- `pnpm validate-content` — Validate content JSON against Zod schemas
- `pnpm e2e` / `pnpm e2e:ui` — E2E tests (Playwright)

## Adapter Wiring
- **Client-side** (progress, notes, search): `src/lib/progress/provider.tsx` via `deps` prop
- Swap any adapter by changing one line in the provider
- See `docs/guides/swapping-providers.md` for swap examples

## Ports (in `packages/core/src/ports/`)
ProgressStore, NoteStore, SearchEngine, ContentSource

## Content
- `src/content/` — 690 JSON items validated by Zod schemas (`src/content/schema.ts`)
- `src/lib/progress/content.ts` — sole importer of content, implements ContentSource port
- `scripts/validate-content.ts` — CI validation script

## Non-Obvious Conventions
- All `dangerouslySetInnerHTML` MUST be sanitized via `src/lib/progress/sanitize.ts`
- Unit tests live alongside source files (`*.test.ts`)
- Standalone output enabled for Docker production builds
