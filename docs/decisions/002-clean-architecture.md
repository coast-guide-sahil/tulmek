# ADR-002: Clean Architecture with Ports & Adapters

## Status
Accepted

## Context
Third-party packages (Better Auth, Drizzle, mailchecker) were tightly coupled throughout the codebase. Swapping any required touching multiple files. A mobile app is planned that needs the same business logic.

## Decision
Adopt **ports and adapters** (hexagonal architecture):
- `@tulmek/core` — zero-dependency package with domain entities, port interfaces, and use cases
- `apps/web/src/infrastructure/` — concrete adapters implementing the ports
- `apps/web/src/infrastructure/composition-root.ts` — single file that wires adapters to ports

## Consequences
- Swapping a provider (e.g., Drizzle → Prisma) requires only creating a new adapter and changing one line in composition-root
- Mobile app imports `@tulmek/core` and provides its own adapters
- Business logic in use cases is testable without any infrastructure
- Slightly more files and indirection for simple operations
