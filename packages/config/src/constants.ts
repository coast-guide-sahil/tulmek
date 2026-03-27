/** App metadata */
export const APP_NAME = "TULMEK";

/** Content thresholds — shared across all platforms */
export const TRENDING_SCORE_THRESHOLD = 500;
export const HOT_DISCUSSION_THRESHOLD = 100;
export const NEW_ARTICLE_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours

/** Time constants (milliseconds) */
export const MS_PER_HOUR = 3_600_000;
export const MS_PER_DAY = 86_400_000;
export const HOURS_PER_DAY = 24;

/** Content refresh interval */
export const CONTENT_REFRESH_HOURS = 3;
export const CONTENT_SOURCE_COUNT = 8;

/** Feed pagination */
export const FEED_PAGE_SIZE = 24;
export const FEED_DEBOUNCE_MS = 250;

/** WCAG 2.2 AA */
export const MIN_TOUCH_TARGET_PX = 44;

/** Ranking diversity window */
export const DIVERSITY_WINDOW_SIZE = 12;
export const TRENDING_VELOCITY_WINDOW_HOURS = 168; // 7 days

/** Storage keys — single source of truth for all localStorage/AsyncStorage keys */
export const STORAGE_KEYS = {
  hubBookmarks: "tulmek:hub:bookmarks",
  hubRead: "tulmek:hub:read",
  hubDismissed: "tulmek:hub:dismissed",
  hubStreak: "tulmek:hub:streak",
  hubLastVisit: "tulmek:hub:lastVisit",
  hubVisited: "tulmek:hub:visited",
  hubInterviewDate: "tulmek:hub:interviewDate",
  progress: "tulmek:progress",
  notes: "tulmek:notes",
} as const satisfies Record<string, `tulmek:${string}`>;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
