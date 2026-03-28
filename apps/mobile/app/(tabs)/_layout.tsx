import { Tabs } from "expo-router";
import { useColorScheme, Text } from "react-native";

export default function TabLayout() {
  const scheme = useColorScheme() ?? "dark";
  const isDark = scheme === "dark";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? "#3b82f6" : "#2563eb",
        tabBarInactiveTintColor: isDark ? "#71717a" : "#a1a1aa",
        tabBarStyle: {
          backgroundColor: isDark ? "#09090b" : "#ffffff",
          borderTopColor: isDark ? "#27272a" : "#e4e4e7",
        },
        headerStyle: {
          backgroundColor: isDark ? "#09090b" : "#ffffff",
        },
        headerTintColor: isDark ? "#fafafa" : "#09090b",
        headerTitleStyle: { fontWeight: "bold" as const },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Hub",
          tabBarLabel: "Hub",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="pulse"
        options={{
          title: "Pulse",
          tabBarLabel: "Pulse",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="pulse" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarLabel: "Saved",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="saved" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

/** Simple text-based icons (no extra package needed) */
function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  const icons: Record<string, string> = {
    home: "🏠",
    pulse: "📊",
    saved: "★",
  };
  return (
    <Text style={{ fontSize: size * 0.8, color }}>
      {icons[name] ?? "●"}
    </Text>
  );
}
