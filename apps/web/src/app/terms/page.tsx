import type { Metadata } from "next";
import { APP_NAME } from "@tulmek/config/constants";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/hub" className="hover:text-foreground">Hub</Link>
        <span className="mx-2">&rsaquo;</span>
        <span className="text-foreground">Terms of Service</span>
      </nav>

      <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: March 2026</p>

      <div className="prose-sm mt-8 space-y-6 text-muted-foreground [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-foreground [&_p]:leading-relaxed">
        <section>
          <h2>Service Description</h2>
          <p>
            {APP_NAME} is a free, open-source content aggregator for interview preparation.
            We collect, rank, and display publicly available content from third-party sources.
            {APP_NAME} does not author, modify, or host the aggregated content.
          </p>
        </section>

        <section>
          <h2>Content Attribution</h2>
          <p>
            All articles, posts, and resources displayed on {APP_NAME} are created by their
            respective authors and hosted on their original platforms. {APP_NAME} provides
            links to the original content and credits the source. We respect the intellectual
            property of content creators.
          </p>
        </section>

        <section>
          <h2>No Warranties</h2>
          <p>
            {APP_NAME} is provided &ldquo;as is&rdquo; without warranties of any kind. Content
            accuracy, freshness, and availability depend on third-party sources. Interview
            preparation advice should be evaluated critically — {APP_NAME} does not guarantee
            interview outcomes.
          </p>
        </section>

        <section>
          <h2>User Responsibility</h2>
          <p>
            You are responsible for your use of {APP_NAME} and any decisions made based on
            the aggregated content. {APP_NAME} is a discovery tool, not professional career
            advice.
          </p>
        </section>

        <section>
          <h2>Open Source License</h2>
          <p>
            The {APP_NAME} software is licensed under the MIT License. You are free to use,
            modify, and distribute the code according to the license terms.
          </p>
        </section>

        <section>
          <h2>Changes</h2>
          <p>
            We may update these terms from time to time. Continued use of {APP_NAME} after
            changes constitutes acceptance of the updated terms.
          </p>
        </section>
      </div>
    </div>
  );
}
