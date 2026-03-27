# TULMEK

AI-powered interview prep Knowledge Hub. 750+ articles from 7 sources, ranked by our proprietary TCRA algorithm. Refreshed every 3 hours.

Cross-platform: **Web** (Next.js 16) + **Desktop** (Tauri v2) + **Mobile** (Expo SDK 55 / React Native).

## Platforms

| Platform | Stack | Status |
|----------|-------|--------|
| [Web](apps/web/) | Next.js 16, Tailwind CSS v4, Orama search | Production |
| [Desktop](apps/desktop/) | Tauri v2 (WebView of web app) | Development |
| [Mobile](apps/mobile/) | Expo SDK 55, React Native 0.83 | Development |

## Quick Start

```bash
corepack enable
pnpm install
pnpm dev              # web at http://localhost:3000
```

### Web

```bash
pnpm dev                                    # http://localhost:3000
pnpm --filter @tulmek/web build             # production build
pnpm --filter @tulmek/web e2e               # 47 Playwright tests
```

### Desktop

Requires: [Rust 1.94+](https://rustup.rs/), system deps (see [Desktop setup](#desktop-setup))

```bash
cd apps/desktop && pnpm dev                 # launches native window → localhost:3000
cd apps/desktop && pnpm tauri:build         # production binary
```

### Mobile

Requires: [Android SDK](https://developer.android.com/studio/command-line) or physical device with [Expo Go](https://expo.dev/go)

```bash
cd apps/mobile && pnpm dev                  # start Metro bundler
cd apps/mobile && pnpm android              # run on Android emulator
```

## Architecture

```
tulmek/
├── apps/
│   ├── web/                  # Next.js 16 — primary platform
│   │   ├── src/app/          # Pages + layouts (App Router)
│   │   ├── src/components/   # 30 hub components, progress tracker
│   │   ├── src/infrastructure/ # Adapters (Orama, localStorage)
│   │   ├── src/lib/          # Providers, stores (Zustand)
│   │   ├── src/content/hub/  # 750+ articles (feed.json)
│   │   └── scripts/          # Content fetcher (7 sources)
│   ├── desktop/              # Tauri v2 — native desktop shell
│   │   └── src-tauri/        # Rust backend + config
│   └── mobile/               # Expo SDK 55 — React Native
│       ├── app/              # Expo Router screens
│       └── src/content/hub/  # Same feed data as web
├── packages/
│   ├── core/                 # Zero-dep shared domain logic
│   │   └── src/
│   │       ├── domain/       # Types, TCRA ranking, hub utils
│   │       └── ports/        # Interface contracts (8 ports)
│   ├── config/               # APP_NAME, env validation
│   ├── ui/                   # Theme tokens (colors, accents)
│   ├── typescript-config/    # Shared tsconfig bases
│   └── eslint-config/        # Shared ESLint rules
├── docs/
│   ├── decisions/            # Architecture Decision Records
│   └── guides/               # Provider swapping, deployment
└── turbo.json                # Task pipeline
```

### Code Sharing

| Layer | Package | Shared by |
|-------|---------|-----------|
| Domain types | `@tulmek/core/domain` | All 3 platforms |
| TCRA ranking | `@tulmek/core/domain` | All 3 platforms |
| Hub utilities | `@tulmek/core/domain` | All 3 platforms |
| Port interfaces | `@tulmek/core/ports` | All 3 platforms |
| Constants | `@tulmek/config/constants` | All 3 platforms |
| Theme tokens | `@tulmek/ui` | All 3 platforms |
| Adapters | `apps/*/infrastructure/` | Platform-specific |
| UI components | `apps/*/components/` | Platform-specific |

### Clean Architecture

```
UI (React/RN) → Ports (interfaces in core) → Adapters (platform-specific)
```

Swap any adapter by creating a new implementation of the port interface. See [docs/guides/swapping-providers.md](docs/guides/swapping-providers.md).

## Developer Setup

### Prerequisites (all platforms)

- **Node.js 24+** — `node -v`
- **pnpm 10+** — `corepack enable`
- **Git** — `git --version`

### Web setup

No additional requirements. `pnpm install && pnpm dev` works out of the box.

### Desktop setup

1. Install Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
2. Install system dependencies (Ubuntu/Debian):
   ```bash
   sudo apt install libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev patchelf libssl-dev libgtk-3-dev
   ```
3. Start web dev server first: `pnpm dev`
4. In a separate terminal: `cd apps/desktop && pnpm dev`

### Mobile setup

1. Install Android SDK (CLI-only, ~2GB):
   ```bash
   mkdir -p ~/android-sdk/cmdline-tools
   # Download from https://developer.android.com/studio#command-line-tools-only
   export ANDROID_HOME=~/android-sdk
   export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH
   sdkmanager "platform-tools" "emulator" "platforms;android-34" "system-images;android-34;google_apis;x86_64"
   ```
2. Create emulator: `avdmanager create avd -n test -k "system-images;android-34;google_apis;x86_64" -d pixel_6`
3. Increase inotify watchers: `sudo sysctl -w fs.inotify.max_user_watches=524288`
4. Launch emulator: `emulator -avd test -gpu host`
5. Set up port forwarding: `adb reverse tcp:8081 tcp:8081`
6. Start app: `cd apps/mobile && pnpm dev`, then open via `adb shell am start -a android.intent.action.VIEW -d 'exp://localhost:8081' host.exp.exponent`

### Content management

```bash
cd apps/web
pnpm fetch-hub-content       # fetch fresh articles from 7 sources
pnpm validate-content        # validate all JSON against Zod schemas
```

Content sources: Reddit, Hacker News, dev.to, LeetCode Discuss, Medium, GitHub, YouTube.

## Commands

| Command | Scope | Description |
|---------|-------|-------------|
| `pnpm dev` | All | Start web dev server (Turbopack) |
| `pnpm build` | All | Build all packages + apps |
| `pnpm lint` | All | ESLint across all packages |
| `pnpm typecheck` | All | TypeScript checking |
| `pnpm test` | All | Unit tests (Vitest) |
| `pnpm e2e` | Web | 47 Playwright E2E tests |
| `pnpm fetch-hub-content` | Web | Fetch articles from 7 sources |
| `pnpm validate-content` | Web | Validate content JSON |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_APP_URL` | Public app URL | No |
| `ANDROID_HOME` | Android SDK path (mobile dev) | Mobile only |

## Deployment

- **Web**: Vercel — auto-deploy from `main` branch
- **Desktop**: `cd apps/desktop && pnpm tauri:build` produces native binaries
- **Mobile**: `eas build --platform android` for APK via Expo EAS

See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment guide.

## License

Private
