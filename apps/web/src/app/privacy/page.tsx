import type { Metadata } from "next";
import { APP_NAME } from "@tulmek/config/constants";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/hub" className="hover:text-foreground">Hub</Link>
        <span className="mx-2">&rsaquo;</span>
        <span className="text-foreground">Privacy Policy</span>
      </nav>

      <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: March 2026</p>

      <div className="prose-sm mt-8 space-y-6 text-muted-foreground [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-foreground [&_p]:leading-relaxed">
        <section>
          <h2>What {APP_NAME} Is</h2>
          <p>
            {APP_NAME} is an open-source, AI-powered interview preparation content aggregator.
            We aggregate publicly available content from 8 sources (Reddit, Hacker News, dev.to,
            LeetCode Discuss, Medium, GitHub, YouTube, and newsletters) and rank it using our
            TCRA (TULMEK Core Ranking Algorithm).
          </p>
        </section>

        <section>
          <h2>Data We Collect</h2>
          <p>
            <strong>We do not collect personal data.</strong> {APP_NAME} is offline-first with
            no user accounts, no authentication, and no server-side data storage.
          </p>
          <p>All user data is stored locally in your browser:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Bookmarks and reading progress (localStorage)</li>
            <li>Reading streak and engagement signals (localStorage)</li>
            <li>Theme preference (localStorage)</li>
            <li>Muted sources and categories (localStorage)</li>
          </ul>
          <p>This data never leaves your device. We cannot access, read, or delete it.</p>
        </section>

        <section>
          <h2>Cookies</h2>
          <p>
            {APP_NAME} does not use cookies. We do not use tracking cookies, advertising cookies,
            or any third-party cookie-based services.
          </p>
        </section>

        <section>
          <h2>Third-Party Content</h2>
          <p>
            {APP_NAME} links to content hosted on third-party websites. When you click an article
            link, you leave {APP_NAME} and are subject to that website&apos;s privacy policy.
            We display source favicons via Google&apos;s favicon service, which may log requests.
          </p>
        </section>

        <section>
          <h2>Analytics</h2>
          <p>
            We may use privacy-friendly analytics (such as Plausible or Vercel Analytics) that
            do not use cookies, do not track users across sites, and comply with GDPR without
            requiring consent. No personal data is collected through analytics.
          </p>
        </section>

        <section>
          <h2>Open Source</h2>
          <p>
            {APP_NAME} is open source under the MIT license. You can inspect the complete source
            code to verify our privacy practices.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            For privacy questions, open an issue on our GitHub repository.
          </p>
        </section>
      </div>
    </div>
  );
}
