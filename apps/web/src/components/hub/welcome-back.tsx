"use client";

import { useSyncExternalStore } from "react";
import { useHub } from "@/lib/hub/provider";

const emptySubscribe = () => () => {};
import { STORAGE_KEYS } from "@tulmek/config/constants";
const STREAK_KEY = STORAGE_KEYS.hubStreak;

/**
 * Personalized greeting with engagement stats and streak.
 * "Good morning! 23 articles explored · 5 saved · 7-day streak"
 */
export function WelcomeBack() {
  const readCount = useHub((s) => s.readIds.size);
  const bookmarkCount = useHub((s) => Object.keys(s.bookmarks).length);
  const hydrated = useHub((s) => s.hydrated);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!mounted || !hydrated) return null;
  if (readCount === 0 && bookmarkCount === 0) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Get streak from localStorage
  let streakDays = 0;
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) streakDays = (JSON.parse(raw) as { currentStreak: number }).currentStreak;
  } catch { /* ignore */ }

  const parts: string[] = [];
  if (readCount > 0) parts.push(`${readCount} explored`);
  if (bookmarkCount > 0) parts.push(`${bookmarkCount} saved`);
  if (streakDays > 1) parts.push(`${streakDays}-day streak`);

  return (
    <p className="section-enter mt-0.5 text-sm text-muted-foreground">
      {greeting}! {parts.join(" · ")}
    </p>
  );
}
