"use client";

import { useCallback } from "react";
import { useQueryStates, parseAsStringEnum } from "nuqs";
import type { FeedArticle, HubCategory } from "@tulmek/core/domain";
import { TodaysBrief } from "./todays-brief";

const HUB_CATEGORIES: HubCategory[] = ["dsa", "system-design", "ai-ml", "behavioral", "interview-experience", "compensation", "career", "general"];

interface TodaysBriefWrapperProps {
  readonly articles: FeedArticle[];
  readonly nowMs: number;
}

/**
 * Wrapper that connects TodaysBrief to nuqs URL state.
 * Clicking a category in the brief sets the feed filter.
 */
export function TodaysBriefWrapper({ articles, nowMs }: TodaysBriefWrapperProps) {
  const [, setParams] = useQueryStates({
    category: parseAsStringEnum<HubCategory>(HUB_CATEGORIES),
  }, { shallow: true });

  const handleCategoryClick = useCallback(
    (category: HubCategory) => setParams({ category }),
    [setParams]
  );

  return (
    <TodaysBrief
      articles={articles}
      nowMs={nowMs}
      onCategoryClick={handleCategoryClick}
    />
  );
}
