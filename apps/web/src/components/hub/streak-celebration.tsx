"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { STORAGE_KEYS } from "@tulmek/config/constants";

const MILESTONES = [7, 14, 30, 50, 100, 365];
const MILESTONE_MESSAGES: Record<number, string> = {
  7: "1 week streak! You're building a habit.",
  14: "2 week streak! Consistency is your superpower.",
  30: "30 days! You're in the top 5% of preppers.",
  50: "50 days! Interview confidence unlocked.",
  100: "100 days! You're unstoppable.",
  365: "365 days! Legend status achieved.",
};

const PARTICLE_COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#a855f7", "#06b6d4"] as const;
const CELEBRATED_KEY = "tulmek:hub:lastCelebrated";

const emptySubscribe = () => () => {};

export function StreakCelebration() {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [celebration, setCelebration] = useState<{ days: number; message: string } | null>(null);

  useEffect(() => {
    if (!mounted) return;

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.hubStreak);
      if (!raw) return;
      const { currentStreak } = JSON.parse(raw) as { currentStreak: number };

      const lastCelebrated = parseInt(localStorage.getItem(CELEBRATED_KEY) ?? "0", 10);

      // Find the highest milestone reached that hasn't been celebrated yet
      const milestone = [...MILESTONES].reverse().find(
        (m) => currentStreak >= m && m > lastCelebrated
      );

      if (milestone) {
        requestAnimationFrame(() => {
          setCelebration({
            days: milestone,
            message: MILESTONE_MESSAGES[milestone] ?? `${milestone} day streak!`,
          });
        });
        localStorage.setItem(CELEBRATED_KEY, String(milestone));
      }
    } catch {
      // Ignore localStorage errors (private browsing, quota exceeded, etc.)
    }
  }, [mounted]);

  if (!celebration) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => setCelebration(null)}
      role="dialog"
      aria-modal="true"
      aria-label={`${celebration.days}-day streak celebration`}
    >
      {/* CSS-only confetti particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="confetti-particle absolute"
            style={{
              left: `${(i * 3.33 + Math.sin(i) * 20 + 50) % 100}%`,
              animationDelay: `${(i * 0.1) % 2}s`,
              backgroundColor: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
            }}
          />
        ))}
      </div>

      {/* Celebration card — stop propagation so clicking card doesn't dismiss */}
      <div
        className="relative z-10 mx-4 max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 text-5xl" aria-hidden="true">🔥</div>
        <h2 className="mb-2 text-2xl font-extrabold text-foreground">
          {celebration.days}-Day Streak!
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {celebration.message}
        </p>
        <button
          onClick={() => setCelebration(null)}
          className="min-h-[44px] rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          autoFocus
        >
          Keep going!
        </button>
      </div>
    </div>
  );
}
