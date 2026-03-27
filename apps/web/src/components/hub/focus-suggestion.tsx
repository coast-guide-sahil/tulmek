"use client";

import { useState, useEffect } from "react";
import type { HubCategory } from "@tulmek/core/domain";
import { getCategoryConfig } from "./hub-utils";

interface FocusSuggestionProps {
  readonly onCategoryClick: (category: HubCategory) => void;
}

/**
 * Suggests a study focus based on time of day.
 * Based on cognitive science: analytical tasks in morning,
 * creative/social tasks in afternoon/evening.
 *
 * Morning (6-12): DSA, Algorithms (analytical peak)
 * Afternoon (12-17): System Design, AI/ML (creative/synthesis)
 * Evening (17-22): Behavioral, Career, Compensation (social/reflective)
 */
export function FocusSuggestion({ onCategoryClick }: FocusSuggestionProps) {
  const [suggestion, setSuggestion] = useState<{ category: HubCategory; reason: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    let s: { category: HubCategory; reason: string } | null = null;
    if (hour >= 6 && hour < 12) {
      s = { category: "dsa", reason: "Morning is peak time for analytical thinking" };
    } else if (hour >= 12 && hour < 17) {
      s = { category: "system-design", reason: "Afternoon is great for creative problem-solving" };
    } else if (hour >= 17 && hour < 22) {
      s = { category: "behavioral", reason: "Evening is ideal for reflective preparation" };
    }
    requestAnimationFrame(() => setSuggestion(s));
  }, []);

  if (!suggestion || dismissed) return null;

  const config = getCategoryConfig(suggestion.category);

  return (
    <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
          {config.label}
        </span>
        <p className="text-sm text-foreground">
          <span className="font-medium">Focus suggestion:</span>{" "}
          <span className="text-muted-foreground">{suggestion.reason}</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onCategoryClick(suggestion.category)}
          className="min-h-[44px] rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          Explore
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="min-h-[44px] rounded-md px-2 text-xs text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
