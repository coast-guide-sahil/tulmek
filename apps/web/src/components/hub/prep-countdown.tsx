"use client";

import { useState, useEffect, useSyncExternalStore } from "react";

const COUNTDOWN_KEY = "tulmek:hub:interviewDate";
const emptySubscribe = () => () => {};

/**
 * Interview countdown timer — creates urgency and daily motivation.
 * Based on Goal Gradient Effect: effort accelerates as deadline approaches.
 */
export function PrepCountdown() {
  const [targetDate, setTargetDate] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [nowMs] = useState(() => Date.now());
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    const saved = localStorage.getItem(COUNTDOWN_KEY);
    if (saved) {
      requestAnimationFrame(() => setTargetDate(saved));
    }
  }, []);

  if (!mounted) return null;

  const handleSetDate = (date: string) => {
    localStorage.setItem(COUNTDOWN_KEY, date);
    setTargetDate(date);
    setShowInput(false);
  };

  const handleClear = () => {
    localStorage.removeItem(COUNTDOWN_KEY);
    setTargetDate(null);
  };

  if (!targetDate) {
    if (showInput) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <input
            type="date"
            className="h-8 rounded border border-border bg-background px-2 text-sm text-foreground"
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => { if (e.target.value) handleSetDate(e.target.value); }}
            aria-label="Interview date"
          />
          <button
            onClick={() => setShowInput(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      );
    }
    return (
      <button
        onClick={() => setShowInput(true)}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        Set interview date
      </button>
    );
  }

  const daysLeft = Math.max(0, Math.ceil(
    (new Date(targetDate).getTime() - nowMs) / 86400000
  ));
  const isPast = daysLeft === 0 && new Date(targetDate).getTime() < nowMs;

  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
      daysLeft <= 3 ? "border-destructive/30 bg-destructive/5" :
      daysLeft <= 7 ? "border-amber-500/30 bg-amber-500/5" :
      "border-border bg-card"
    }`}>
      <span className="text-sm font-bold text-foreground">
        {isPast ? "Interview day!" : `${daysLeft}d`}
      </span>
      <span className="text-xs text-muted-foreground">
        {isPast ? "Good luck!" : daysLeft <= 3 ? "Crunch time!" : daysLeft <= 7 ? "Final prep" : "until interview"}
      </span>
      <button
        onClick={handleClear}
        className="ml-auto text-xs text-muted-foreground hover:text-foreground"
        aria-label="Remove interview date"
      >
        ✕
      </button>
    </div>
  );
}
