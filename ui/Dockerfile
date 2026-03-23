# ---- Dev target (hot reload) ----
FROM node:22-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 3000
ENV WATCHPACK_POLLING=true
CMD ["npm", "run", "dev"]

# ---- Builder ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Dummy env vars for build (real values injected at runtime)
ENV TURSO_DATABASE_URL=libsql://placeholder.turso.io
ENV TURSO_AUTH_TOKEN=placeholder
ENV BETTER_AUTH_SECRET=placeholder-secret-at-least-32-chars-long
ENV BETTER_AUTH_URL=http://localhost:3000
# NEXT_PUBLIC_APP_URL is baked at build time — pass via --build-arg for prod
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN npm run build

# ---- Production runner ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/auth/get-session || exit 1
CMD ["node", "server.js"]
