import type { Metadata } from "next";
import type { FeedArticle } from "@tulmek/core/domain";
import { APP_NAME } from "@tulmek/config/constants";
import feedData from "@tulmek/content/hub/feed";
import Link from "next/link";

const articles = feedData as unknown as FeedArticle[];

const COMPANIES = [
  "google", "amazon", "meta", "apple", "microsoft", "netflix",
  "uber", "stripe", "openai", "nvidia", "anthropic",
] as const;

const DISPLAY: Record<string, string> = {
  google: "Google", amazon: "Amazon", meta: "Meta", apple: "Apple",
  microsoft: "Microsoft", netflix: "Netflix", uber: "Uber", stripe: "Stripe",
  openai: "OpenAI", nvidia: "NVIDIA", anthropic: "Anthropic",
};

function getCompanyData(slug: string) {
  const lower = slug.toLowerCase();
  const matched = articles.filter((a) => {
    const text = (a.title + " " + a.excerpt).toLowerCase();
    if (a.title.includes("|")) {
      const first = a.title.split("|")[0]!.trim().toLowerCase();
      if (first === lower) return true;
    }
    return text.includes(lower);
  });
  const cats: Record<string, number> = {};
  for (const a of matched) cats[a.category] = (cats[a.category] ?? 0) + 1;
  const srcs = new Set(matched.map((a) => a.source));
  return { count: matched.length, cats, srcCount: srcs.size };
}

export const metadata: Metadata = {
  title: "Compare Companies",
  description: `Side-by-side interview prep comparison across top tech companies. ${APP_NAME}.`,
};

export default function ComparePage() {
  const data = COMPANIES.map((slug) => ({
    slug,
    name: DISPLAY[slug]!,
    ...getCompanyData(slug),
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        <Link href="/hub" className="hover:text-foreground">Hub</Link>
        <span className="mx-2">&rsaquo;</span>
        <span className="text-foreground">Compare</span>
      </nav>

      <div>
        <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">Compare Companies</h1>
        <p className="mt-1 text-sm text-muted-foreground">Side-by-side interview prep intelligence</p>
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-3 text-left font-semibold text-foreground">Company</th>
              <th className="px-3 py-3 text-center font-semibold text-foreground">Articles</th>
              <th className="px-3 py-3 text-center font-semibold text-foreground">Sources</th>
              <th className="px-3 py-3 text-center font-semibold text-foreground">DSA</th>
              <th className="px-3 py-3 text-center font-semibold text-foreground">System Design</th>
              <th className="px-3 py-3 text-center font-semibold text-foreground">Compensation</th>
              <th className="px-3 py-3 text-center font-semibold text-foreground">Experiences</th>
            </tr>
          </thead>
          <tbody>
            {data.map((company) => (
              <tr key={company.slug} className="border-b border-border/50 hover:bg-muted/50">
                <td className="px-3 py-3">
                  <Link href={`/hub/company/${company.slug}`} className="font-semibold text-primary hover:underline">
                    {company.name}
                  </Link>
                </td>
                <td className="px-3 py-3 text-center font-bold text-card-foreground">{company.count}</td>
                <td className="px-3 py-3 text-center text-muted-foreground">{company.srcCount}</td>
                <td className="px-3 py-3 text-center text-muted-foreground">{company.cats["dsa"] ?? 0}</td>
                <td className="px-3 py-3 text-center text-muted-foreground">{company.cats["system-design"] ?? 0}</td>
                <td className="px-3 py-3 text-center text-muted-foreground">{company.cats["compensation"] ?? 0}</td>
                <td className="px-3 py-3 text-center text-muted-foreground">{company.cats["interview-experience"] ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Data from {articles.length} articles across 8 sources. Refreshed every 3 hours.
      </p>
    </div>
  );
}
