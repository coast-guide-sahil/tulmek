"use client";

import { useState, useMemo } from "react";
import type { InterviewQuestion } from "@tulmek/core/domain";

interface QuestionsViewProps {
  readonly questions: InterviewQuestion[];
}

export function QuestionsView({ questions }: QuestionsViewProps) {
  const [search, setSearch] = useState("");
  const [formatFilter, setFormatFilter] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);

  const formats = useMemo(
    () => [...new Set(questions.map((q) => q.format))].filter((f) => f !== "unknown"),
    [questions],
  );

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (search && !q.question.toLowerCase().includes(search.toLowerCase())) return false;
      if (formatFilter && q.format !== formatFilter) return false;
      if (difficultyFilter && q.difficulty !== difficultyFilter) return false;
      return true;
    });
  }, [questions, search, formatFilter, difficultyFilter]);

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 text-4xl" aria-hidden="true">
          🧠
        </div>
        <h2 className="mb-2 text-xl font-bold text-foreground">Interview Questions Coming Soon</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Our AI is extracting real interview questions from 900+ articles. Check back soon for a
          searchable question bank organized by company, difficulty, and topic.
        </p>
      </div>
    );
  }

  const difficulties = ["easy", "medium", "hard"] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">Interview Questions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {questions.length} questions extracted from real interview experiences
        </p>
      </div>

      {/* Search */}
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search questions..."
        aria-label="Search interview questions"
        className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />

      {/* Format filters */}
      {formats.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by format">
          <button
            onClick={() => setFormatFilter(null)}
            aria-pressed={!formatFilter}
            className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              !formatFilter
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-primary/10"
            }`}
          >
            All
          </button>
          {formats.map((f) => (
            <button
              key={f}
              onClick={() => setFormatFilter(formatFilter === f ? null : f)}
              aria-pressed={formatFilter === f}
              className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                formatFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-primary/10"
              }`}
            >
              {f.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
      )}

      {/* Difficulty filters */}
      <div className="flex gap-2" role="group" aria-label="Filter by difficulty">
        {difficulties.map((d) => (
          <button
            key={d}
            onClick={() => setDifficultyFilter(difficultyFilter === d ? null : d)}
            aria-pressed={difficultyFilter === d}
            className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              difficultyFilter === d
                ? d === "easy"
                  ? "bg-emerald-500 text-white"
                  : d === "medium"
                    ? "bg-amber-500 text-white"
                    : "bg-red-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-primary/10"
            }`}
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {filtered.length} question{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Question cards */}
      <div className="space-y-3">
        {filtered.slice(0, 50).map((q) => (
          <QuestionCard key={q.id} question={q} />
        ))}
        {filtered.length > 50 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Showing 50 of {filtered.length} questions
          </p>
        )}
      </div>

      {filtered.length === 0 && questions.length > 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No questions match your filters. Try adjusting the search or filters.
        </p>
      )}
    </div>
  );
}

function QuestionCard({ question: q }: { question: InterviewQuestion }) {
  const [showHints, setShowHints] = useState(false);

  const difficultyColor =
    q.difficulty === "easy"
      ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
      : q.difficulty === "medium"
        ? "bg-amber-500/10 text-amber-800 dark:text-amber-300"
        : q.difficulty === "hard"
          ? "bg-red-500/10 text-red-800 dark:text-red-300"
          : "bg-muted text-muted-foreground";

  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-card-foreground">{q.question}</p>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColor}`}>
          {q.difficulty}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-300">
          {q.format.replace(/-/g, " ")}
        </span>
        {q.companies.map((c) => (
          <span key={c.slug} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {c.name}
            {c.level ? ` ${c.level}` : ""}
          </span>
        ))}
        {q.topics.map((t) => (
          <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {t}
          </span>
        ))}
      </div>

      {q.hints.length > 0 && (
        <button
          onClick={() => setShowHints(!showHints)}
          className="mt-2 min-h-[44px] text-xs text-primary hover:underline focus:outline-none focus-visible:underline"
          aria-expanded={showHints}
        >
          {showHints ? "Hide hints" : `Show ${q.hints.length} hint${q.hints.length > 1 ? "s" : ""}`}
        </button>
      )}
      {showHints && q.hints.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          {q.hints.map((h, i) => (
            <li key={i} className="border-l-2 border-primary/20 pl-3">
              {h}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
