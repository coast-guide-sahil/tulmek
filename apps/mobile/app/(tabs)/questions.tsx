import { useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { FlashList } from "@shopify/flash-list";
import type { InterviewQuestion } from "@tulmek/core/domain";
import { useThemeColors } from "../../src/hooks/useThemeColors";

// Try to import questions — empty array when file is not yet populated
let questionsData: InterviewQuestion[] = [];
try {
  questionsData = require("@tulmek/content/hub/questions") as InterviewQuestion[];
} catch { /* empty until GEMINI_API_KEY populates the file */ }

export default function QuestionsScreen() {
  const t = useThemeColors();
  const [search, setSearch] = useState("");
  const [formatFilter, setFormatFilter] = useState<string | null>(null);

  const formats = useMemo(
    () => [...new Set(questionsData.map((q) => q.format))].filter((f) => f !== "unknown"),
    [],
  );

  const filtered = useMemo(
    () =>
      questionsData.filter((q) => {
        if (search && !q.question.toLowerCase().includes(search.toLowerCase())) return false;
        if (formatFilter && q.format !== formatFilter) return false;
        return true;
      }),
    [search, formatFilter],
  );

  if (questionsData.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 40, marginBottom: 16 }}>🧠</Text>
          <Text style={[styles.emptyTitle, { color: t.text }]}>Questions Coming Soon</Text>
          <Text style={[styles.emptyText, { color: t.textMuted }]}>
            AI is extracting real interview questions from 900+ articles.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: t.text }]}>Questions</Text>
        <Text style={[styles.subtitle, { color: t.textMuted }]}>
          {questionsData.length} extracted from articles
        </Text>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search questions..."
        placeholderTextColor={t.textMuted}
        style={[
          styles.search,
          { backgroundColor: t.card, color: t.text, borderColor: t.cardBorder },
        ]}
      />

      {/* Format filter chips */}
      <FlashList
        data={[null, ...formats]}
        horizontal
        renderItem={({ item }) => {
          const isActive = item === formatFilter;
          return (
            <TouchableOpacity
              onPress={() => setFormatFilter(item === formatFilter ? null : item)}
              style={[
                styles.chip,
                { backgroundColor: isActive ? t.chipActiveBg : t.chipBg },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={{
                  color: isActive ? t.chipActiveText : t.textMuted,
                  fontSize: 13,
                  fontWeight: "600" as const,
                }}
              >
                {item === null
                  ? "All"
                  : item.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </Text>
            </TouchableOpacity>
          );
        }}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
      />

      <Text style={[styles.resultCount, { color: t.textMuted }]}>{filtered.length} questions</Text>

      {/* Question list */}
      <FlashList
        data={filtered}
        renderItem={({ item: q }) => (
          <View style={[styles.questionCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            <Text style={[styles.questionText, { color: t.text }]}>{q.question}</Text>
            <View style={styles.chipRow}>
              <DifficultyBadge difficulty={q.difficulty} />
              <View style={[styles.badge, { backgroundColor: "#3b82f620" }]}>
                <Text style={{ color: "#3b82f6", fontSize: 11, fontWeight: "600" as const }}>
                  {q.format.replace(/-/g, " ")}
                </Text>
              </View>
              {q.companies.slice(0, 2).map((c) => (
                <View key={c.slug} style={[styles.badge, { backgroundColor: t.chipBg }]}>
                  <Text style={{ color: t.textSecondary, fontSize: 11 }}>{c.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        keyExtractor={(q) => q.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: t.textMuted, textAlign: "center", marginTop: 40 }]}>
            No questions match your filters
          </Text>
        }
      />
    </View>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    easy: { bg: "#10b98120", text: "#10b981" },
    medium: { bg: "#f59e0b20", text: "#f59e0b" },
    hard: { bg: "#ef444420", text: "#ef4444" },
  };
  const colors = colorMap[difficulty];
  if (!colors) return null;
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={{ color: colors.text, fontSize: 11, fontWeight: "600" as const }}>
        {difficulty}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: "800" as const },
  subtitle: { fontSize: 13, marginTop: 4 },
  search: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, minHeight: 44, justifyContent: "center" as const },
  resultCount: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 13 },
  questionCard: { borderRadius: 12, borderWidth: 1, padding: 14 },
  questionText: { fontSize: 14, fontWeight: "500" as const, lineHeight: 20 },
  chipRow: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 6, marginTop: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  emptyState: { flex: 1, justifyContent: "center" as const, alignItems: "center" as const, padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: "700" as const, marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: "center" as const },
});
