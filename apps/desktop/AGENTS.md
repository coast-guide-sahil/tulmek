# Desktop App (Tauri v2)

Wraps the Next.js web app in a native desktop shell via Tauri v2 WebView.

## Commands
- `pnpm dev` — Launch desktop app (requires web dev server on port 3000)
- `pnpm tauri:build` — Build production desktop binary

## Architecture
- `src-tauri/` — Rust backend + Tauri config
- `devUrl: http://localhost:3000` — points at Next.js dev server
- `frontendDist: ../../web/out` — uses Next.js SSG export for production
- Shares `@tulmek/core` and `@tulmek/config` packages

## Prerequisites
- Rust 1.94+ — `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- System deps (Ubuntu): `libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev patchelf libssl-dev libgtk-3-dev`
