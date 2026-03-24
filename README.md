# interview-prep

Full-stack Next.js 16 application with authentication, user management, and admin panel.

## Stack

- **Framework**: Next.js 16.2.1 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4 (dark/light/system theme via next-themes)
- **Auth**: Better Auth 1.5.6 (email/password, admin plugin, rate limited)
- **Database**: Turso (SQLite cloud) + Drizzle ORM
- **Email validation**: mailchecker (55,734+ disposable domain blocklist)
- **CI**: GitHub Actions (lint, typecheck, build on every PR)
- **Deployment**: Vercel (auto-deploy from GitHub main)
- **Containerization**: Docker (dev with hot reload + production)

## Features

- **Sign up / Sign in** — email/password with password strength meter, show/hide toggle
- **Disposable email blocking** — client-side instant warning + server-side enforcement
- **Admin panel** — user list, search, role management, ban/unban, remove
- **Max user limit** — configurable cap enforced at API level
- **Guest mode** — skip login option, or `NEXT_PUBLIC_SKIP_AUTH=true` for preview deploys
- **Dark/light/system theme** — three-way toggle, persisted
- **Responsive** — 320px to ultrawide, card layout on mobile, table on desktop
- **Accessible** — WCAG 2.2 AA (44px touch targets, aria attributes, focus management)
- **Security hardened** — CSP, HSTS, rate limiting, no X-Powered-By

## Getting Started

### Prerequisites

- Node.js 20.9+
- npm 10+
- Docker (optional, for containerized development)

### Local Development

```bash
cd ui
cp .env.example .env.local         # fill in your values
npm install
npm run db:push                    # push schema to Turso
npm run dev                        # start dev server at http://localhost:3000
```

### Docker Development (hot reload)

```bash
cp .env.example .env               # fill in your values
docker compose --profile dev up --build
# Edit files in ui/src/ — changes reflect instantly
```

### Docker Production

```bash
docker compose --profile prod up --build
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TURSO_DATABASE_URL` | Turso database URL (`libsql://...`) | Yes |
| `TURSO_AUTH_TOKEN` | Turso auth token (non-expiring) | Yes |
| `BETTER_AUTH_SECRET` | Auth secret (min 32 chars, `openssl rand -base64 32`) | Yes |
| `BETTER_AUTH_URL` | App URL for auth cookies | Yes |
| `NEXT_PUBLIC_APP_URL` | Public app URL for client-side auth | Yes |
| `MAX_USERS` | Maximum allowed users (default: 100) | No |
| `ADMIN_EMAIL` | Email auto-promoted to admin on signup | No |
| `NEXT_PUBLIC_SKIP_AUTH` | Set to `true` to hide auth UI (guest-only) | No |

## Database Commands

```bash
cd ui
npm run db:push      # push schema to database
npm run db:generate  # generate migration files
npm run db:migrate   # run migrations
npm run db:studio    # open Drizzle Studio GUI
```

## Project Structure

```
├── AGENTS.md              # AI agent docs (single source of truth)
├── CLAUDE.md → AGENTS.md  # symlink (Claude Code reads this)
├── README.md              # human docs (you are here)
├── DEPLOYMENT.md          # deployment & infrastructure guide
├── docker-compose.yml     # dev + prod Docker profiles
├── .github/workflows/
│   └── ci.yml             # CI pipeline (lint, typecheck, build)
├── .env.example           # env var template
└── ui/                    # Next.js application
    ├── AGENTS.md          # agent docs (architecture + commands)
    ├── CLAUDE.md → AGENTS.md
    ├── Dockerfile         # multi-stage (dev + prod)
    ├── next.config.ts     # standalone output + security headers
    └── src/
        ├── app/           # App Router pages + API routes
        │   ├── sign-up/   # Sign up page
        │   ├── sign-in/   # Sign in page
        │   ├── admin/     # Admin panel (server-gated)
        │   └── api/       # Auth handler, email check, health
        ├── components/    # Shared UI (header, password, theme)
        ├── db/            # Drizzle client + schema
        │   └── AGENTS.md  # DB-specific agent context
        └── lib/           # Auth, session, constants, flags
            └── AGENTS.md  # Auth-specific agent context
```

## Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the complete deployment guide covering:
- Local, preview, and production environments
- Vercel and Turso dashboard links
- Environment variable management (per environment)
- CI pipeline and GitHub Actions secrets
- Troubleshooting

## Security

- Rate limiting: 10 sign-ins/min, 5 sign-ups/min, 100 global/min
- Content Security Policy (no unsafe-eval)
- HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff
- Disposable email blocking (55,734+ domains)
- Non-root Docker user in production
- Read-only filesystem + no-new-privileges in Docker
- Secrets never committed (`.env*` gitignored)
- `poweredByHeader: false`

## Documentation

This repo uses a **single source of truth** pattern for all documentation.

```
AGENTS.md  ← edit here (the only source of truth for agent context)
CLAUDE.md  → symlink to AGENTS.md (never edit directly)
README.md  ← human onboarding + setup (you are here)
DEPLOYMENT.md ← deployment & infrastructure guide
```

| File | Purpose | Who reads it | Edit? |
|------|---------|-------------|-------|
| `AGENTS.md` (root) | Stack, conventions, env vars | All AI agents | **Yes — source of truth** |
| `CLAUDE.md` (root) | Same content | Claude Code | No — symlink |
| `ui/AGENTS.md` | Architecture + commands | All AI agents | **Yes** |
| `ui/CLAUDE.md` | Same content | Claude Code | No — symlink |
| `ui/src/db/AGENTS.md` | DB schema context | Agents in db/ | **Yes** |
| `ui/src/lib/AGENTS.md` | Auth library context | Agents in lib/ | **Yes** |
| `README.md` | Human onboarding | Humans | **Yes** |
| `DEPLOYMENT.md` | Deployment guide | Humans | **Yes** |

**Rules:**
1. **Never edit CLAUDE.md** — it's a symlink
2. **Global info in root AGENTS.md only** — don't repeat in folder docs
3. **One change, one place** — update a convention once, it reflects everywhere
