# Sprint Tracker

> Claude reads this at session start. Keep it SHORT — only active + backlog.
> Completed sprints go to `docs/sprint-archive.md` (not auto-loaded).
> Research docs: `docs/decisions/003-ai-curation-architecture.md`, `docs/research/`

## Active

(none — pick next from backlog)

## Backlog (prioritized)

### AI Curation (ADR-003 Sprint B-C)
1. [ ] Gemini embeddings + story clustering — 128-dim vectors, cosine similarity, near-duplicate grouping `#ai` `#critical`
2. [ ] TCRA v3 — semantic richness, topic trending, MMR diversity, Thompson Sampling `#ai` `#high`
3. [ ] Cold-start content ranking via kNN on embeddings `#ai` `#high`
4. [ ] Trend detection — topic velocity + burst detection `#ai` `#high`

### Data Expansion
5. [ ] WARN Firehose — layoff/hiring freeze signals `#data-quality` `#medium`
6. [ ] H1B/LCA visa data — USCIS + DOL government data `#data-quality` `#medium`
7. [ ] GitHub Trending RSS + npm/PyPI download trends `#data-quality` `#low`

### Launch
8. [ ] Show HN — Tuesday 8-9 AM ET, coordinate with PH + Reddit `#growth` `#high`
9. [ ] Product Hunt launch — Day 2 `#growth` `#medium`
10. [ ] Reddit campaign `#growth` `#medium`

### Mobile
11. [ ] FlashList migration (5x scroll perf) `#mobile` `#medium`
12. [ ] Fix dark mode across all screens `#mobile` `#medium`
13. [ ] Swipe-to-bookmark + haptic feedback `#mobile` `#low`

### Research (continuous — Opus 4.6 high thinking, every sprint)
- Zero direct competitors — white space confirmed
- 42 new data sources identified (docs/research/)
- daily.dev is most dangerous potential pivot (25% probability)
