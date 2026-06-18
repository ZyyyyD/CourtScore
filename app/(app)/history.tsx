import React, { useEffect } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenWrapper } from "../../src/components/layout/ScreenWrapper";
import { Badge } from "../../src/components/ui/Badge";
import { Colors } from "../../src/theme/colors";
import { Typography } from "../../src/theme/typography";
import { BorderRadius, Spacing } from "../../src/theme/spacing";
import { useAuthStore } from "../../src/stores/authStore";
import { useHistoryStore } from "../../src/stores/historyStore";
import { formatDate } from "../../src/utils/formatters";
import type { MatchWithRelations } from "../../src/types/match";

type Filter = "all" | "wins" | "losses";

export default function HistoryScreen() {
  const { user } = useAuthStore();
  const { matches, filter, setFilter, loadHistory } = useHistoryStore();

  useEffect(() => {
    if (user?.id) loadHistory(user.id);
  }, [user?.id]);

  const filtered = matches.filter((m) => {
    if (filter === "all") return true;
    const myPlayer = m.match_players.find((p) => p.player_id === user?.id);
    const won = m.winner_side === myPlayer?.team_side;
    return filter === "wins" ? won : !won;
  });

  const FilterBtn = ({ f, label }: { f: Filter; label: string }) => (
    <Pressable
      onPress={() => setFilter(f)}
      style={[styles.filterBtn, filter === f && styles.filterActive]}>
      <Text
        style={[styles.filterText, filter === f && styles.filterTextActive]}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>Match History</Text>
      </View>
      <View style={styles.subheader}>
        <View style={styles.filters}>
          <FilterBtn f="all" label="ALL" />
          <FilterBtn f="wins" label="WINS" />
          <FilterBtn f="losses" label="LOSSES" />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/(match)/summary/${item.id}` as never)}>
            <View style={styles.cardLeft}>
              <Text style={styles.code}>{item.match_code}</Text>
              <Text style={styles.date}>
                {formatDate(item.completed_at ?? item.created_at)}
              </Text>
              <Text style={styles.type}>
                {item.match_type === "singles" ? "Singles" : "Doubles"} · To{" "}
                {item.scoring_target}
              </Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.score}>
                {item.score_a} – {item.score_b}
              </Text>
              <Badge
                label={
                  item.winner_side ===
                  item.match_players.find((p) => p.player_id === user?.id)
                    ?.team_side
                    ? "WIN"
                    : "LOSS"
                }
                variant={
                  item.winner_side ===
                  item.match_players.find((p) => p.player_id === user?.id)
                    ?.team_side
                    ? "win"
                    : "loss"
                }
              />
            </View>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={40} color={Colors.outline} />
            <Text style={styles.emptyText}>No matches found</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  subheader: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },

  title: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    textAlign: "center",
  },
  filters: { flexDirection: "row", gap: Spacing.sm },
  filterBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainer,
  },
  filterActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primary,
  },
  filterText: { ...Typography.labelCaps, color: Colors.onSurfaceVariant },
  filterTextActive: { color: Colors.primary },
  list: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  separator: { height: 1, backgroundColor: Colors.outlineVariant },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  cardLeft: { gap: 3 },
  cardRight: { alignItems: "flex-end", gap: 4 },
  code: { ...Typography.bodyLg, fontWeight: "700", color: Colors.onSurface },
  date: { ...Typography.labelSm, color: Colors.onSurfaceVariant },
  type: { ...Typography.labelSm, color: Colors.onSurfaceVariant },
  score: { ...Typography.bodyLg, fontWeight: "700", color: Colors.onSurface },
  empty: { alignItems: "center", gap: Spacing.md, paddingTop: Spacing.xxl },
  emptyText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
});
