import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useThemeColors } from "../../src/hooks/useThemeColors";

export default function TabLayout() {
  const t = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.textMuted,
        tabBarStyle: {
          backgroundColor: t.bg,
          borderTopColor: t.cardBorder,
        },
        headerStyle: {
          backgroundColor: t.bg,
        },
        headerTintColor: t.text,
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
        name="questions"
        options={{
          title: "Questions",
          tabBarLabel: "Questions",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="questions" color={color} size={size} />
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
      <Tabs.Screen
        name="compare"
        options={{
          title: "Compare",
          tabBarLabel: "Compare",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="compare" color={color} size={size} />
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
    questions: "?",
    pulse: "📊",
    saved: "★",
    compare: "⇌",
  };
  return (
    <Text style={{ fontSize: size * 0.8, color }}>
      {icons[name] ?? "●"}
    </Text>
  );
}
