# Claude Code Cron Configuration

Recreate with: `CronCreate` tool, schedule `*/5 * * * *`

## Prompt

```
You MUST NOT pause. Before merging any PR, all 3 platforms (web, mobile, desktop) must be tested locally as a live user — this is non-negotiable. If you were already working on something, resume immediately. Only if there is genuinely no pending work: git checkout main && git pull, create sprint branch, implement highest-impact improvement, pnpm lint && pnpm build && pnpm e2e, test all 3 platforms live, commit, push, create PR, merge (disable ruleset, merge, re-enable), IMMEDIATELY start next sprint.

Standing rules for ALL sprints:
1. RESEARCH FIRST: Always search the web for latest best practices (March 2026) before implementing anything — things change by the minute. Never assume, always verify.
2. WORLD-CLASS UX: Every feature must be psychologically engaging — users must feel addicted naturally. Proper animations, live vibe, satisfying micro-interactions. Deep research psychology of engagement for every detail.
3. UX AUDIT: Periodically launch independent expert UX researcher + master designer perspective — test as first-time user on Chrome, nitpick every detail (colors, layout, spacing, typography). Test both light/dark mode, all screen sizes.
4. FULL AUTONOMY: You have complete freedom — no need to follow existing patterns if better ones exist. Revamp anything that isn't world-class.
5. CROSS-PLATFORM: Test web (Chrome), mobile (Android emulator via mobile-mcp), desktop (Tauri) before every merge. Use all available MCP tools for live QA.
```

## Service Restart Checklist (after crash)

```bash
# 1. Web dev server
tmux new-session -d -s tulmek-web "pnpm --filter @tulmek/web dev"

# 2. Android emulator (GPU accelerated)
export ANDROID_HOME=$HOME/android-sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH
tmux new-session -d -s android-emu "emulator -avd tulmek_test -gpu host -no-boot-anim -no-audio"

# 3. Tauri desktop (after web is ready)
source $HOME/.cargo/env
tmux new-session -d -s tulmek-desktop "cd apps/desktop && pnpm dev"

# 4. Expo mobile (after emulator boots)
# Requires: sudo sysctl -w fs.inotify.max_user_watches=524288
tmux new-session -d -s tulmek-mobile "cd apps/mobile && node_modules/.bin/expo start --clear"
# Then: adb reverse tcp:8081 tcp:8081
# Then: adb shell am start -a android.intent.action.VIEW -d 'exp://127.0.0.1:8081' host.exp.exponent
```
