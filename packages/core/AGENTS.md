# @tulmek/core

Zero-dependency pure TypeScript package. Shared by web + future mobile.

## NEVER
- Add runtime dependencies — must stay zero-dep
- Throw exceptions in use cases — return `Result<T, DomainError>` instead
- Import from `apps/` or other packages

## ALWAYS
- Use branded types for IDs and emails
- Export raw `.ts` files — no build step, consumers transpile
