# Desktop App (Tauri v2)

Wraps the Next.js web app in a native desktop shell via Tauri v2.

## Commands
- `pnpm tauri:dev` — Run desktop app in development (points to localhost:3000)
- `pnpm tauri:build` — Build production desktop binary

## Architecture
- `src-tauri/` — Rust backend + Tauri config
- Frontend uses Next.js SSG output from `apps/web`
- Shares `@tulmek/core` and `@tulmek/config` packages

## Prerequisites
- Rust 1.94+ (`rustup update`)
- System deps: `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, `patchelf`
