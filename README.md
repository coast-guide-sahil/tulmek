# tulmek

Full-stack app with authentication, user management, and admin panel. Monorepo architecture for sharing business logic across web and future mobile apps.

## Stack

- **Framework**: Next.js 16.2.1 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4 (dark/light/system theme via next-themes)
- **Auth**: Better Auth 1.5.6 (email/password, admin plugin, rate limited)
- **Database**: Turso (SQLite cloud) + Drizzle ORM
- **Email validation**: mailchecker (55,734+ disposable domain blocklist)
- **Monorepo**: Turborepo + pnpm workspaces
- **CI**: GitHub Actions (lint, typecheck, build)
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
cd apps/web
cp .env.example .env.local         # fill in your values
pnpm db:push                       # push schema to Turso
cd ../..
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
│       │   ├── infrastructure/ # Adapters (auth, DB, email)
│       │   │   └── composition-root.ts  # Provider wiring
│       │   └── lib/            # Auth client, session helper
│       ├── Dockerfile          # Multi-stage with turbo prune
│       └── next.config.ts
├── packages/
│   ├── core/                   # Zero-dep domain logic
│   │   └── src/
│   │       ├── domain/         # Entities, branded types, errors
│   │       ├── ports/          # Interface contracts
│   │       └── use-cases/      # Business logic (returns Result)
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
| `TURSO_DATABASE_URL` | Turso database URL (`libsql://...`) | Yes |
| `TURSO_AUTH_TOKEN` | Turso auth token | Yes |
| `BETTER_AUTH_SECRET` | Auth secret (min 32 chars) | Yes |
| `BETTER_AUTH_URL` | App URL for auth cookies | Yes |
| `NEXT_PUBLIC_APP_URL` | Public app URL for client-side auth | Yes |
| `MAX_USERS` | Maximum allowed users (default: 100) | No |
| `ADMIN_EMAIL` | Email auto-promoted to admin on signup | No |
| `NEXT_PUBLIC_SKIP_AUTH` | Set to `true` for guest-only (preview deploys) | No |
| `REQUIRE_EMAIL_VERIFICATION` | `true` to require OTP email verification before signup | No |
| `RESEND_API_KEY` | Resend API key for sending OTP emails | No |
| `EMAIL_FROM` | Email sender (default: `TULMEK <onboarding@resend.dev>`) | No |

## Swapping Providers

The clean architecture makes provider swaps trivial — see [docs/guides/swapping-providers.md](docs/guides/swapping-providers.md).

| Swap | Steps |
|------|-------|
| Drizzle → Prisma | Create new adapter implementing `UserRepository`. Change 1 line in composition-root. |
| Better Auth → Clerk | Create new adapter implementing `AuthPort`. Change 1 line in composition-root. |
| Add mobile app | Create `apps/mobile/`. Import `@tulmek/core`. Create mobile-specific adapters. |

## Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the complete deployment guide.

## Security

- Rate limiting: 10 sign-ins/min, 5 sign-ups/min, 100 global/min
- Content Security Policy (no unsafe-eval)
- HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff
- Disposable email blocking (55,734+ domains)
- Non-root Docker user in production
- Read-only filesystem + no-new-privileges in Docker
