# Sprint Tracker

> Claude reads this at session start. Keep it SHORT — only active + backlog.
> Completed sprints go to `docs/sprint-archive.md` (not auto-loaded).
> Research docs: `docs/decisions/003-ai-curation-architecture.md`, `docs/research/`

## Active

(none — pick next from backlog)

## Backlog (prioritized — informed by 6 deep research reports 2026-03-28)

### Phase 1: AI Curation Foundation (ADR-003 Sprint A-B)
1. [ ] Unified enrichment pipeline — single Gemini call for category+summary+entities+topics+sentiment+difficulty `#ai` `#critical`
2. [ ] Gemini embeddings + story clustering — 128-dim vectors, cosine similarity, near-duplicate grouping `#ai` `#critical`
3. [ ] Add 3 free job APIs — RemoteOK, Jobicy, Himalayas (no auth, salary data) `#data-quality` `#high`
4. [ ] Add 6 newsletter RSS feeds — Grokking, FANG Prep, Engineer's Codex, Level Up, etc. `#data-quality` `#high`

### Phase 2: Intelligent Ranking (ADR-003 Sprint C)
5. [ ] TCRA v3 — semantic richness, topic trending, MMR diversity, Thompson Sampling `#ai` `#high`
6. [ ] Cold-start content ranking via kNN on embeddings `#ai` `#high`
7. [ ] Trend detection — topic velocity + burst detection (Kleinberg-inspired) `#ai` `#high`

### Phase 3: Engagement Systems (from psychology research)
8. [ ] Streak milestone celebrations — confetti at 7/14/30 days `#engagement` `#high`
9. [ ] First-visit redesign — 30-second preference quiz that reorders feed instantly `#engagement` `#high`
10. [ ] Discovery markers — "New topic for you" badge on unexplored categories `#engagement` `#medium`

### Phase 4: Data Expansion
11. [ ] Greenhouse + Lever + Ashby job board APIs (public, no auth) `#data-quality` `#medium`
12. [ ] WARN Firehose — layoff/hiring freeze signals `#data-quality` `#medium`
13. [ ] H1B/LCA visa data — USCIS + DOL government data `#data-quality` `#medium`
14. [ ] GitHub Trending RSS + npm/PyPI download trends `#data-quality` `#low`

### Phase 5: Launch
15. [ ] Show HN — Tuesday 8-9 AM ET, coordinate with PH + Reddit `#growth` `#high`
16. [ ] Product Hunt launch — Day 2 `#growth` `#medium`
17. [ ] Reddit campaign — r/cscareerquestions, r/leetcode, r/InternetIsBeautiful `#growth` `#medium`

### Mobile
18. [ ] FlashList migration (5x scroll perf) `#mobile` `#medium`
19. [ ] Fix dark mode across all screens `#mobile` `#medium`
20. [ ] Swipe-to-bookmark + haptic feedback `#mobile` `#low`

### Research (continuous — Opus 4.6 high thinking, every sprint)
- Completed reports in docs/research/ and docs/decisions/
- Zero direct competitors confirmed — white space is real
- daily.dev is the most dangerous potential pivot (25% probability)
- 42 new data sources identified (see docs/research/)
