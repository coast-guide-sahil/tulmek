import type { Metadata } from "next";
import type { FeedArticle } from "@tulmek/core/domain";
import { tulmekRank, getCategoryMeta, formatRelativeTime, getSourceLabel, COMPANY_SLUGS, getCompanyName } from "@tulmek/core/domain";
import { APP_NAME, TRENDING_SCORE_THRESHOLD, MIN_ARTICLES_FOR_LANDING_PAGE } from "@tulmek/config/constants";
import feedData from "@tulmek/content/hub/feed";
import Link from "next/link";
import { SharePrep } from "@/components/hub/share-prep";

const articles = feedData as unknown as FeedArticle[];

// FAQ item type
interface FaqItem {
  question: string;
  answer: string;
}

// Build FAQ items from article data for a company.
// Returns up to 5 question/answer pairs used for JSON-LD FAQPage and the
// visual "People Also Ask" collapsible section.
function buildFaqItems(
  name: string,
  companyArticles: FeedArticle[],
  topRounds: [string, number][],
  topLevels: [string, number][],
): FaqItem[] {
  const items: FaqItem[] = [];

  // Q1: Interview rounds (only if data exists)
  if (topRounds.length > 0) {
    items.push({
      question: `What interview rounds does ${name} have?`,
      answer: `Based on ${companyArticles.length} recent articles, ${name} interviews commonly include: ${topRounds.map(([r]) => r).join(", ")}.`,
    });
  }

  // Q2: Levels mentioned (only if data exists)
  if (topLevels.length > 0) {
    items.push({
      question: `What levels does ${name} hire for?`,
      answer: `Recent interview experiences mention levels: ${topLevels.map(([l]) => l).join(", ")}.`,
    });
  }

  // Q3: How hard is the interview? — derived from difficulty signal counts
  const allText = companyArticles
    .map((a) => `${a.title} ${a.excerpt}`.toLowerCase())
    .join(" ");
  const hardCount = (allText.match(/\b(hard|difficult|challenging|tough)\b/g) ?? []).length;
  const easyCount = (allText.match(/\b(easy|straightforward|simple)\b/g) ?? []).length;
  const mediumCount = (allText.match(/\b(medium|moderate|average|standard)\b/g) ?? []).length;
  let difficultyAssessment: string;
  if (hardCount > easyCount + mediumCount) {
    difficultyAssessment = `The ${name} interview is generally considered challenging. Articles describe it as hard or difficult more often than easy, suggesting rigorous technical and behavioral rounds.`;
  } else if (easyCount > hardCount + mediumCount) {
    difficultyAssessment = `The ${name} interview is generally considered approachable. Articles more often describe it as straightforward compared to difficult, though strong fundamentals are still expected.`;
  } else if (companyArticles.length > 0) {
    difficultyAssessment = `The ${name} interview has moderate difficulty based on ${companyArticles.length} articles. Preparation across coding, system design, and behavioral areas is recommended.`;
  } else {
    difficultyAssessment = `Difficulty data for ${name} interviews is limited. Preparing thoroughly across coding, system design, and behavioral areas is advised.`;
  }
  items.push({
    question: `How hard is the ${name} interview?`,
    answer: difficultyAssessment,
  });

  // Q4: What is the company known for asking? — derived from category distribution
  const catCounts: Record<string, number> = {};
  for (const a of companyArticles) {
    catCounts[a.category] = (catCounts[a.category] ?? 0) + 1;
  }
  const total = companyArticles.length;
  const topCats = Object.entries(catCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  let topicsAnswer: string;
  if (topCats.length > 0 && total > 0) {
    const catDescriptions = topCats.map(([cat, count]) => {
      const pct = Math.round((count / total) * 100);
      const label = cat
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      return `${label} (${pct}% of articles)`;
    });
    topicsAnswer = `${name} interviews focus heavily on ${catDescriptions.join(", ")}. This breakdown is derived from ${total} curated articles.`;
  } else {
    topicsAnswer = `No topic breakdown is available for ${name} yet. Check back as content refreshes every 3 hours.`;
  }
  items.push({
    question: `What is ${name} known for asking?`,
    answer: topicsAnswer,
  });

  // Q5: How long does the interview process take?
  const processAnswer =
    companyArticles.length > 0
      ? `The ${name} interview process typically takes 2-6 weeks from initial screen to offer. Based on ${companyArticles.length} articles, the process usually includes a recruiter screen, technical phone rounds, and an onsite or virtual loop (4-6 interviews). Timelines vary by role and team.`
      : `The ${name} interview process typically takes 2-6 weeks. It usually includes a recruiter screen, technical phone rounds, and an onsite or virtual loop. Timelines vary by role and team.`;
  items.push({
    question: `How long does the ${name} interview process take?`,
    answer: processAnswer,
  });

  return items;
}

function getCompanyArticles(slug: string): FeedArticle[] {
  const lower = slug.toLowerCase();
  return articles.filter((a) => {
    const text = `${a.title} ${a.excerpt}`.toLowerCase();
    // Match pipe-separated company name or keyword in text
    if (a.title.includes("|")) {
      const first = a.title.split("|")[0]!.trim().toLowerCase();
      if (first === lower) return true;
    }
    return text.includes(lower);
  });
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = getCompanyName(slug);
  const count = getCompanyArticles(slug).length;
  return {
    title: `${name} Interview Prep`,
    description: `${count} interview prep articles about ${name} — experiences, compensation, system design, and more. Curated by ${APP_NAME}.`,
  };
}

export async function generateStaticParams() {
  return COMPANY_SLUGS.map((slug) => ({ slug }));
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  const name = getCompanyName(slug);
  const companyArticles = getCompanyArticles(slug);
  const nowMs = new Date(feedData[0]?.aggregatedAt ?? new Date().toISOString()).getTime();
  const ranked = tulmekRank(companyArticles, nowMs, new Set(), {});

  // Category breakdown
  const catCounts: Record<string, number> = {};
  for (const a of companyArticles) {
    catCounts[a.category] = (catCounts[a.category] ?? 0) + 1;
  }

  // Source breakdown
  const srcCounts: Record<string, number> = {};
  for (const a of companyArticles) {
    srcCounts[a.source] = (srcCounts[a.source] ?? 0) + 1;
  }

  // Hiring signal detection from recent articles
  const recentTexts = companyArticles
    .filter((a) => nowMs - new Date(a.publishedAt).getTime() < 30 * 24 * 60 * 60 * 1000)
    .map((a) => `${a.title} ${a.excerpt}`.toLowerCase());
  const allText = recentTexts.join(" ");

  const layoffSignals = /layoff|laid off|let go|rif|reduction in force|cut.*jobs/i.test(allText);
  const freezeSignals = /hiring freeze|freeze.*hiring|not hiring|paused hiring|headcount freeze/i.test(allText);
  const hiringSignals = /hiring|open role|we.re looking|join.*team|new position|actively recruiting/i.test(allText);
  const interviewSignals = companyArticles.filter((a) =>
    a.category === "interview-experience" &&
    nowMs - new Date(a.publishedAt).getTime() < 14 * 24 * 60 * 60 * 1000
  ).length;

  type HiringStatus = "hiring" | "freeze" | "layoffs" | "unknown";
  const hiringStatus: HiringStatus = layoffSignals ? "layoffs" : freezeSignals ? "freeze" : (hiringSignals || interviewSignals >= 2) ? "hiring" : "unknown";

  const statusConfig: Record<HiringStatus, { label: string; color: string; bg: string }> = {
    hiring: { label: "Actively Hiring", color: "text-success", bg: "bg-success/10" },
    freeze: { label: "Hiring Freeze Reported", color: "text-amber-500", bg: "bg-amber-500/10" },
    layoffs: { label: "Recent Layoffs", color: "text-destructive", bg: "bg-destructive/10" },
    unknown: { label: "Status Unknown", color: "text-muted-foreground", bg: "bg-muted" },
  };
  const status = statusConfig[hiringStatus];

  // Interview profile — extract round types and levels from articles
  const roundTypes: Record<string, number> = {};
  const levelMentions: Record<string, number> = {};
  for (const a of companyArticles) {
    const text = `${a.title} ${a.excerpt}`.toLowerCase();
    // Round types
    const rounds = [
      ["Coding", /coding round|dsa round|leetcode|algorithm/],
      ["System Design", /system design|hld|lld|architecture round/],
      ["Behavioral", /behavioral|googlyness|leadership|star method/],
      ["Phone Screen", /phone screen|screening|recruiter call/],
      ["Onsite", /onsite|on-site|virtual onsite|loop/],
      ["Take-Home", /take-home|take home|assignment|project/],
    ] as const;
    for (const [roundName, regex] of rounds) {
      if (regex.test(text)) roundTypes[roundName] = (roundTypes[roundName] ?? 0) + 1;
    }
    // Levels
    const levelMatch = text.match(/\b(l[3-7]|e[3-7]|sde\s?[1-3]|junior|senior|staff|principal)\b/i);
    if (levelMatch) {
      const level = levelMatch[1]!.toUpperCase();
      levelMentions[level] = (levelMentions[level] ?? 0) + 1;
    }
  }
  const topRounds = Object.entries(roundTypes).sort(([, a], [, b]) => b - a).slice(0, 4);
  const topLevels = Object.entries(levelMentions).sort(([, a], [, b]) => b - a).slice(0, 4);

  // Build FAQ items — used for JSON-LD FAQPage and visual "People Also Ask" section
  const faqItems = buildFaqItems(name, companyArticles, topRounds, topLevels);

  return (
    <div className="space-y-6">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${name} Interview Prep`,
          description: `${companyArticles.length} interview prep articles about ${name} from ${Object.keys(srcCounts).length} sources.`,
          url: `https://tulmek.vercel.app/hub/company/${slug}`,
          numberOfItems: companyArticles.length,
          breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Hub", item: "https://tulmek.vercel.app/hub" },
              { "@type": "ListItem", position: 2, name: `${name} Interview Prep` },
            ],
          },
          ...(faqItems.length > 0 ? {
            mainEntity: {
              "@type": "FAQPage",
              mainEntity: faqItems.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.answer,
                },
              })),
            },
          } : {}),
        }) }}
      />

      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground">
        <Link href="/hub" className="hover:text-foreground">Hub</Link>
        <span className="mx-2">›</span>
        <span className="text-foreground">{name}</span>
      </nav>

      {/* Company header + hiring signal */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">
            {name} Interview Prep
          </h1>
          {hiringStatus !== "unknown" && (
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.color} ${status.bg}`}>
              {status.label}
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {companyArticles.length} articles from {Object.keys(srcCounts).length} sources
          </p>
          <SharePrep companyName={name} companySlug={slug} totalArticles={companyArticles.length} />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(catCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 4)
          .map(([cat, count]) => {
            const meta = getCategoryMeta(cat);
            const hasLandingPage = count >= MIN_ARTICLES_FOR_LANDING_PAGE;
            const inner = (
              <>
                <p className="text-xs font-medium text-muted-foreground">{meta.label}</p>
                <p className="mt-1 text-xl font-bold text-card-foreground">{count}</p>
              </>
            );
            return hasLandingPage ? (
              <Link
                key={cat}
                href={`/hub/company/${slug}/${cat}`}
                className="rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30 hover:bg-card"
              >
                {inner}
              </Link>
            ) : (
              <div key={cat} className="rounded-lg border border-border bg-card p-3">
                {inner}
              </div>
            );
          })}
      </div>

      {/* Interview Profile */}
      {(topRounds.length > 0 || topLevels.length > 0) && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-bold text-card-foreground">Interview Profile</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Extracted from recent articles</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {topRounds.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Common Round Types</p>
                <div className="mt-1.5 space-y-1">
                  {topRounds.map(([round, count]) => (
                    <div key={round} className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/60"
                          style={{ width: `${(count / topRounds[0]![1]) * 100}%` }}
                        />
                      </div>
                      <span className="w-20 text-xs text-card-foreground">{round}</span>
                      <span className="w-6 text-right text-xs text-muted-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {topLevels.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Levels Mentioned</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {topLevels.map(([level, count]) => (
                    <span key={level} className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-card-foreground">
                      {level} <span className="text-muted-foreground">({count})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Article list */}
      <div className="space-y-3">
        {ranked.length > 0 ? (
          ranked.map((article) => {
            const relTime = formatRelativeTime(article.publishedAt);
            const source = getSourceLabel(article.source);
            const catMeta = getCategoryMeta(article.category);
            const isTrending = article.score >= TRENDING_SCORE_THRESHOLD;

            return (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="hub-card group block rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
                    {catMeta.label}
                  </span>
                  <span>{source}</span>
                  <span>{relTime}</span>
                  {isTrending && (
                    <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 font-medium text-destructive">
                      TRENDING
                    </span>
                  )}
                </div>
                <h3 className="mt-2 text-sm font-semibold text-card-foreground group-hover:text-primary sm:text-base">
                  {article.title}
                </h3>
                {article.excerpt !== article.title && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground/80">
                    {article.excerpt}
                  </p>
                )}
                <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                  {article.score > 0 && <span>▲ {article.score >= 1000 ? `${(article.score / 1000).toFixed(1)}k` : article.score}</span>}
                  {article.commentCount > 0 && <span>💬 {article.commentCount}</span>}
                  <span>{article.readingTime} min</span>
                </div>
              </a>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-border py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No articles found for {name}. Content refreshes every 3 hours.
            </p>
            <Link href="/hub" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
              Browse all articles
            </Link>
          </div>
        )}
      </div>

      {/* People Also Ask */}
      {faqItems.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-foreground">People Also Ask</h2>
          <div className="space-y-2">
            {faqItems.map((item, i) => (
              <details key={i} className="group rounded-lg border border-border bg-card">
                <summary className="flex min-h-[44px] cursor-pointer items-center px-4 py-3 text-sm font-medium text-foreground">
                  {item.question}
                </summary>
                <p className="px-4 pb-4 text-sm text-muted-foreground">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Related companies — internal cross-linking for SEO */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-bold text-card-foreground">Other Companies</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {COMPANY_SLUGS
            .filter((s) => s !== slug)
            .slice(0, 8)
            .map((s) => (
              <Link
                key={s}
                href={`/hub/company/${s}`}
                className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              >
                {getCompanyName(s)}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
