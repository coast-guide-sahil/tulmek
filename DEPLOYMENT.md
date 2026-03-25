# Deployment Guide

## Architecture

```
GitHub (<your-org>/tulmek)
  │
  ├── push to main ──────► Vercel auto-deploy (production)
  ├── push to PR branch ──► Vercel preview deploy
  └── push/PR to main ───► GitHub Actions CI (lint, typecheck, build)
```

---

## Local Development

```bash
git clone git@github.com:<github-org>/tulmek.git
cd tulmek
corepack enable
pnpm install
pnpm dev                      # starts all apps at http://localhost:3000
```

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

**Steps**: `pnpm install` → `turbo lint` → `turbo typecheck` → `turbo test` → `turbo build` → E2E tests

No secrets required — the app is fully offline-first with no server-side dependencies.

---

## Production Deployment

Automatic — merging to `main` triggers a Vercel production deploy.

### Health check
```
GET /api/health → {"status":"ok","version":"<current>"}
```

---

## Environment Variables

| Variable | Local | Preview | Production | CI |
|----------|-------|---------|------------|-----|
| `NEXT_PUBLIC_APP_URL` | `localhost:3000` | Auto | Production URL | `localhost:3000` |
