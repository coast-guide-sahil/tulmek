import { useColorScheme } from "react-native";
import { themes } from "../theme";

/** Union of all theme variants — works for both dark and light. */
export type ThemeColors = typeof themes.dark | typeof themes.light;

/**
 * Returns the correct theme token set for the current color scheme.
 * Defaults to dark when the system preference is unknown.
 */
export function useThemeColors(): ThemeColors {
  const raw = useColorScheme();
  const scheme = raw === "light" ? "light" : "dark";
  return themes[scheme];
}
