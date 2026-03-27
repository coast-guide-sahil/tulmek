<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Commands
- `pnpm validate-content` — Validate all content JSON (690 progress + 810 hub articles) against Zod schemas
- `pnpm fetch-hub-content` — Fetch fresh content from 6 sources (Reddit, HN, dev.to, Medium, GitHub, YouTube)
- `pnpm e2e` / `pnpm e2e:ui` — E2E tests (Playwright, 47 tests)

## Adapter Wiring
- **Progress** (progress, notes, search): `src/lib/progress/provider.tsx` via `deps` prop
- **Hub** (bookmarks, search, articles): `src/lib/hub/provider.tsx` via `deps` prop
- Swap any adapter by changing one line in the provider
- See `docs/guides/swapping-providers.md` for swap examples

## Ports (in `packages/core/src/ports/`)
ProgressStore, NoteStore, SearchEngine, ContentSource, ArticleSource, BookmarkStore, HubSearchEngine, ContentCategorizer

## Content
- `src/content/` — 690 progress tracker items validated by Zod schemas (`src/content/schema.ts`)
- `src/content/hub/` — 750+ aggregated articles from 7 sources validated by `src/content/hub-schema.ts`
- `src/lib/progress/content.ts` — sole importer of progress content
- `scripts/validate-content.ts` — CI validation script (validates both progress + hub)
- `scripts/fetch-hub-content.ts` — Content aggregation from 6 sources

## Hub Architecture
- `src/components/hub/` — 40+ composition-driven React components
- `src/lib/hub/ranking.ts` — TCRA proprietary ranking algorithm
- `src/lib/hub/store.ts` — Zustand store (bookmarks, read tracking, dismissed)
- `src/lib/hub/provider.tsx` — Hub context with adapter injection

## Non-Obvious Conventions
- All `dangerouslySetInnerHTML` MUST be sanitized via `src/lib/progress/sanitize.ts`
- Unit tests live alongside source files (`*.test.ts`)
- Standalone output enabled for Docker production builds
- React compiler strict mode — no `Date.now()` in render, no setState in effects
- 44px minimum touch targets (WCAG 2.2 AA)
- Content refresh: every 3 hours via GitHub Actions (`refresh-hub.yml`)
