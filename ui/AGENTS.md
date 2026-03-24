<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Commands
- `npm run dev` — Turbopack dev server
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm run db:push` — Push schema to Turso
- `npm run db:studio` — Drizzle Studio GUI

## Architecture
- `src/app/` — App Router pages + API routes
  - `page.tsx` — Home (shows user info or guest view)
  - `sign-up/page.tsx` — Sign up with disposable email check
  - `sign-in/page.tsx` — Sign in
  - `admin/page.tsx` — Server-side admin gate → `admin-panel.tsx` (user management)
  - `api/auth/[...all]/route.ts` — Better Auth handler
  - `api/check-email/route.ts` — Disposable email validation endpoint
  - `api/health/route.ts` — Health check (used by Docker + monitoring)
- `src/components/` — Shared UI components
  - `auth-header.tsx` — Auth-aware header with theme toggle
  - `password-input.tsx` — Show/hide password toggle
  - `password-strength.tsx` — Real-time strength meter with ARIA
  - `theme-provider.tsx` — next-themes wrapper
  - `theme-toggle.tsx` — Light/dark/system toggle
- `src/db/` — Drizzle client + schema
- `src/lib/` — Auth config, client, session helper, constants
- `src/proxy.ts` — Route protection (redirects unauthenticated users from /admin)
- Standalone output enabled for Docker production builds
