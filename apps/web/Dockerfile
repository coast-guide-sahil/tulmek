# syntax=docker/dockerfile:1

# ---- Base ----
FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat tini && corepack enable

# ---- Dev target (hot reload) ----
FROM base AS dev
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/core/package.json ./packages/core/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY . .
WORKDIR /app/apps/web
EXPOSE 3000
ENV WATCHPACK_POLLING=true
CMD ["pnpm", "dev"]

# ---- Pruned monorepo ----
FROM base AS pruner
WORKDIR /app
COPY . .
RUN pnpm dlx turbo prune @tulmek/web --docker

# ---- Install dependencies ----
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---- Builder ----
FROM base AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
RUN NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    SKIP_ENV_VALIDATION=1 \
    pnpm turbo build --filter=@tulmek/web

# ---- Production runner ----
FROM node:24-alpine AS runner
RUN apk add --no-cache tini
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/web/server.js"]
