"use client";

import { useState } from "react";
import type { InterviewQuestion } from "@tulmek/core/domain";
import Link from "next/link";

interface DailyQuestionProps {
  readonly questions: InterviewQuestion[];
}

export function DailyQuestion({ questions }: DailyQuestionProps) {
  const [showHint, setShowHint] = useState(false);

  if (questions.length === 0) return null;

  // Deterministic daily selection based on date
  const today = new Date();
  const dayIndex = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % questions.length;
  const question = questions[dayIndex]!;

  const difficultyColor = {
    easy: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
    medium: "bg-amber-500/10 text-amber-800 dark:text-amber-300",
    hard: "bg-red-500/10 text-red-800 dark:text-red-300",
    unknown: "bg-muted text-muted-foreground",
  }[question.difficulty];

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">Daily Question</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {today.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
        <Link
          href="/hub/questions"
          className="min-h-[44px] flex items-center text-xs text-primary hover:underline"
        >
          All questions →
        </Link>
      </div>

      <p className="text-sm font-medium text-foreground leading-relaxed">
        {question.question}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColor}`}>
          {question.difficulty}
        </span>
        <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-300">
          {question.format.replace(/-/g, " ")}
        </span>
        {question.companies.slice(0, 2).map(c => (
          <span key={c.slug} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {c.name}
          </span>
        ))}
      </div>

      {question.hints.length > 0 && (
        <button
          onClick={() => setShowHint(!showHint)}
          className="mt-3 min-h-[44px] text-xs font-medium text-primary hover:underline"
        >
          {showHint ? "Hide hint" : "Show hint"}
        </button>
      )}
      {showHint && question.hints.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground border-l-2 border-primary/20 pl-3">
          {question.hints[0]}
        </p>
      )}
    </div>
  );
}
