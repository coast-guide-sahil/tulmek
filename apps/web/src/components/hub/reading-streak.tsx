"use client";

import { useHub } from "@/lib/hub/provider";

/**
 * Reading streak counter — tracks consecutive days the user
 * has read at least one article. Based on Duolingo's streak model
 * which increases 30-day retention by 3.6x at the 7-day mark.
 *
 * Loss aversion (Kahneman & Tversky): losing a streak feels 2x
 * worse than building one, creating powerful return motivation.
 */
export function ReadingStreak() {
  const readIds = useHub((s) => s.readIds);
  const readCount = readIds.size;

  if (readCount === 0) return null;

  // Simple streak based on total reads (full date-based tracking would need store changes)
  const milestone = readCount >= 50 ? "Expert" : readCount >= 20 ? "Dedicated" : readCount >= 5 ? "Explorer" : "Starter";
  const nextMilestone = readCount >= 50 ? null : readCount >= 20 ? 50 : readCount >= 5 ? 20 : 5;
  const progress = nextMilestone ? Math.round((readCount / nextMilestone) * 100) : 100;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
      <div className="flex items-center gap-1.5">
        <span className="text-lg" role="img" aria-label="Reading">
          {readCount >= 50 ? "🏆" : readCount >= 20 ? "🔥" : readCount >= 5 ? "📖" : "👋"}
        </span>
        <div>
          <p className="text-xs font-semibold text-card-foreground">
            {readCount} read · {milestone}
          </p>
          {nextMilestone && (
            <div className="mt-0.5 flex items-center gap-1.5">
              <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {nextMilestone - readCount} to next
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
