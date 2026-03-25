# @tulmek/core

Zero-dependency pure TypeScript package. Shared by web + future mobile.

## Exports
- `@tulmek/core/domain` — User, Session, branded types, DomainErrors, ContentItem, ProgressEntry, Note
- `@tulmek/core/ports` — AuthPort, UserRepository, EmailValidatorPort, EmailPort, ProgressStore, NoteStore, SearchEngine, ContentSource
- `@tulmek/core/use-cases` — createValidateSignup
- `@tulmek/core/result` — Result<T, E>, Ok(), Err()

## NEVER
- Add runtime dependencies (must stay zero-dep)
- Throw exceptions in use cases (return Result instead)
- Import from apps/ or other packages (except types)

## ALWAYS
- Use branded types for IDs and emails
- Return `Result<T, DomainError>` from use cases
- Export raw `.ts` files (no build step — consumers transpile)
