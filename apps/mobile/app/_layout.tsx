import { Stack } from "expo-router";

/**
 * Root layout for the TULMEK mobile app.
 * Uses Expo Router's file-based routing with Stack navigation.
 * Shares @tulmek/core domain types and ports with web + desktop.
 */
export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#09090b" },
        headerTintColor: "#fafafa",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "TULMEK" }} />
      <Stack.Screen name="saved" options={{ title: "Saved" }} />
    </Stack>
  );
}
