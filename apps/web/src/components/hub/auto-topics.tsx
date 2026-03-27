"use client";

import { useMemo } from "react";
import type { FeedArticle } from "@tulmek/core/domain";

interface AutoTopicsProps {
  readonly articles: FeedArticle[];
  readonly onTopicClick: (topic: string) => void;
  readonly limit?: number;
}

/**
 * Fully dynamic topic discovery using TF-IDF-like frequency analysis.
 * Zero hardcoded topics — everything is extracted from live article content.
 *
 * Algorithm:
 * 1. Tokenize all article titles into n-grams (1-word and 2-word phrases)
 * 2. Score by: term frequency × inverse document frequency
 * 3. Filter out stop words and very common/very rare terms
 * 4. Surface the top N most distinctive topics
 */
export function AutoTopics({ articles, onTopicClick, limit = 12 }: AutoTopicsProps) {
  const topics = useMemo(() => extractTopics(articles, limit), [articles, limit]);

  if (topics.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Discovered Topics
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {topics.map(({ term, score }) => (
          <button
            key={term}
            onClick={() => onTopicClick(term)}
            className="rounded-full border border-border px-2.5 py-1 text-xs text-card-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            title={`Relevance: ${Math.round(score * 100)}%`}
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── TF-IDF Topic Extraction ──

const STOP_WORDS = new Set([
  "the", "a", "an", "i", "my", "me", "we", "you", "your", "it", "its",
  "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
  "do", "does", "did", "will", "would", "could", "should", "can", "may",
  "this", "that", "these", "those", "what", "which", "who", "whom",
  "how", "why", "when", "where", "not", "no", "nor", "but", "and", "or",
  "if", "then", "so", "for", "of", "in", "on", "at", "to", "by", "up",
  "as", "with", "from", "into", "about", "after", "before", "between",
  "all", "any", "some", "every", "each", "much", "many", "more", "most",
  "few", "new", "old", "big", "just", "also", "too", "very", "really",
  "here", "there", "now", "then", "today", "yet", "still", "already",
  "don", "didn", "doesn", "won", "isn", "aren", "wasn", "haven",
  "get", "got", "make", "take", "like", "think", "know", "see", "look",
  "want", "use", "try", "help", "need", "feel", "find", "give", "tell",
  "going", "doing", "being", "having", "getting", "making", "looking",
  "work", "working", "life", "time", "year", "years", "day", "days",
  "first", "last", "next", "best", "good", "bad", "way", "thing",
  "people", "anyone", "everyone", "someone", "one", "two", "three",
  "show", "ask", "hn", "re", "ve", "ll", "comment", "comments",
  "post", "edit", "update", "question", "questions", "discussion",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

function extractTopics(articles: FeedArticle[], limit: number) {
  const docCount = articles.length;
  if (docCount === 0) return [];

  // Term frequency across all documents
  const termDocFreq = new Map<string, number>(); // how many docs contain term
  const termTotalFreq = new Map<string, number>(); // total occurrences

  for (const article of articles) {
    const tokens = tokenize(article.title);
    const uniqueTokens = new Set(tokens);

    // Count total frequency
    for (const token of tokens) {
      termTotalFreq.set(token, (termTotalFreq.get(token) ?? 0) + 1);
    }

    // Count document frequency (for IDF)
    for (const token of uniqueTokens) {
      termDocFreq.set(token, (termDocFreq.get(token) ?? 0) + 1);
    }

    // Also extract 2-word phrases from title
    for (let i = 0; i < tokens.length - 1; i++) {
      const bigram = `${tokens[i]} ${tokens[i + 1]}`;
      termTotalFreq.set(bigram, (termTotalFreq.get(bigram) ?? 0) + 1);
      if (uniqueTokens.has(tokens[i]!) && uniqueTokens.has(tokens[i + 1]!)) {
        termDocFreq.set(bigram, (termDocFreq.get(bigram) ?? 0) + 1);
      }
    }
  }

  // Calculate TF-IDF scores
  const scored: { term: string; score: number }[] = [];

  for (const [term, tf] of termTotalFreq) {
    const df = termDocFreq.get(term) ?? 1;

    // Filter: must appear in at least 3 docs but less than 40% of docs
    if (df < 3 || df > docCount * 0.4) continue;

    // TF-IDF = log(1 + tf) * log(N / df)
    const tfidf = Math.log(1 + tf) * Math.log(docCount / df);
    scored.push({ term, score: tfidf });
  }

  // Normalize scores to 0-1
  const maxScore = Math.max(...scored.map((s) => s.score), 1);
  return scored
    .map((s) => ({ ...s, score: s.score / maxScore }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
