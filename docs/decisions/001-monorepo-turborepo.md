# ADR-001: Monorepo with Turborepo + pnpm Workspaces

## Status
Accepted

## Context
The tulmek app needs to share business logic with a planned mobile app. A monorepo structure allows code sharing without publishing packages. We evaluated Turborepo vs Nx.

## Decision
Use **Turborepo** with **pnpm workspaces**:
- Turborepo is the standard for Next.js projects (same company — Vercel)
- pnpm provides strict dependency isolation and fastest install times
- `turbo prune --docker` enables efficient Docker builds
- Zero config for simple use cases; `tasks` key in `turbo.json`

## Consequences
- All packages must use `workspace:*` protocol for internal dependencies
- CI must use `pnpm install --frozen-lockfile` instead of `npm ci`
- Docker builds use multi-stage with `turbo prune` for minimal images
- New packages added to `packages/` or `apps/` are auto-discovered
