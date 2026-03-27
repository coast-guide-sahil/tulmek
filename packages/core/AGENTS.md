# @tulmek/core

Zero-dependency pure TypeScript package. Shared by web, mobile, and desktop.

## Exports
- `@tulmek/core/domain` — Types (FeedArticle, HubCategory, etc.), TCRA ranking, hub utilities
- `@tulmek/core/ports` — Interface contracts (8 ports: BookmarkStore, SearchEngine, etc.)
- `@tulmek/core/result` — Result type utility

## NEVER
- Add runtime dependencies — must stay zero-dep
- Import from `apps/` or other packages (except type-only from itself)
- Put platform-specific code here (no DOM, no React Native, no Node.js APIs)

## ALWAYS
- Export raw `.ts` files — no build step, consumers transpile
- Keep functions pure — no side effects, no global state
