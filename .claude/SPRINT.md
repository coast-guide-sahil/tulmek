# Sprint Tracker

> Claude reads this at session start. Keep it SHORT — only active + backlog.
> Completed sprints go to `docs/sprint-archive.md` (not auto-loaded).
> Research docs: `docs/decisions/`, `docs/research/`, `docs/launch/`

## Active

(none — pick next from backlog)

## Backlog (prioritized)

### Launch Execution (waiting for user timing)
1. [ ] Show HN launch — docs/launch/show-hn-draft.md `#growth` `#critical`
2. [ ] Product Hunt launch — docs/launch/product-hunt-draft.md `#growth` `#high`
3. [ ] Reddit + Twitter + LinkedIn + DEV.to — docs/launch/social-media-drafts.md `#growth` `#high`

### Future Enhancements
4. [ ] Orama vector search integration (semantic search from embeddings) `#ai` `#medium`
5. [ ] "Prep Me For [Company]" AI study plan generator (Gemini) `#ai` `#medium`
6. [ ] SimplifyJobs new-grad tracker (fix table parsing) `#data-quality` `#low`
7. [ ] WARN Firehose (fix query params for tech companies) `#data-quality` `#low`
8. [ ] H1B Jobs (fix README table parsing) `#data-quality` `#low`

### Platform Stats (as of Sprint 250)
- 949 unique articles from 27+ sources
- 112 companies with hiring data
- 66+ TCRA unit tests
- TCRA v3: semantic richness + MMR diversity + topic trending
- AI enrichment: category, summary, topics, difficulty, sentiment, actionability
- Gemini embeddings (128-dim) + story clustering
- IQI: question extraction + dedup + /questions page
- 9 engagement systems active
- Full launch kit: HN, PH, Twitter, LinkedIn, Reddit, DEV.to
- Zero lint warnings, zero console errors
