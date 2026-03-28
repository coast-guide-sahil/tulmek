# Show HN Launch Draft

**Last updated:** 2026-03-28
**Status:** DRAFT -- review and personalize before posting

---

## 1. Title Options (pick one)

**Option A** (technical + problem):
```
Show HN: Tulmek -- open-source interview prep aggregator, 901 articles from 8 sources, ranked by AI
```

**Option B** (privacy angle + pain point):
```
Show HN: Tulmek -- I built a privacy-first interview prep hub that replaces 8 browser tabs
```

**Option C** (shortest, most intriguing):
```
Show HN: Tulmek -- open-source Techmeme for interview prep (offline-first, no account)
```

**Recommendation:** Option A is the safest. It is specific, factual, and hits three HN triggers (open-source, concrete numbers, AI). Option C is the most memorable but "Techmeme for X" comparisons can feel overplayed. Option B leans into the personal story which HN values, but is slightly longer.

---

## 2. Show HN Post Body

```
Show HN: Tulmek -- open-source interview prep aggregator, 901 articles from 8 sources, ranked by AI

Tulmek is an open-source knowledge hub that aggregates interview prep content
from across the internet into one searchable, AI-ranked feed. No sign-up, no
tracking, no server. Everything runs client-side.

I built this because I was drowning in tabs. Reddit threads, HN discussions,
LeetCode posts, dev.to articles, Medium write-ups, YouTube breakdowns,
newsletters, GitHub repos -- the best interview prep content is scattered across
dozens of sources. I spent more time finding and organizing content than actually
preparing. There is no Google News for interview prep. So I built one.

What it does:

- Aggregates 901 articles from 8 sources (Reddit, HN, dev.to, LeetCode, Medium,
  GitHub, YouTube, 20+ newsletters) across 8 categories (DSA, system design,
  AI/ML, behavioral, career, interview experiences, compensation, general)
- AI enrichment pipeline: Gemini 2.5 Flash-Lite classifies, summarizes, extracts
  topics, difficulty, sentiment, and interview questions from every article
- TCRA ranking algorithm: a multi-signal system that scores articles on content
  relevance, freshness decay (per-category half-lives), source credibility,
  engagement velocity, discussion depth, and personalization -- all computed
  client-side
- Company intelligence pages for 38 companies (Google, Meta, Stripe, etc.) with
  cross-source corroborated interview formats, questions, and hiring signals
- Content refreshes every 3 hours via GitHub Actions cron

Technical details HN might find interesting:

- Offline-first, zero backend. Content is fetched at build time and shipped as
  static JSON. The app works without network after first load.
- Cross-platform from one codebase: Web (Next.js 16 + Turbopack), Desktop
  (Tauri v2), Mobile (Expo SDK 55 / React Native 0.83). Shared domain logic
  lives in a zero-dependency TypeScript package.
- Clean architecture with ports and adapters. The ranking algorithm, domain
  types, and business logic are in @tulmek/core with zero npm dependencies.
  Each platform provides its own adapters (Orama for search, localStorage for
  persistence, etc.).
- Freshness decay uses per-category exponential half-lives: DSA content stays
  relevant for ~2 years (algorithms don't change), while compensation data
  decays in ~2 weeks. The system adapts decay rates based on content signals
  (salary mentions decay faster, evergreen problems slower).
- Source diversity reranking uses sqrt-proportional quota interleaving so no
  single source dominates the feed, plus epsilon-greedy exploration to prevent
  filter bubbles.
- Engagement system: reading streaks, prep coverage rings, discovery badges --
  all stored locally with no account required.
- 51 Playwright e2e tests, Turborepo monorepo, TypeScript 6.0, MIT licensed.

Live: https://tulmek.vercel.app
Source: https://github.com/coast-guide-sahil/tulmek

I am a solo developer and this is my first Show HN. Feedback on the ranking
algorithm, content coverage, and overall UX would be especially helpful.
```

---

## 3. Maker Comment (post immediately after the submission)

```
Hey HN, maker here. A few notes on the technical decisions and what is next.

Why offline-first with no backend:

I wanted something that works on a plane, on a phone with bad signal, and does
not require yet another account. The entire content corpus is ~2 MB of static
JSON. The TCRA ranking algorithm runs client-side in ~15ms for 901 articles.
Personalization (what you read, bookmark, dismiss) stays in localStorage /
AsyncStorage -- never leaves your device.

Architecture tradeoffs:

The monorepo uses Turborepo with pnpm workspaces. The core domain package
(@tulmek/core) has zero npm dependencies by design -- it contains the ranking
algorithm, domain types, and port interfaces. Platform-specific adapters
(Orama search, localStorage, Tauri IPC) live in each app. This means the
ranking algorithm runs identically on web, desktop, and mobile.

The cross-platform approach uses Next.js 16 for web, Tauri v2 (Rust +
WebView) for desktop, and Expo SDK 55 for mobile. I chose Tauri over
Electron for the ~10x smaller binary size and native system integration.
Mobile shares domain logic via @tulmek/core but has its own React Native
UI.

AI enrichment runs at build time only. Gemini 2.5 Flash-Lite processes each
article once (classify, summarize, extract topics/difficulty/sentiment) and
the results are cached. Total AI cost is about $3/month for the entire
pipeline. If the Gemini API is down, keyword fallbacks produce reasonable
results.

What is next:

- Semantic clustering: grouping related articles across sources (e.g., 3
  sources reporting the same Google interview change)
- Trend detection: velocity-based topic emergence across the corpus
- "Prep Me For [Company]": personalized study plans from aggregated
  intelligence
- More sources: Glassdoor integration, job board signals (RemoteOK, Jobicy)

The full architecture is documented in docs/decisions/ if you want to dig
deeper. PRs welcome -- especially for new content sources.
```

---

## 4. FAQ Responses

### Q: "How is this different from LeetCode/Blind/Glassdoor?"

```
Different category of product entirely.

LeetCode is a practice platform -- you solve problems there. Blind is an
anonymous forum -- you post and discuss there. Glassdoor is a review database
-- you look up companies there.

Tulmek does not replace any of them. It aggregates content FROM them (and
Reddit, HN, dev.to, YouTube, newsletters, GitHub). The value is that you see
a Reddit thread about Amazon's new interview format, a LeetCode discussion
about trending problems, and a newsletter deep dive on system design -- all
in one ranked feed, instead of checking 8 different sites every morning.

Think of it as an RSS reader purpose-built for interview prep, with an AI
ranking layer that understands which content is actually useful for someone
preparing for interviews.
```

### Q: "Why not just use Reddit?"

```
Reddit is one of our best sources (295 of 901 articles come from Reddit
subs like r/cscareerquestions, r/leetcode, r/experienceddevs). But Reddit
alone has three problems:

1. Signal-to-noise ratio. Sorting by "hot" gives you what is popular, not
   what is useful for interview prep. A meme post with 2K upvotes outranks a
   detailed interview experience with 50 upvotes. TCRA weighs content
   richness (does it mention specific companies, rounds, complexity
   analysis?) alongside engagement.

2. Single-source blind spots. The most valuable interview prep content is
   scattered across HN threads, dev.to tutorials, YouTube breakdowns,
   newsletters like Pragmatic Engineer and ByteByteGo, and GitHub repos.
   Reddit cannot surface those.

3. No cross-source corroboration. When 3 different sources mention that
   Google changed its L5 interview format, that signal is much stronger than
   a single Reddit post. Tulmek's company intelligence pages aggregate
   mentions across all sources.

Reddit is great. Tulmek makes it better by combining it with everything else.
```

### Q: "How does the ranking algorithm work?"

```
The ranking algorithm is called TCRA (Tulmek Content Ranking Algorithm). It
is a multiplicative multi-signal system. The source code is at
packages/core/src/domain/ranking.ts -- it is about 450 lines of TypeScript
with no dependencies.

The final score for each article is:

  score = CRS * freshnessDecay * (1 + trendingBonus) * personalization

Where:

- CRS (Content Relevance Score) is a weighted sum of:
  - Category confidence (0.25): how relevant is this category to prep
  - Normalized engagement (0.20): percentile rank within its source
  - Discussion depth (0.15): comment-to-score ratio + volume
  - Source credibility (0.15): baseline per source (LeetCode 0.9, Reddit 0.6)
  - Content richness (0.25): does it mention companies, complexity analysis,
    specific interview rounds, outcomes?

- Freshness decay: exponential with per-category half-lives. DSA problems
  have a 720-day half-life (evergreen), compensation data has a 14-day
  half-life (stale quickly). Decay has floors so good old content never
  disappears completely.

- Trending bonus: velocity-based burst detection for articles < 72 hours
  old. An article gaining upvotes 5x faster than the source median gets a
  significant boost.

- Personalization: learns from your reading and bookmarking patterns using
  Laplace-smoothed category weights. Cold start ramps up gradually over your
  first 20 reads.

After scoring, a diversity reranker uses sqrt-proportional quota interleaving
to prevent any single source or category from dominating. Then epsilon-greedy
exploration (10% of slots) surfaces content from categories you have not
explored yet.

All of this runs in ~15ms client-side. No server calls.
```

### Q: "How do you handle content from behind paywalls?"

```
We do not scrape or reproduce paywalled content. The feed contains titles,
excerpts (usually the first 1-2 sentences or an AI-generated summary), and
links to the original source.

For each article, we show:
- Title
- AI-generated summary (from public excerpt/title, not full text)
- Source, category, tags, engagement metrics
- Link to the original and link to the discussion

If you click through to a paywalled Medium article, you will hit the paywall
on Medium's site. We are an aggregator/discovery layer, not a content mirror.

The AI enrichment (classification, topic extraction, difficulty estimation)
works from the title and public excerpt, which is typically sufficient for
accurate categorization.
```

### Q: "What's the business model?"

```
There is not one, and that is intentional.

Tulmek is an open-source side project (MIT licensed). It costs me about
$3/month to run the AI enrichment pipeline (Gemini Flash-Lite) and $0 for
hosting (Vercel free tier for static sites, GitHub Actions free tier for the
cron).

I built it because I needed it. The interview prep content landscape is
genuinely fragmented and I was tired of the 8-tab morning routine. If other
people find it useful, great.

If it grows significantly, the natural monetization paths would be:
- Sponsored company intelligence pages (companies paying to highlight their
  hiring process)
- Premium data exports or API access
- But honestly, keeping it free and open source is the priority.

I have no VC, no investors, no plans to raise. The architecture is
specifically designed so the total running cost stays under $20/month
regardless of user count (static site, no backend, no database).
```

### Q: "Why is it open source?"

```
Three reasons:

1. Trust. This is a tool that tracks your reading habits and interview
   prep progress (locally). You should be able to verify that no data
   leaves your device. The source code is the proof.

2. Longevity. Interview prep tools come and go. If I stop maintaining
   this, anyone can fork it and keep it running. The architecture is
   specifically designed for this -- zero backend dependency means a fork
   just needs to run the GitHub Actions cron to keep content fresh.

3. Contributions. The ranking algorithm and content sources are the two
   areas where community input makes the product significantly better. If
   someone thinks the freshness decay for compensation data should be 7
   days instead of 14, they can submit a PR with evidence and we can test
   it.

Also, the entire interview prep industry charges $35-200/year for content
that largely comes from free community sources (Reddit, HN, LeetCode
Discuss). An open-source aggregator that surfaces this content for free
feels like the right thing to build.
```

---

## 5. Posting Strategy

### Timing
- Best time: Tuesday-Thursday, 8:00-9:00 AM ET (when HN traffic peaks)
- Avoid: weekends, Mondays (low traffic), Fridays (people check out early)

### Before posting checklist
- [ ] Verify tulmek.vercel.app is up and responsive
- [ ] Verify the GitHub repo is public and clean
- [ ] Make sure the latest content refresh has run (metadata shows today's date)
- [ ] Test the app on mobile (many HN readers will check on phones)
- [ ] Have the maker comment ready to paste within 60 seconds of posting
- [ ] Clear your schedule for 2-3 hours after posting to respond to comments

### Engagement rules
- Respond to every comment within 30 minutes for the first 3 hours
- Be honest about limitations (do not oversell)
- Thank people for feedback, even critical feedback
- If someone asks a technical question, link to specific source files
- Never argue -- acknowledge valid criticism, explain your reasoning for tradeoffs
- If the post gains traction, update it with an edit noting popular feedback themes

### What NOT to say
- Do not compare yourself favorably to LeetCode/Blind/Glassdoor -- position as complementary
- Do not use startup jargon ("disrupt", "game-changer", "10x")
- Do not mention user counts or metrics you do not have yet
- Do not promise features that are not built
- Do not say "AI-powered" in isolation -- always explain what the AI specifically does

### Potential risks and responses
- **"This is just an RSS reader"**: "You are not wrong that it is conceptually similar to RSS. The differentiator is the ranking layer. RSS shows you everything in chronological order. TCRA scores content on 5 signals specific to interview prep relevance. The per-category freshness decay alone is something no RSS reader does."
- **"AI hype / why does this need AI?"**: "Fair question. The AI does three specific things: (1) classifies articles into 8 categories that keyword matching gets wrong ~30% of the time, (2) generates summaries for articles that only have titles, (3) extracts interview questions and company mentions. The ranking algorithm itself is pure math, no AI. If you set GEMINI_API_KEY to empty, the system falls back to keyword classification and still works."
- **"Privacy concerns with AI processing"**: "All AI processing happens at build time on GitHub Actions, not at runtime. Your reading habits, bookmarks, and preferences never leave your device. The AI sees only publicly available article titles and excerpts."
- **"Why TypeScript and not Rust/Go?"**: "The ranking algorithm is ~450 lines of TypeScript that runs in 15ms client-side. Performance is not the bottleneck -- the feed is 901 articles, not 901K. TypeScript was chosen because it runs on all three platforms (web, Tauri WebView, React Native) from the same source code."
