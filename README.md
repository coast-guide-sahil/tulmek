# interview-prep

Full-stack Next.js 16 application with authentication, database, and Docker support.

## Stack

- **Framework**: Next.js 16.2.1 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4
- **Auth**: Better Auth 1.5.6 (email/password, rate limited)
- **Database**: Turso (SQLite cloud) + Drizzle ORM
- **Deployment**: Vercel (auto-deploy from GitHub)
- **Containerization**: Docker (dev with hot reload + production)

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
├── docker-compose.yml     # dev + prod Docker profiles
├── .env.example           # env var template
└── ui/                    # Next.js application
    ├── AGENTS.md          # agent docs (Next.js + project commands)
    ├── CLAUDE.md → AGENTS.md  # symlink
    ├── Dockerfile         # multi-stage (dev + prod)
    ├── drizzle.config.ts
    ├── next.config.ts     # standalone output + security headers
    └── src/
        ├── app/           # App Router pages + API routes
        ├── db/            # Drizzle client + schema
        │   └── AGENTS.md  # DB-specific agent context
        └── lib/           # Auth config + client
            └── AGENTS.md  # Auth-specific agent context
```

## Security

- Rate limiting on auth endpoints (brute force protection)
- Security headers: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Non-root Docker user in production
- Secrets never committed (`.env*` gitignored)

## Documentation

This repo uses a **single source of truth** pattern for all documentation.

### How it works

```
AGENTS.md  ← edit here (the only source of truth)
CLAUDE.md  → symlink to AGENTS.md (never edit directly)
```

| File | Purpose | Who reads it | Edit? |
|------|---------|-------------|-------|
| `AGENTS.md` (root) | Project overview, stack, conventions | All AI agents | **Yes — this is the source** |
| `CLAUDE.md` (root) | Same content | Claude Code | No — it's a symlink |
| `ui/AGENTS.md` | Next.js rules + project commands | All AI agents | **Yes** |
| `ui/CLAUDE.md` | Same content | Claude Code | No — it's a symlink |
| `ui/src/db/AGENTS.md` | DB-specific context only | Agents working in db/ | **Yes** |
| `ui/src/lib/AGENTS.md` | Auth-specific context only | Agents working in lib/ | **Yes** |
| `README.md` | Human onboarding + setup | Humans | **Yes** |

### Rules

1. **Never edit CLAUDE.md** — it's a symlink to AGENTS.md
2. **Global info goes in root AGENTS.md** — stack, conventions, commands
3. **Folder AGENTS.md files contain only folder-specific context** — don't repeat global info
4. **README.md is for humans only** — setup instructions, env var tables, project structure
5. **One change, one place** — if you update a convention, update it in root AGENTS.md and it's done

### Adding a new convention

```bash
# Edit the single source of truth
vim AGENTS.md           # for global conventions
vim ui/AGENTS.md        # for Next.js/project-specific
vim ui/src/db/AGENTS.md # for DB-specific only
# CLAUDE.md updates automatically (it's a symlink)
```

## AI Agent Contribution

This repo is AI agent-native. Any AI coding agent (Claude Code, Cursor, Copilot, etc.) can contribute without friction:

- `AGENTS.md` files at every directory level provide scoped context
- `CLAUDE.md` symlinks ensure Claude Code compatibility
- Bundled Next.js docs at `node_modules/next/dist/docs/`
- Agents walk up the directory tree and use the nearest `AGENTS.md`
