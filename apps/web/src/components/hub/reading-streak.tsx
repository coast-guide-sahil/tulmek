"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { useHub } from "@/lib/hub/provider";

import { STORAGE_KEYS } from "@tulmek/config/constants";
const STREAK_KEY = STORAGE_KEYS.hubStreak;
const emptySubscribe = () => () => {};

interface StreakData {
  currentStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  freezesRemaining: number;
  totalReads: number;
}

function loadStreak(): StreakData {
  if (typeof window === "undefined") return { currentStreak: 0, lastActiveDate: "", freezesRemaining: 2, totalReads: 0 };
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    return raw ? JSON.parse(raw) as StreakData : { currentStreak: 0, lastActiveDate: "", freezesRemaining: 2, totalReads: 0 };
  } catch {
    return { currentStreak: 0, lastActiveDate: "", freezesRemaining: 2, totalReads: 0 };
  }
}

function getToday(): string {
  return new Date().toISOString().split("T")[0]!;
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0]!;
}

/**
 * True date-based reading streak with ethical safeguards.
 * Based on Duolingo streak model (3.6x retention at 7-day mark).
 *
 * - Tracks consecutive days with at least 1 article read
 * - Awards 2 streak freezes per 7-day milestone
 * - Gentle framing: "you've built something" not "you'll lose something"
 */
export function ReadingStreak() {
  const readIds = useHub((s) => s.readIds);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [streak, setStreak] = useState<StreakData>(loadStreak);

  // Update streak when reads change
  useEffect(() => {
    if (!mounted || readIds.size === 0) return;

    const today = getToday();
    const yesterday = getYesterday();
    const current = loadStreak();

    if (current.lastActiveDate === today) {
      // Already active today — just update total
      if (readIds.size > current.totalReads) {
        const updated = { ...current, totalReads: readIds.size };
        localStorage.setItem(STREAK_KEY, JSON.stringify(updated));
        requestAnimationFrame(() => setStreak(updated));
      }
      return;
    }

    let newStreak: StreakData;

    if (current.lastActiveDate === yesterday) {
      // Consecutive day — extend streak
      const newStreakDays = current.currentStreak + 1;
      const bonusFreezes = newStreakDays % 7 === 0 ? 2 : 0; // Award 2 freezes per 7-day milestone
      newStreak = {
        currentStreak: newStreakDays,
        lastActiveDate: today,
        freezesRemaining: Math.min(5, current.freezesRemaining + bonusFreezes),
        totalReads: readIds.size,
      };
    } else if (current.lastActiveDate && current.lastActiveDate !== today) {
      // Missed day(s) — check freezes
      if (current.freezesRemaining > 0 && current.currentStreak > 0) {
        newStreak = {
          currentStreak: current.currentStreak + 1,
          lastActiveDate: today,
          freezesRemaining: current.freezesRemaining - 1,
          totalReads: readIds.size,
        };
      } else {
        // Streak broken — reset to 1
        newStreak = {
          currentStreak: 1,
          lastActiveDate: today,
          freezesRemaining: 2,
          totalReads: readIds.size,
        };
      }
    } else {
      // First ever read
      newStreak = {
        currentStreak: 1,
        lastActiveDate: today,
        freezesRemaining: 2,
        totalReads: readIds.size,
      };
    }

    localStorage.setItem(STREAK_KEY, JSON.stringify(newStreak));
    requestAnimationFrame(() => setStreak(newStreak));
  }, [readIds.size, mounted]);

  if (!mounted || streak.currentStreak === 0) return null;

  const flame = streak.currentStreak >= 30 ? "🏆" : streak.currentStreak >= 14 ? "🔥" : streak.currentStreak >= 7 ? "✨" : streak.currentStreak >= 3 ? "📖" : "👋";

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5">
      <span className="text-base" role="img" aria-label="Streak">{flame}</span>
      <div>
        <p className="text-xs font-bold text-card-foreground">
          {streak.currentStreak}d streak
        </p>
        {streak.freezesRemaining > 0 && (
          <p className="text-xs text-muted-foreground">
            {streak.freezesRemaining} freeze{streak.freezesRemaining !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
