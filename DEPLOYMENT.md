# Deployment Guide

## Architecture

```
GitHub (<your-org>/tulmek)
  │
  ├── push to main ──────► Vercel auto-deploy (production)
  ├── push to PR branch ──► Vercel preview deploy (guest-only)
  └── push/PR to main ───► GitHub Actions CI (lint, typecheck, build)
  │
  └── Turso (SQLite cloud database)
```

---

## Local Development

```bash
git clone git@github.com:<github-org>/tulmek.git
cd tulmek
corepack enable
pnpm install
cd apps/web
cp .env.example .env.local    # fill in your values
pnpm db:push                  # push schema to Turso
cd ../..
pnpm dev                      # starts all apps
```

### Required `apps/web/.env.local` values

```env
TURSO_DATABASE_URL=libsql://<db-name>-<turso-org>.<region>.turso.io
TURSO_AUTH_TOKEN=<your-turso-token>
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
MAX_USERS=100
ADMIN_EMAIL=your-email@example.com
NEXT_PUBLIC_SKIP_AUTH=false
REQUIRE_EMAIL_VERIFICATION=false
RESEND_API_KEY=
EMAIL_FROM=TULMEK <onboarding@resend.dev>
```

---

## First Admin User

**Option A — Fresh deploy (recommended):**
1. Set `ADMIN_EMAIL=your@email.com` in env vars before deploying
2. Sign up with that email — auto-promoted to admin

**Option B — User already registered as regular user:**
```bash
cd apps/web
pnpm db:promote-admin your@email.com
```

The script requires `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` (reads from `.env.local` automatically).

---

## Docker

### Development (hot reload)
```bash
docker compose --profile dev up --build
```

### Production
```bash
docker compose --profile prod up --build
```

---

## CI Pipeline (GitHub Actions)

Runs on every push to `main` and every PR targeting `main`.

**Steps**: `pnpm install` → `turbo lint` → `turbo typecheck` → `turbo build`

### Required GitHub Actions secrets

| Secret | Description |
|--------|-------------|
| `TURSO_DATABASE_URL` | Turso database URL |
| `TURSO_AUTH_TOKEN` | Turso auth token |
| `BETTER_AUTH_SECRET` | Auth secret for build |

---

## Preview Deployments (PRs)

Automatic — every push to a PR branch triggers a Vercel preview deploy.
- `NEXT_PUBLIC_SKIP_AUTH=true` → guest-only view
- No Turso credentials needed (lazy DB connection)

---

## Production Deployment

Automatic — merging to `main` triggers a Vercel production deploy.

### Health check
```
GET /api/health → {"status":"ok","version":"<current>"}
```

---

## Environment Variables — Full Matrix

| Variable | Local | Preview | Production | CI |
|----------|-------|---------|------------|-----|
| `TURSO_DATABASE_URL` | `.env.local` | Not needed | Vercel | GitHub Secret |
| `TURSO_AUTH_TOKEN` | `.env.local` | Not needed | Vercel | GitHub Secret |
| `BETTER_AUTH_SECRET` | `.env.local` | Not needed | Vercel | GitHub Secret |
| `BETTER_AUTH_URL` | `localhost:3000` | Not needed | Production URL | `localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | `localhost:3000` | Auto | Production URL | `localhost:3000` |
| `MAX_USERS` | `100` | `100` | `100` | `100` |
| `ADMIN_EMAIL` | Your email | Not needed | Admin email | Empty |
| `NEXT_PUBLIC_SKIP_AUTH` | `false` | **`true`** | `false` | Not set |
| `REQUIRE_EMAIL_VERIFICATION` | `false` | Not needed | `true`/`false` | Not set |
| `RESEND_API_KEY` | Optional | Not needed | Resend key | Not needed |
| `EMAIL_FROM` | Optional | Not needed | Sender address | Not needed |

---

## Turso Database

```bash
cd apps/web && pnpm db:push      # Push schema changes
cd apps/web && pnpm db:studio    # Opens Drizzle Studio GUI
turso db shell <db-name>         # CLI access
```
