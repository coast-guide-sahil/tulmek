# Sprint Tracker

> Claude reads this at session start. Keep it SHORT — only active + backlog.
> Completed sprints go to `docs/sprint-archive.md` (not auto-loaded).

## Backlog (prioritized)

1. [ ] Production CI/CD + comprehensive testing for all 3 platforms `#devops` `#critical`
   - Web: Vercel deploy, E2E (Playwright), unit (Vitest)
   - Mobile: EAS Build/Submit, Detox/Maestro E2E, RNLP unit tests
   - Desktop: Tauri multi-platform builds (Linux/macOS/Windows), auto-updater
   - GitHub Actions: unified pipeline, coverage thresholds, visual regression
   - Docs: install instructions for all platforms in README
2. [ ] Branded types: ArticleId, ItemSlug, ISOTimestamp `#types` `#medium`
3. [ ] AI content classification at fetch time (Groq free tier) `#data-quality` `#medium`
4. [ ] Implicit signal tracking (EMA engagement) `#personalization` `#medium`
5. [ ] Mobile: saved articles page `#mobile` `#medium`
6. [ ] Mobile: dark/light theme toggle `#mobile` `#low`
7. [ ] Epsilon-greedy exploration in TCRA `#ranking` `#low`
8. [ ] Dwell time tracking `#personalization` `#low`
9. [ ] Source/category mute `#ux` `#low`
10. [ ] Weekly interview digest page `#content` `#low`
11. [ ] Turborepo Boundaries in turbo.json `#architecture` `#low`
