import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

/**
 * Root layout — Stack wrapping tab group + detail screens.
 * Tab screens live in (tabs)/, detail screens are at root level.
 */
export default function RootLayout() {
  const scheme = useColorScheme() ?? "dark";
  const isDark = scheme === "dark";

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: isDark ? "#09090b" : "#ffffff" },
        headerTintColor: isDark ? "#fafafa" : "#09090b",
        headerTitleStyle: { fontWeight: "bold" },
        contentStyle: { backgroundColor: isDark ? "#09090b" : "#ffffff" },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="company/[slug]" options={{ title: "Company" }} />
      <Stack.Screen name="report" options={{ title: "Market Report" }} />
    </Stack>
  );
}
