import { Stack } from "expo-router";
import { useThemeColors } from "../src/hooks/useThemeColors";

/**
 * Root layout — Stack wrapping tab group + detail screens.
 * Tab screens live in (tabs)/, detail screens are at root level.
 */
export default function RootLayout() {
  const t = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: t.bg },
        headerTintColor: t.text,
        headerTitleStyle: { fontWeight: "bold" },
        contentStyle: { backgroundColor: t.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="company/[slug]" options={{ title: "Company" }} />
      <Stack.Screen name="report" options={{ title: "Market Report" }} />
    </Stack>
  );
}
