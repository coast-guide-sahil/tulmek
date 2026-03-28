"use client";

import Link from "next/link";
import { useHub, useHubActions } from "@/lib/hub/provider";
import { getSourceLabel } from "@/components/hub/hub-utils";
import { getCategoryMeta } from "@tulmek/core/domain";

export default function SettingsPage() {
  const mutedSources = useHub((s) => s.mutedSources);
  const mutedCategories = useHub((s) => s.mutedCategories);
  const { toggleMuteSource, toggleMuteCategory } = useHubActions();

  return (
    <div className="space-y-8">
      <nav className="text-sm text-muted-foreground">
        <Link href="/hub" className="hover:text-foreground">Hub</Link>
        <span className="mx-2">&rsaquo;</span>
        <span className="text-foreground">Settings</span>
      </nav>

      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Feed Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage muted sources and categories</p>
      </div>

      {/* Muted Sources */}
      <section>
        <h2 className="text-base font-bold text-foreground">Muted Sources</h2>
        {mutedSources.size > 0 ? (
          <div className="mt-3 space-y-2">
            {[...mutedSources].map((source) => (
              <div key={source} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <span className="text-sm font-medium text-card-foreground">{getSourceLabel(source)}</span>
                <button
                  onClick={() => toggleMuteSource(source)}
                  className="min-h-[44px] rounded-lg px-4 text-sm font-medium text-primary hover:bg-primary/10"
                >
                  Unmute
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No muted sources. Use the three-dot menu on article cards to mute a source.</p>
        )}
      </section>

      {/* Muted Categories */}
      <section>
        <h2 className="text-base font-bold text-foreground">Muted Categories</h2>
        {mutedCategories.size > 0 ? (
          <div className="mt-3 space-y-2">
            {[...mutedCategories].map((cat) => {
              const meta = getCategoryMeta(cat);
              return (
                <div key={cat} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                  <span className="text-sm font-medium text-card-foreground">{meta.label}</span>
                  <button
                    onClick={() => toggleMuteCategory(cat)}
                    className="min-h-[44px] rounded-lg px-4 text-sm font-medium text-primary hover:bg-primary/10"
                  >
                    Unmute
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No muted categories. Use the three-dot menu to see fewer articles from a category.</p>
        )}
      </section>
    </div>
  );
}
