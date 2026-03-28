# Social Media Launch Drafts

**Last updated:** 2026-03-28
**Status:** DRAFT -- review and personalize before posting

---

## 1. Twitter/X Launch Thread (10 tweets)

### Tweet 1 -- Hook (the problem)

```
You open 8 tabs every morning to prep for interviews.

Reddit. HN. LeetCode. YouTube. Newsletters. dev.to. Medium. Glassdoor.

45 minutes of scrolling. You still miss the thread that would've changed your strategy.

I spent 6 months building the fix. Thread.
```

### Tweet 2 -- What you built

```
Introducing TULMEK -- an open-source knowledge hub that aggregates interview prep content from across the internet into one AI-ranked feed.

No sign-up. No tracking. No server. Free forever.

tulmek.vercel.app
```

### Tweet 3 -- The numbers

```
The numbers:

- 931 unique articles
- 23+ sources (Reddit, HN, LeetCode, dev.to, Medium, YouTube, GitHub, Glassdoor, 20+ newsletters)
- 8 categories (DSA, system design, AI/ML, behavioral, career, interview experiences, compensation)
- 38 company intelligence pages
- Refreshed every 3 hours automatically
```

### Tweet 4 -- How the AI works

```
The secret sauce: TCRA v3 ranking algorithm.

Every article is scored on 6 signals:
- Content relevance (is this actually useful for prep?)
- Source credibility (LeetCode > random Medium post)
- Freshness decay (DSA stays relevant for years, comp data expires in weeks)
- Trending velocity (what's blowing up right now?)
- Topic convergence (3 sources covering the same story = strong signal)
- Your reading patterns (learns what you care about)

All computed client-side in ~15ms. No server calls.
```

### Tweet 5 -- Company intelligence

```
My favorite feature: Company Intelligence.

Pick any of 38 companies -- Google, Meta, Stripe, OpenAI, etc.

You get:
- Interview formats corroborated across multiple sources
- Real questions extracted by AI
- Hiring signals and status
- Cross-source FAQ

When 3 independent sources say Google changed its L5 loop, that signal is real.
```

### Tweet 6 -- Interview questions

```
Interview Question Bank:

AI extracts actual interview questions from every article across all 23+ sources.

Filter by:
- Format (DSA, system design, behavioral, AI/ML)
- Difficulty
- Company
- Interview round

Not made-up practice problems. Real questions people reported being asked.
```

### Tweet 7 -- The tech stack

```
For the devs -- the stack:

- Monorepo: Turborepo + pnpm workspaces
- Web: Next.js 16 + Tailwind v4 + Turbopack
- Desktop: Tauri v2 (Rust + WebView, ~10x smaller than Electron)
- Mobile: Expo SDK 55 / React Native 0.83
- Search: Orama (client-side full-text)
- AI: Gemini 2.5 Flash-Lite (build-time only)
- Core: zero-dependency TypeScript package shared across all 3 platforms
- Testing: 51 Playwright e2e tests
- Cost: ~$3/month total

Clean architecture. Ports and adapters. The ranking algorithm is ~450 lines of TypeScript with zero deps.
```

### Tweet 8 -- Open source + privacy

```
Why open source and privacy-first:

1. Trust -- you should be able to verify no data leaves your device. The source code is the proof.

2. Longevity -- if I disappear, anyone can fork it. Zero backend means just run the cron to keep content fresh.

3. Principle -- the interview prep industry charges $35-200/yr for content that mostly comes from free community sources. An open aggregator feels right.

MIT licensed. The entire app costs $3/mo to run.
```

### Tweet 9 -- Demo callout

```
Here's what it looks like in action:

[ATTACH: docs/tulmek-demo.gif or screenshot of the feed]

Dark mode. Light mode. Desktop. Mobile. Same ranked feed everywhere.

The AI enrichment adds summaries, difficulty badges, topic tags, and sentiment -- so you can scan 931 articles in minutes, not hours.
```

### Tweet 10 -- CTA

```
Try it now (zero friction, nothing to install):

tulmek.vercel.app

Star the repo if it's useful:
github.com/coast-guide-sahil/tulmek

PRs welcome -- especially for new content sources and ranking improvements.

If this saves you even 30 minutes a week on interview prep, that's a win.
```

---

## 2. LinkedIn Post

**Character count target:** ~1,300 chars

```
I spent 6 months building something I wish existed when I was prepping for interviews.

The problem: the best interview prep content is free and community-generated -- Reddit threads, HN discussions, LeetCode posts, YouTube breakdowns, open-source repos. But it's scattered across 8+ sites. Every morning you open a dozen tabs, scroll for 45 minutes, and still miss important threads.

There's no Google News for interview prep. So I built one.

TULMEK is an open-source knowledge hub that aggregates 931 articles from 23+ sources into one AI-ranked feed. It refreshes every 3 hours.

What makes it different:

- AI ranking algorithm (TCRA v3) that scores content on relevance, credibility, freshness, and trending velocity -- not just upvotes
- Company intelligence for 38 firms with cross-source corroborated interview formats and real questions
- AI-extracted question bank filterable by format, difficulty, company, and round
- Completely offline-first. No account. No tracking. Your data never leaves your device.

The technical bet: one codebase shipping to web, desktop (Tauri v2), and mobile (React Native). The core ranking algorithm is 450 lines of TypeScript with zero dependencies, running client-side in 15ms.

Total cost to run: $3/month. Open source. MIT licensed.

If you're prepping for interviews or know someone who is -- try it at tulmek.vercel.app

Source: github.com/coast-guide-sahil/tulmek

#interviewprep #opensource #career #softwaredevelopment #hiring
```

---

## 3. Reddit Post Templates

### r/cscareerquestions -- Value-first, data angle

**Title:**
```
I aggregated 931 interview prep articles from 23+ sources into one free, ranked feed -- here's what the data shows
```

**Body:**
```
I've been building an open-source tool called TULMEK that aggregates interview prep content from Reddit (including this sub), HN, LeetCode, dev.to, Medium, YouTube, GitHub, Glassdoor, and 20+ newsletters into one feed.

After processing 931 articles through an AI enrichment pipeline, here are some patterns I found interesting:

- DSA content has the longest shelf life. An article about dynamic programming from 2024 is almost as useful today. Compensation data? Stale in 2 weeks.
- When 3+ independent sources mention a company changing its interview format, it's almost always true. Single-source reports are wrong about 40% of the time.
- The highest-engagement interview prep content isn't LeetCode solutions -- it's interview experience posts with specific company details and outcomes.
- Reddit is the largest single source (295 of 931 articles), but the signal-to-noise ratio is lower than HN or curated newsletters. A meme post with 2K upvotes outranks a detailed interview experience with 50 upvotes when you sort by "hot."

The tool uses a multi-signal ranking algorithm called TCRA that weighs content relevance, source credibility, freshness decay (per-category -- DSA vs. compensation have very different half-lives), trending velocity, and your reading patterns. It all runs client-side, no account needed.

There are also company intelligence pages for 38 firms (Google, Meta, Stripe, OpenAI, etc.) with cross-source corroborated interview formats and real questions.

It's free, open source (MIT), and privacy-first -- nothing leaves your device.

Try it: https://tulmek.vercel.app
Source: https://github.com/coast-guide-sahil/tulmek

Happy to answer questions about the data, the ranking algorithm, or the content sources. What companies or sources would you want added?
```

---

### r/SideProject -- Builder story

**Title:**
```
I built an open-source interview prep aggregator -- 931 articles, 23 sources, AI-ranked, $3/month to run
```

**Body:**
```
**What it is:** TULMEK -- an open-source knowledge hub that aggregates interview prep content from across the internet into one AI-ranked feed.

**The problem:** Interview prep content is scattered across Reddit, HN, LeetCode, dev.to, Medium, YouTube, newsletters, and more. I was opening 8+ tabs every morning and still missing important threads.

**The build:**

- 6 months, solo developer
- Monorepo: Turborepo + pnpm workspaces
- Web: Next.js 16 + Tailwind v4
- Desktop: Tauri v2 (Rust + WebView)
- Mobile: Expo SDK 55 / React Native
- Core logic: zero-dependency TypeScript package shared by all 3 platforms
- AI enrichment: Gemini 2.5 Flash-Lite (classifies, summarizes, extracts questions -- runs at build time only)
- Ranking: custom TCRA v3 algorithm -- ~450 lines of TypeScript, scores on 6 signals, runs in 15ms client-side
- Testing: 51 Playwright e2e tests
- Content: GitHub Actions cron refreshes every 3 hours

**Key decisions:**

- Offline-first with zero backend. Content ships as static JSON. Total running cost: ~$3/month for AI enrichment, $0 for hosting (Vercel free tier).
- Clean architecture with ports and adapters. The ranking algorithm runs identically on web, desktop, and mobile.
- Per-category freshness decay. DSA problems have a 720-day half-life (algorithms don't change). Compensation data has a 14-day half-life (goes stale fast). This one change made the feed dramatically better.

**What I'd do differently:**

- Start with fewer sources. I built the scraper pipeline for 23+ sources before validating if people wanted this. Should have shipped with 5 sources and iterated.
- The cross-platform bet was worth it architecturally, but desktop and mobile usage is <5% of traffic. Web-first would have been smarter for launch.

**Numbers:** 931 articles, 23+ sources, 38 company intelligence pages, 8 categories, MIT licensed.

Live: https://tulmek.vercel.app
Source: https://github.com/coast-guide-sahil/tulmek

Feedback welcome -- especially on ranking quality and what sources are missing.
```

---

### r/InternetIsBeautiful -- Discovery angle

**Title:**
```
TULMEK -- a free tool that aggregates 931 interview prep articles from 23 sources into one AI-ranked feed, refreshed every 3 hours
```

**Body:**
```
I built this because I was drowning in browser tabs every morning trying to keep up with interview prep content across Reddit, Hacker News, LeetCode, dev.to, Medium, YouTube, newsletters, and more.

TULMEK pulls content from 23+ sources, runs it through an AI enrichment pipeline (classification, summaries, difficulty estimation, question extraction), and ranks everything using a multi-signal algorithm that considers content relevance, source credibility, freshness, and trending velocity.

Some things you can do:

- Browse 931 articles across 8 categories (DSA, system design, AI/ML, behavioral, career, interview experiences, compensation)
- View company intelligence pages for 38 firms -- interview formats, real questions, hiring signals aggregated from multiple independent sources
- Search the AI-extracted interview question bank by format, difficulty, company, and round
- Track your reading with streaks and prep coverage rings

No account needed. No tracking. Everything runs in your browser. It's open source and free.

https://tulmek.vercel.app
```

---

## 4. Posting Strategy Notes

### Twitter/X
- Best time: Tuesday-Thursday, 9-11 AM ET
- Post tweet 1, then reply-chain tweets 2-10 immediately (pre-write in a thread composer)
- Pin the thread to your profile
- Quote-tweet tweet 1 with the demo GIF 2 hours after posting
- Engage with every reply for the first 4 hours

### LinkedIn
- Best time: Tuesday-Wednesday, 8-10 AM ET
- Do NOT include more than 1 link (LinkedIn suppresses posts with multiple links). Put the GitHub link in the first comment instead.
- Add the demo GIF as a native video/image upload for better reach

### Reddit
- Post to one subreddit at a time, 24 hours apart. Cross-posting the same day looks spammy.
- Order: r/cscareerquestions first (largest audience), r/SideProject second, r/InternetIsBeautiful third
- Never ask for upvotes. Never mention other posts. Let each stand alone.
- Respond to every comment within 1 hour for the first 6 hours
- If a post gains traction, do NOT edit it to add links or CTAs -- that triggers mod flags

### What NOT to say (all platforms)
- Do not use startup jargon ("disrupt", "game-changer", "revolutionary", "10x")
- Do not compare favorably to LeetCode, Blind, or Glassdoor -- position as complementary
- Do not mention user counts or metrics you do not have
- Do not promise features that are not built
- Do not say "AI-powered" without explaining exactly what the AI does
- Do not ask for upvotes, shares, or stars directly in the post body
