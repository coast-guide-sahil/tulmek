# Mobile App (Expo SDK 55 / React Native 0.83)

Cross-platform mobile app with Knowledge Hub feed.

## Commands
- `pnpm dev` — Start Expo Metro bundler
- `pnpm android` — Run on Android emulator/device
- `pnpm ios` — Run on iOS simulator (macOS only)

## Architecture
- `app/` — Expo Router file-based screens
- `src/content/hub/` — Same feed data as web (copied from `apps/web`)
- Imports `@tulmek/core/domain` for TCRA ranking, hub utils, types
- Imports `@tulmek/config/constants` for APP_NAME

## Prerequisites
- Android SDK with emulator, or physical device with Expo Go
- `adb reverse tcp:8081 tcp:8081` for emulator connectivity
- `sudo sysctl -w fs.inotify.max_user_watches=524288` (Linux)
