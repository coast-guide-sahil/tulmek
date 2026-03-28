# Product Hunt Launch Draft

**Last updated:** 2026-03-28
**Status:** DRAFT -- review and personalize before posting

---

## 1. Tagline Options (max 60 chars)

**Option A** (specific + outcome):
```
Open-source AI feed that replaces your 8 interview prep tabs
```
(59 chars)

**Option B** (numbers-driven):
```
931 articles, 23 sources, 38 companies. One ranked feed.
```
(56 chars)

**Option C** (privacy angle):
```
Interview prep knowledge hub. No sign-up. No tracking.
```
(55 chars)

**Recommendation:** Option A. It names the pain (too many tabs), names the solution (one AI feed), and hits the open-source keyword. PH voters are drawn to specific, benefit-oriented taglines over abstract claims.

---

## 2. Short Description (max 260 chars)

```
Open-source knowledge hub that aggregates 931 interview prep articles from 23+ sources into one AI-ranked feed. Company intelligence for 38 firms. AI-extracted question bank. Offline-first, no account, no tracking. Web + desktop + mobile.
```
(239 chars)

---

## 3. Full Description (PH "About" section)

```
The best interview prep content is scattered across Reddit, Hacker News,
LeetCode, dev.to, Medium, YouTube, GitHub, newsletters, and Glassdoor.
You open 8 tabs every morning, skim dozens of threads, and still miss
the post that would have changed your prep strategy.

TULMEK fixes this. It aggregates 931 articles from 23+ sources into one
searchable, AI-ranked feed -- refreshed every 3 hours, zero sign-up
required.

KEY FEATURES

- AI-ranked feed: The TCRA algorithm scores every article on content
  relevance, source credibility, freshness decay, trending velocity,
  and your personal reading patterns. DSA content stays relevant for
  years; compensation data expires in weeks. All computed client-side.

- Company intelligence: Dedicated pages for 38 companies (Google, Meta,
  Stripe, OpenAI, etc.) with cross-source corroborated interview
  formats, real questions, hiring signals, and FAQ.

- Interview Question Bank: AI-extracted questions from across all
  sources, filterable by format (DSA, system design, behavioral, AI/ML),
  difficulty, company, and interview round.

- Engagement system: Reading streaks with confetti celebrations, prep
  coverage rings, daily featured questions, and discovery badges -- all
  stored locally.

- Cross-platform: Web app, desktop app (Tauri v2), and mobile app
  (Expo/React Native). Your data stays on your device across all of them.

WHY IT'S DIFFERENT

Most interview prep tools are walled gardens that charge $35-200/year for
content that largely originates from free community sources. TULMEK is an
aggregator -- it surfaces that content, ranks it intelligently, and adds
a company intelligence layer on top. No paywall, no account, no tracking.

TECH STACK (for the curious)

- Monorepo: Turborepo + pnpm workspaces
- Web: Next.js 16 + Tailwind CSS v4 + Turbopack
- Desktop: Tauri v2 (Rust + WebView, ~10x smaller than Electron)
- Mobile: Expo SDK 55 / React Native 0.83
- Search: Orama (client-side full-text search)
- AI enrichment: Gemini 2.5 Flash-Lite (classification, summaries,
  topic extraction, difficulty estimation -- runs at build time only)
- Core logic: Zero-dependency TypeScript package shared across all
  platforms (clean architecture with ports and adapters)
- Ranking: TCRA v3 -- multi-signal algorithm with per-category
  exponential freshness decay, sqrt-proportional source diversity
  reranking, and epsilon-greedy exploration
- Testing: 51 Playwright e2e tests, Vitest unit tests
- CI/CD: GitHub Actions cron refreshes content every 3 hours
- Cost: ~$3/month total (Gemini API). Hosting is free (Vercel + GH Actions).
- License: MIT
```

---

## 4. Maker Story (First Comment)

```
Hey Product Hunt! Maker here. Here's the story behind TULMEK.

THE PAIN

When I was preparing for interviews, my morning routine looked like this:
open r/cscareerquestions, check Hacker News "Who's Hiring", skim LeetCode
Discuss, read the latest Pragmatic Engineer newsletter, search YouTube for
system design walkthroughs, check dev.to, browse GitHub repos. Every single
morning. 8+ tabs, 45 minutes of scrolling, and I'd still miss important
threads.

The interview prep space has a weird problem: the best content is free and
community-generated (Reddit threads, HN discussions, open-source repos),
but there's no single place that collects and ranks it. The paid tools
($35-200/year) are mostly practice platforms -- they don't solve the
content discovery problem.

WHAT I TRIED

I tried RSS readers, but they show everything chronologically -- no signal
about what's actually relevant for interview prep. I tried bookmarking
folders, but they became a graveyard of 200+ unread links within a week.
I even tried a shared Google Sheet with friends, but nobody maintained it
past week two.

I wanted something like Google News, but purpose-built for interview prep.
So I built it.

HOW IT WORKS

TULMEK fetches content from 23+ sources every 3 hours via GitHub Actions.
Each article goes through an AI enrichment pipeline (Gemini 2.5 Flash-Lite)
that classifies it into 8 categories, generates a summary, extracts topics,
estimates difficulty, detects sentiment, and pulls out interview questions
and company mentions.

Then the TCRA ranking algorithm scores everything. It's a multi-signal
system: content relevance, source credibility, freshness decay (with
per-category half-lives -- DSA problems are evergreen, compensation data
goes stale in two weeks), trending velocity, and personalization from your
reading history. The algorithm is ~450 lines of TypeScript with zero
dependencies, and it runs in ~15ms client-side for the full corpus.

The entire app is offline-first with no backend. Content ships as static
JSON. Your reading history, bookmarks, streaks, and preferences stay in
localStorage -- nothing ever leaves your device. Total running cost is
about $3/month for AI enrichment. Hosting is free.

WHAT I'M MOST PROUD OF

The company intelligence system. When multiple sources independently mention
that a company changed its interview format, TULMEK cross-correlates those
signals into a single company page with corroborated interview formats,
real questions, hiring status, and FAQ. There are pages for 38 companies
right now, from Google and Meta to Stripe and OpenAI.

I'm also proud of the architecture. The core domain logic (ranking,
types, ports) lives in a zero-dependency TypeScript package. Web uses
Next.js 16, desktop uses Tauri v2, mobile uses Expo -- and they all share
the same ranking algorithm. Clean architecture with ports and adapters
means you can swap any infrastructure piece (search engine, storage,
AI provider) without touching business logic.

WHAT'S NEXT

- Semantic clustering: grouping related articles across sources when
  multiple outlets cover the same story
- "Prep Me For [Company]": personalized study plans generated from
  aggregated company intelligence
- More sources: always expanding the content network
- Community contributions: the ranking weights, source credibility
  scores, and freshness decay rates are all in the open-source code.
  PRs that improve them with evidence are very welcome.

Try it at tulmek.vercel.app. Source code at
github.com/coast-guide-sahil/tulmek. Would love your feedback --
especially on the ranking quality and what sources or companies are
missing.
```

---

## 5. Suggested Screenshots

Capture these 5 screenshots before launch day. Use real data, not mocks.

### Screenshot 1: Hub Feed (Dark Mode)
- **What:** The main Knowledge Hub feed showing article cards with source icons, categories, AI-generated tags, difficulty badges, and engagement metrics.
- **Why:** This is the hero shot. It immediately communicates "one feed, many sources." Dark mode looks better on PH thumbnails.
- **Capture:** Full browser width at 1280x800. Show 4-5 article cards from different sources (Reddit, HN, LeetCode, newsletter). Make sure the category filter bar is visible at the top. URL bar showing tulmek.vercel.app.

### Screenshot 2: Company Intelligence Page
- **What:** A company page (Google or Stripe recommended -- widely recognized) showing the interview profile: formats, real questions, hiring signals, source corroboration count, and FAQ.
- **Why:** This is the most differentiated feature. No other free tool aggregates interview intelligence per company from multiple independent sources.
- **Capture:** Full page scroll or focused viewport showing the key sections. Include the company header with logo and the "Sources corroborated" indicator.

### Screenshot 3: Interview Questions Page
- **What:** The question bank with search bar active, showing questions filtered by format or company. Include the faceted filters (format, difficulty, company, round) in the sidebar.
- **Why:** This shows the AI-extraction pipeline's output in a directly useful format. PH users preparing for interviews will immediately see the value.
- **Capture:** Show a search query (e.g., "system design") with results that include company tags, difficulty badges, and format labels.

### Screenshot 4: Today's Brief + Prep Coverage
- **What:** The Today's Brief section (daily curated highlights) alongside the prep coverage visualization (rings or progress indicators showing category coverage).
- **Why:** Demonstrates the engagement layer -- this isn't just a feed, it's a prep companion that tracks your progress and surfaces daily highlights.
- **Capture:** Light mode for contrast with Screenshot 1. Show the streak indicator and coverage rings with some progress filled in.

### Screenshot 5: Mobile App (Android)
- **What:** The hub feed running on an Android device (emulator screenshot at Pixel 6 dimensions or physical device).
- **Why:** Cross-platform is a strong differentiator. Showing it on mobile proves it's not just a website. PH has a large mobile-first audience.
- **Capture:** Standard phone frame (1080x2400 or similar). Show 3-4 article cards with the bottom navigation visible. Dark mode preferred for consistency with Screenshot 1.

### Bonus: Before/After Comparison
- **What:** Split image -- left side shows 8 browser tabs open (Reddit, HN, LeetCode, etc.), right side shows TULMEK's single unified feed.
- **Why:** Visually communicates the core value proposition in one image. Consider using this as the PH gallery's first image.
- **Capture:** Mockup or composite. Left: messy tab bar with 8+ tabs. Right: clean TULMEK feed. Add a simple arrow or "Before / After" label.

---

## 6. Launch Day Checklist

### 48 hours before
- [ ] All 5 screenshots captured and uploaded to PH draft
- [ ] Tagline, short description, and full description finalized
- [ ] Maker comment written and ready to paste
- [ ] tulmek.vercel.app tested on mobile, tablet, and desktop
- [ ] Latest content refresh confirmed (check metadata timestamp)
- [ ] GitHub repo is public, README is current, star count visible

### Launch morning
- [ ] Verify site is up and fast (check Vercel dashboard)
- [ ] Post the maker comment within 60 seconds of going live
- [ ] Share on Twitter/X with the PH link
- [ ] Post in relevant communities (but do NOT ask for upvotes -- PH penalizes this)
- [ ] Clear schedule for 3-4 hours to respond to every comment

### Engagement rules
- Respond to every comment within 30 minutes for the first 4 hours
- Be genuine -- acknowledge limitations, don't oversell
- When someone asks a technical question, link to the specific source file on GitHub
- Thank people for feedback, especially critical feedback
- Never argue -- explain tradeoffs and reasoning calmly
- If a feature request comes up multiple times, say "noted, adding to the roadmap" and mean it

### What NOT to say
- Don't use startup jargon ("disrupt", "game-changer", "revolutionary")
- Don't compare yourself favorably to LeetCode, Blind, or Glassdoor -- position as complementary
- Don't mention user/traffic numbers you don't have yet
- Don't promise features that aren't built
- Don't say "AI-powered" without explaining exactly what the AI does
