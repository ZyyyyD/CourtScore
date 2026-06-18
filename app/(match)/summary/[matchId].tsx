import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenWrapper } from "../../../src/components/layout/ScreenWrapper";
import { Header } from "../../../src/components/layout/Header";
import { Card } from "../../../src/components/ui/Card";
import { Button } from "../../../src/components/ui/Button";
import { Colors } from "../../../src/theme/colors";
import { Typography } from "../../../src/theme/typography";
import { BorderRadius, Spacing } from "../../../src/theme/spacing";
import { useAuthStore } from "../../../src/stores/authStore";
import { useMatchStore } from "../../../src/stores/matchStore";
import { useMatchStats } from "../../../src/hooks/useMatchStats";
import { supabase } from "../../../src/lib/supabase";
import { formatDuration, formatPercent } from "../../../src/utils/formatters";
import type { MatchWithRelations, TeamSide } from "../../../src/types/match";

const pad = (n: number) => String(n).padStart(2, "0");

export default function SummaryScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { user, isGuest, guestName } = useAuthStore();
  const storeMatch = useMatchStore((s) => s.currentMatch);
  const storePlayers = useMatchStore((s) => s.players);
  const storeEvents = useMatchStore((s) => s.events);

  const [match, setMatch] = useState<MatchWithRelations | null>(null);
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (storeMatch?.id === matchId && storeEvents.length > 0) {
      setMatch({
        ...storeMatch,
        match_players: storePlayers,
        match_events: storeEvents,
      });
      return;
    }
    supabase
      .from("matches")
      .select("*, match_players(*), match_events(*)")
      .eq("id", matchId)
      .single()
      .then(({ data }) => {
        if (data) setMatch(data as MatchWithRelations);
      });
  }, [matchId]);

  const players = match?.match_players ?? [];
  const events = match?.match_events ?? [];

  useEffect(() => {
    const ids = players
      .map((p) => p.player_id)
      .filter((id): id is string => !!id && id !== user?.id);
    if (ids.length === 0) return;
    supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ids)
      .then(({ data }) => {
        const map: Record<string, string> = {};
        for (const p of data ?? []) {
          if (p.full_name) map[p.id] = p.full_name;
        }
        setProfilesMap(map);
      });
  }, [players.length]);

  const stats = useMatchStats(events);

  if (!match) {
    return (
      <ScreenWrapper>
        <Header title="Match Summary" />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const userId = user?.id ?? "";
  const myPlayer = players.find((p) => p.player_id === userId);
  const mySide: TeamSide = myPlayer?.team_side ?? "team_a";
  const oppSide: TeamSide = mySide === "team_a" ? "team_b" : "team_a";
  const iWon = match.winner_side === mySide;

  const myScore = mySide === "team_a" ? match.score_a : match.score_b;
  const oppScore = mySide === "team_a" ? match.score_b : match.score_a;
  const myStats = mySide === "team_a" ? stats.teamA : stats.teamB;
  const oppStats = mySide === "team_a" ? stats.teamB : stats.teamA;

  const myName = isGuest
    ? guestName
    : (user?.user_metadata?.full_name ?? "You");
  const oppPlayer = players.find((p) => p.team_side === oppSide);
  const oppName =
    (oppPlayer?.player_id ? profilesMap[oppPlayer.player_id] : null) ??
    oppPlayer?.guest_name ??
    "Opponent";

  const duration = match.started_at
    ? formatDuration(match.started_at, match.completed_at)
    : null;

  return (
    <ScreenWrapper>
      <Header title="Match Summary" showBack />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Score header */}
        <Card style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            {/* My side */}
            <View style={styles.scoreTeam}>
              <Text style={styles.teamLabel}>TEAM A</Text>
              <View style={[styles.scoreBox, iWon && styles.scoreBoxWinner]}>
                <Text
                  style={[
                    styles.scoreNumber,
                    iWon && styles.scoreNumberWinner,
                  ]}>
                  {pad(myScore)}
                </Text>
              </View>
              <Text style={[styles.resultLabel, iWon && styles.resultLabelWin]}>
                {iWon ? "Winner" : "Opponent"}
              </Text>
            </View>

            <View style={styles.scoreSep} />

            {/* Opponent side */}
            <View style={styles.scoreTeam}>
              <Text style={styles.teamLabel}>TEAM B</Text>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreNumber}>{pad(oppScore)}</Text>
              </View>
              <Text style={styles.resultLabel}>
                {iWon ? "Opponent" : "Winner"}
              </Text>
            </View>
          </View>

          {duration && (
            <Text style={styles.duration}>Match duration: {duration}</Text>
          )}
        </Card>

        {/* Player performance heading */}
        <Text style={styles.perfTitle}>{"Player\nPerformance"}</Text>

        {/* My player card */}
        <PlayerCard
          number={1}
          name={myName}
          winners={myStats.winners}
          errors={myStats.errors}
          aces={myStats.aces}
          winRate={myStats.winRate}
          isMvp={iWon}
        />

        {/* Opponent player card */}
        <PlayerCard
          number={2}
          name={oppName}
          winners={oppStats.winners}
          errors={oppStats.errors}
          aces={oppStats.aces}
          winRate={oppStats.winRate}
          isMvp={!iWon}
        />

        {/* Match info */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoRow}>
            {match.match_type === "singles" ? "Singles" : "Doubles"}
            {"  ·  "}First to {match.scoring_target}
            {"  ·  "}
            {stats.totalRallies} rallies
          </Text>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label="Play Again"
            onPress={() => router.push("/(app)/create-match")}
            variant="primary"
            style={{ flex: 1 }}
          />
          <Button
            label="Home"
            onPress={() => router.replace("/(app)/home")}
            variant="secondary"
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function PlayerCard({
  number,
  name,
  winners,
  errors,
  aces,
  winRate,
  isMvp,
}: {
  number: number;
  name: string;
  winners: number;
  errors: number;
  aces: number;
  winRate: number;
  isMvp: boolean;
}) {
  return (
    <Card style={styles.playerCard}>
      <View style={styles.playerHeader}>
        <Text style={styles.playerNum}>PLAYER {number}</Text>
        {isMvp && (
          <View style={styles.mvpBadge}>
            <Text style={styles.mvpText}>MVP</Text>
          </View>
        )}
      </View>

      <Text style={styles.playerName}>{name}</Text>

      <View style={styles.statGrid}>
        <View style={styles.statRow}>
          <StatBox label="WINNERS" value={winners} />
          <StatBox label="UNFORCED ERRORS" value={errors} />
        </View>
        <View style={styles.statRow}>
          <StatBox label="ACES" value={aces} />
          <StatBox label="WIN %" value={formatPercent(winRate)} />
        </View>
      </View>
    </Card>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { ...Typography.bodyLg, color: Colors.onSurfaceVariant },
  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },

  // Score card
  scoreCard: { gap: Spacing.md },
  scoreRow: { flexDirection: "row", alignItems: "center" },
  scoreTeam: { flex: 1, alignItems: "center", gap: Spacing.sm },
  teamLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  scoreBox: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceContainerHigh,
  },
  scoreBoxWinner: {
    borderColor: Colors.secondary,
    borderWidth: 2,
  },
  scoreNumber: {
    ...Typography.scoreDisplay,
    color: Colors.onSurfaceVariant,
  },
  scoreNumberWinner: {
    color: "#fff",
  },
  resultLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  resultLabelWin: {
    color: Colors.secondary,
  },
  scoreSep: {
    width: 1,
    height: 60,
    backgroundColor: Colors.outlineVariant,
    marginHorizontal: Spacing.md,
  },
  duration: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    fontSize: 10,
  },

  // Performance heading
  perfTitle: {
    ...Typography.headlineLg,
    color: Colors.onSurface,
    lineHeight: 40,
  },

  // Player cards
  playerCard: { gap: Spacing.md },
  playerHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  playerNum: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  mvpBadge: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  mvpText: { ...Typography.labelCaps, color: Colors.white, fontSize: 10 },
  playerName: { ...Typography.headlineMd, color: Colors.onSurface },

  // Stat grid
  statGrid: { gap: Spacing.sm },
  statRow: { flexDirection: "row", gap: Spacing.sm },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    gap: 6,
  },
  statLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  statValue: { ...Typography.headlineMd, color: Colors.onSurface },

  // Match info + actions
  infoCard: { paddingVertical: Spacing.md },
  infoRow: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
  },
  actions: { flexDirection: "row", gap: Spacing.md },
});
