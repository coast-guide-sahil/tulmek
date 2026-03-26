# @tulmek/core

Zero-dependency pure TypeScript package. Shared by web + future mobile.

## NEVER
- Add runtime dependencies — must stay zero-dep
- Import from `apps/` or other packages

## ALWAYS
- Export raw `.ts` files — no build step, consumers transpile
