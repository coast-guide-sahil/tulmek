# ADR-002: Clean Architecture with Ports & Adapters

## Status
Accepted

## Context
Third-party packages (Orama, idb-keyval) were tightly coupled throughout the codebase. Swapping any required touching multiple files. A mobile app is planned that needs the same business logic.

## Decision
Adopt **ports and adapters** (hexagonal architecture):
- `@tulmek/core` — zero-dependency package with domain entities and port interfaces
- `apps/web/src/infrastructure/` — concrete adapters implementing the ports
- `apps/web/src/lib/progress/provider.tsx` — single file that wires adapters to ports (client-side)

## Consequences
- Swapping a provider (e.g., localStorage → cloud DB) requires only creating a new adapter and changing one line in the provider
- Mobile app imports `@tulmek/core` and provides its own adapters
- Business logic is testable without any infrastructure
- Slightly more files and indirection for simple operations
