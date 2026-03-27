import { View, Text, StyleSheet, ScrollView } from "react-native";
import { APP_NAME } from "@tulmek/config/constants";

/**
 * Home screen — shares APP_NAME from @tulmek/config.
 * Demonstrates code sharing between web, desktop, and mobile.
 */
export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{APP_NAME}</Text>
        <Text style={styles.subtitle}>Knowledge Hub</Text>
        <Text style={styles.description}>
          AI-powered interview prep content aggregator.
          Fresh content from 7 sources, refreshed every 3 hours.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  header: { padding: 24, paddingTop: 48 },
  title: { fontSize: 28, fontWeight: "bold", color: "#fafafa" },
  subtitle: { fontSize: 16, color: "#a1a1aa", marginTop: 4 },
  description: { fontSize: 14, color: "#71717a", marginTop: 12, lineHeight: 22 },
});
