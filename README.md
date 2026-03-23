# interview-prep

Full-stack Next.js 16 application with authentication, database, and Docker support.

## Stack

- **Framework**: Next.js 16.2.1 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4
- **Auth**: Better Auth 1.5.5 (email/password, rate limited)
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
cp .env.local.example .env.local  # fill in your values
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
├── docker-compose.yml    # Dev + prod Docker profiles
├── CLAUDE.md             # AI agent instructions (root)
├── ui/                   # Next.js application
│   ├── Dockerfile        # Multi-stage (dev + prod)
│   ├── AGENTS.md         # AI agent docs (Next.js)
│   ├── CLAUDE.md         # AI agent docs (project)
│   ├── drizzle.config.ts # Drizzle Kit config
│   ├── next.config.ts    # Standalone output + security headers
│   └── src/
│       ├── app/          # Next.js App Router pages + API routes
│       ├── db/           # Drizzle client + schema
│       └── lib/          # Auth config + client
```

## Security

- Rate limiting on auth endpoints (brute force protection)
- Security headers: HSTS, X-Frame-Options, CSP, etc.
- Non-root Docker user in production
- Secrets never committed (`.env*` gitignored)

## AI Agent Contribution

This repo is AI agent-native. AGENTS.md and CLAUDE.md files provide context at every directory level. Any AI coding agent (Claude Code, Cursor, Copilot, etc.) can contribute without friction — bundled Next.js docs are available at `node_modules/next/dist/docs/`.
