# tulmek

Offline-first interview prep tracker with progress tracking, notes, and search. Monorepo architecture for sharing business logic across web and future mobile apps.

## Stack

- **Framework**: Next.js 16.2.1 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4 (dark/light/system theme via next-themes)
- **Storage**: Browser-local (localStorage + IndexedDB)
- **Search**: Orama (client-side full-text search)
- **Monorepo**: Turborepo + pnpm workspaces
- **CI**: GitHub Actions (lint, typecheck, build, E2E)
- **Deployment**: Vercel (auto-deploy from GitHub main)
- **Containerization**: Docker (dev with hot reload + production via turbo prune)

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm 10+ (enable with `corepack enable`)
- Docker (optional)

### Local Development

```bash
corepack enable
pnpm install
pnpm dev                           # start all apps at http://localhost:3000
```

### Docker Development (hot reload)

```bash
cp .env.example .env
docker compose --profile dev up --build
```

### Docker Production

```bash
docker compose --profile prod up --build
```

## Project Structure

```
├── apps/
│   └── web/                    # Next.js 16 application
│       ├── src/
│       │   ├── app/            # Pages, layouts, API routes (thin)
│       │   ├── components/     # React UI components
│       │   ├── infrastructure/ # Adapters (search, storage)
│       │   └── lib/            # Progress provider, content, utilities
│       ├── Dockerfile          # Multi-stage with turbo prune
│       └── next.config.ts
├── packages/
│   ├── core/                   # Zero-dep domain logic
│   │   └── src/
│   │       ├── domain/         # Entities and types
│   │       └── ports/          # Interface contracts
│   ├── config/                 # Shared constants + env validation
│   ├── typescript-config/      # Shared tsconfig bases
│   └── eslint-config/          # Shared ESLint configs
├── docs/
│   ├── decisions/              # Architecture Decision Records
│   └── guides/                 # Deployment, setup, swapping providers
├── turbo.json                  # Task pipeline config
├── pnpm-workspace.yaml
└── docker-compose.yml
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_APP_URL` | Public app URL | No |

## Swapping Providers

The clean architecture makes provider swaps trivial — see [docs/guides/swapping-providers.md](docs/guides/swapping-providers.md).

| Swap | Steps |
|------|-------|
| localStorage → cloud DB | Create new adapter implementing `ProgressStore`. Update `deps` in `ProgressProvider`. |
| IndexedDB → cloud storage | Create new adapter implementing `NoteStore`. Update `deps` in `ProgressProvider`. |
| Orama → server search | Create new adapter implementing `SearchEngine`. Update `deps` in `ProgressProvider`. |
| Add mobile app | Create `apps/mobile/`. Import `@tulmek/core`. Create mobile-specific adapters. |

## Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the complete deployment guide.

## Security

- Content Security Policy (no unsafe-eval in production)
- HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff
- Non-root Docker user in production
- Read-only filesystem + no-new-privileges in Docker
