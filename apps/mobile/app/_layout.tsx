import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

const THEMES = {
  dark: { bg: "#09090b", text: "#fafafa" },
  light: { bg: "#ffffff", text: "#09090b" },
};

/**
 * Root layout — respects system dark/light mode.
 * Shares @tulmek/core domain types and ports with web + desktop.
 */
export default function RootLayout() {
  const scheme = useColorScheme() ?? "dark";
  const theme = THEMES[scheme];

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: "bold" },
        contentStyle: { backgroundColor: theme.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: "TULMEK" }} />
      <Stack.Screen name="saved" options={{ title: "Saved" }} />
      <Stack.Screen name="company/[slug]" options={{ title: "Company" }} />
      <Stack.Screen name="pulse" options={{ title: "Market Pulse" }} />
    </Stack>
  );
}
