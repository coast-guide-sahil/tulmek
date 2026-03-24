# Deployment Guide

## Architecture

```
GitHub (<your-org>/interview-prep)
  │
  ├── push to main ──────► Vercel auto-deploy (production)
  ├── push to PR branch ──► Vercel preview deploy (guest-only)
  └── push/PR to main ───► GitHub Actions CI (lint, typecheck, build)
  │
  └── Turso (SQLite cloud database)
```

---

## Dashboard Links

Replace `<vercel-team>`, `<turso-org>`, `<github-org>`, and `<db-name>` with your actual values.

| Service | Page | URL |
|---------|------|-----|
| **Vercel** | Project | `https://vercel.com/<vercel-team>/interview-prep` |
| **Vercel** | Environment Variables | `https://vercel.com/<vercel-team>/interview-prep/settings/environment-variables` |
| **Vercel** | Git Integration | `https://vercel.com/<vercel-team>/interview-prep/settings/git` |
| **Turso** | Dashboard | `https://app.turso.tech/<turso-org>` |
| **Turso** | Database | `https://app.turso.tech/<turso-org>/databases/<db-name>` |
| **GitHub** | Repository | `https://github.com/<github-org>/interview-prep` |
| **GitHub** | Actions (CI) | `https://github.com/<github-org>/interview-prep/actions` |
| **GitHub** | Secrets | `https://github.com/<github-org>/interview-prep/settings/secrets/actions` |
| **GitHub** | Branch Protection | `https://github.com/<github-org>/interview-prep/settings/branches` |

---

## Local Development

```bash
git clone git@github.com:<github-org>/interview-prep.git
cd interview-prep/ui
cp .env.example .env.local    # fill in your values
npm install
npm run db:push               # push schema to Turso
npm run dev                   # http://localhost:3000
```

### Required `.env.local` values

```env
TURSO_DATABASE_URL=libsql://<db-name>-<turso-org>.<region>.turso.io
TURSO_AUTH_TOKEN=<your-turso-token>
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
MAX_USERS=100
ADMIN_EMAIL=your-email@example.com
NEXT_PUBLIC_SKIP_AUTH=false
```

---

## Preview Deployments (PRs)

**Automatic** — every push to a PR branch triggers a Vercel preview deploy.

### How it works

1. Push to a PR branch → Vercel builds a preview
2. Vercel bot comments on the PR with the preview URL
3. `NEXT_PUBLIC_SKIP_AUTH=true` is set for preview → guest-only view
4. No Turso credentials needed — DB connection is lazy (no connection until queried)
5. Cost: **$0** (no DB reads, no auth API calls)

### Preview environment variables (Vercel)

Only these are set for preview:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SKIP_AUTH` | `true` |
| `NEXT_PUBLIC_APP_URL` | (auto or manual) |
| `MAX_USERS` | `100` |

No `TURSO_*`, `BETTER_AUTH_*`, or `ADMIN_EMAIL` needed.

---

## Production Deployment

**Automatic** — merging to `main` triggers a Vercel production deploy.

### Production environment variables (Vercel)

Set at: `https://vercel.com/<vercel-team>/interview-prep/settings/environment-variables`

| Variable | Value | Required |
|----------|-------|----------|
| `TURSO_DATABASE_URL` | `libsql://...` | Yes |
| `TURSO_AUTH_TOKEN` | Turso token | Yes |
| `BETTER_AUTH_SECRET` | Min 32 chars | Yes |
| `BETTER_AUTH_URL` | Production URL (e.g., `https://yourdomain.com`) | Yes |
| `NEXT_PUBLIC_APP_URL` | Same as BETTER_AUTH_URL | Yes |
| `MAX_USERS` | `100` | No |
| `ADMIN_EMAIL` | Admin's email | No |
| `NEXT_PUBLIC_SKIP_AUTH` | `false` | No |

### Health check

```
GET /api/health → {"status":"ok"}
```

### Verify production

```bash
vercel curl /api/health
```

---

## CI Pipeline (GitHub Actions)

Runs on every push to `main` and every PR targeting `main`.

**Steps**: Lint → Typecheck → Build (single job, ~45s)

### Required GitHub Actions secrets

Set at: `https://github.com/<github-org>/interview-prep/settings/secrets/actions`

| Secret | Description |
|--------|-------------|
| `TURSO_DATABASE_URL` | Turso database URL |
| `TURSO_AUTH_TOKEN` | Turso auth token |
| `BETTER_AUTH_SECRET` | Auth secret for build |

### Branch protection

Configured at: `https://github.com/<github-org>/interview-prep/settings/branches`

- CI must pass before merging
- 1 approval required
- Admins cannot bypass
- Force push blocked

---

## Environment Variables — Full Matrix

| Variable | Local | Preview | Production | CI |
|----------|-------|---------|------------|-----|
| `TURSO_DATABASE_URL` | `.env.local` | Not needed | Vercel | GitHub Secret |
| `TURSO_AUTH_TOKEN` | `.env.local` | Not needed | Vercel | GitHub Secret |
| `BETTER_AUTH_SECRET` | `.env.local` | Not needed | Vercel | GitHub Secret |
| `BETTER_AUTH_URL` | `localhost:3000` | Not needed | Production URL | `localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | `localhost:3000` | Auto/manual | Production URL | `localhost:3000` |
| `MAX_USERS` | `100` | `100` | `100` | `100` |
| `ADMIN_EMAIL` | Your email | Not needed | Admin email | Empty |
| `NEXT_PUBLIC_SKIP_AUTH` | `false` | **`true`** | `false` | Not set |

---

## Turso Database Management

### Create a token

```bash
turso db tokens create <db-name> -e never
```

Or via dashboard: `https://app.turso.tech/<turso-org>/databases/<db-name>` → Connect → Create Token

### View data

```bash
cd ui && npm run db:studio     # Opens Drizzle Studio GUI
```

Or via CLI:

```bash
turso db shell <db-name>
> SELECT * FROM user;
```

### Push schema changes

```bash
cd ui && npm run db:push
```

---

## Managing Vercel Environment Variables

### Via dashboard

1. Go to `https://vercel.com/<vercel-team>/interview-prep/settings/environment-variables`
2. Enter key and value
3. Select environment (Production / Preview / Development)
4. Save

### Via CLI

```bash
vercel env add VAR_NAME production     # add
vercel env ls                          # list
vercel env rm VAR_NAME production      # remove
vercel env pull .env.local             # pull to local
```

---

## Troubleshooting

| Problem | Check |
|---------|-------|
| **Build fails on Vercel** | Verify env vars are set for the target environment |
| **Build fails in CI** | Verify GitHub Actions secrets: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BETTER_AUTH_SECRET` |
| **Preview shows errors** | Ensure `NEXT_PUBLIC_SKIP_AUTH=true` is set for Preview environment |
| **Auth not working** | `BETTER_AUTH_URL` must match the exact production domain (with protocol, no trailing slash) |
| **Sessions not persisting** | `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` must match |
| **Max user limit reached** | Increase `MAX_USERS` env var on Vercel |
| **Admin role not assigned** | `ADMIN_EMAIL` must be set before the user signs up |
| **Disposable email false positive** | Upstream mailchecker issue — user needs a different email provider |
| **Schema out of sync** | Run `cd ui && npm run db:push` |
