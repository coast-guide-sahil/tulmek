# Mobile App (Expo / React Native)

Cross-platform mobile app using Expo SDK 52 + Expo Router v4.

## Commands
- `pnpm dev` — Start Expo dev server
- `pnpm android` — Run on Android emulator
- `pnpm ios` — Run on iOS simulator

## Architecture
- `app/` — Expo Router file-based routes
- `metro.config.js` — Configured for monorepo workspace resolution
- Shares `@tulmek/core` and `@tulmek/config` packages

## Prerequisites
- Expo CLI (`npx expo`)
- Android Studio + SDK for Android
- Xcode for iOS (macOS only)
