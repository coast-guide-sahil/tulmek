/** Mobile theme tokens — matches web's semantic color system */
export const themes = {
  dark: {
    bg: "#09090b",
    card: "#18181b",
    cardBorder: "#27272a",
    text: "#fafafa",
    textSecondary: "#a1a1aa",
    textMuted: "#71717a",
    primary: "#3b82f6",
    success: "#22c55e",
    destructive: "#ef4444",
    searchBg: "#18181b",
    searchBorder: "#27272a",
    chipBg: "#18181b",
    chipActiveBg: "#fafafa",
    chipActiveText: "#09090b",
  },
  light: {
    bg: "#ffffff",
    card: "#f4f4f5",
    cardBorder: "#e4e4e7",
    text: "#09090b",
    textSecondary: "#52525b",
    textMuted: "#71717a",
    primary: "#2563eb",
    success: "#16a34a",
    destructive: "#dc2626",
    searchBg: "#f4f4f5",
    searchBorder: "#e4e4e7",
    chipBg: "#f4f4f5",
    chipActiveBg: "#09090b",
    chipActiveText: "#fafafa",
  },
} as const;

export type ThemeColors = typeof themes.dark;
