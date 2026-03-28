"use client";

import { useState, useEffect, useSyncExternalStore } from "react";

import { STORAGE_KEYS } from "@tulmek/config/constants";

const VISITED_KEY = STORAGE_KEYS.hubVisited;
const emptySubscribe = () => () => {};

/**
 * First-visit onboarding — 2-step preference quiz for instant personalisation.
 * Step 1: "What are you prepping for?" (topic cards)
 * Step 2: "Target companies?" (company chips)
 *
 * Preferences are written to localStorage and can be consumed by the For-You
 * feed to boost relevant content immediately.
 *
 * Chameleon 2026: 4 steps = 40.5% completion, 5+ = 21%. We use 2 steps.
 * 44px minimum touch targets (WCAG 2.2 AA).
 */

const PREP_OPTIONS = [
  { id: "dsa", label: "DSA / Coding", emoji: "💻" },
  { id: "system-design", label: "System Design", emoji: "🏗️" },
  { id: "behavioral", label: "Behavioral", emoji: "🗣️" },
  { id: "career", label: "Career / Jobs", emoji: "🚀" },
  { id: "compensation", label: "Compensation", emoji: "💰" },
  { id: "ai-ml", label: "AI / ML", emoji: "🤖" },
] as const;

const TOP_COMPANIES = [
  "Google",
  "Amazon",
  "Meta",
  "Apple",
  "Microsoft",
  "Netflix",
  "OpenAI",
  "Stripe",
] as const;

export function FirstVisit({
  articleCount,
  sourceCount,
}: {
  articleCount: number;
  sourceCount: number;
}) {

  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  // 0 = not shown, 1 = categories step, 2 = companies step, 3 = done
  const [step, setStep] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (!mounted) return;
    const visited = localStorage.getItem(VISITED_KEY);
    if (!visited) {
      requestAnimationFrame(() => setStep(1));
      localStorage.setItem(VISITED_KEY, "true");
    }
  }, [mounted]);

  if (!mounted || step === 0 || step === 3) return null;

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleCompany = (name: string) => {
    setSelectedCompanies((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const finish = () => {
    localStorage.setItem(
      STORAGE_KEYS.hubPreferredCategories,
      JSON.stringify([...selectedCategories]),
    );
    localStorage.setItem(
      STORAGE_KEYS.hubPreferredCompanies,
      JSON.stringify([...selectedCompanies]),
    );
    setStep(3);
  };

  return (
    <div className="section-enter rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-6">
      {step === 1 && (
        <div>
          <h2 className="text-lg font-bold text-foreground sm:text-xl">
            What are you prepping for?
          </h2>
          <p className="mt-1 text-sm text-foreground">
            Select all that apply — we&apos;ll personalise your feed.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PREP_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => toggleCategory(opt.id)}
                className={`min-h-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                  selectedCategories.has(opt.id)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-card-foreground hover:border-primary/50"
                }`}
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(2)}
            className="mt-4 min-h-[44px] w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Next →
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="text-lg font-bold text-foreground sm:text-xl">
            Target companies?
          </h2>
          <p className="mt-1 text-sm text-foreground">
            Optional — helps surface relevant intel from {sourceCount} sources.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {TOP_COMPANIES.map((name) => (
              <button
                key={name}
                onClick={() => toggleCompany(name)}
                className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  selectedCompanies.has(name)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-primary/10"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setStep(1)}
              className="min-h-[44px] rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
            <button
              onClick={finish}
              className="min-h-[44px] flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Start Exploring ({articleCount}+ articles)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
