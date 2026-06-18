import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Pressable,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { ScreenWrapper } from "../../../src/components/layout/ScreenWrapper";
import { SyncIndicator } from "../../../src/components/match/SyncIndicator";
import { Colors } from "../../../src/theme/colors";
import { Typography } from "../../../src/theme/typography";
import { BorderRadius, Spacing } from "../../../src/theme/spacing";
import { useAuthStore } from "../../../src/stores/authStore";
import { useMatchStore } from "../../../src/stores/matchStore";
import { useLobbySync } from "../../../src/hooks/useLiveMatch";
import { setReady, startMatch } from "../../../src/hooks/useMatch";
import { supabase } from "../../../src/lib/supabase";

export default function LobbyScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { user, isGuest, guestName } = useAuthStore();
  const {
    currentMatch,
    players,
    events,
    connectionStatus,
    setMatch,
    setPlayers,
    myTeamSide,
  } = useMatchStore();
  const [loading, setLoading] = useState(false);
  const [profilesMap, setProfilesMap] = useState<
    Record<string, { full_name: string | null; dupr_rating: string | null }>
  >({});

  const fetchMatchData = useCallback(async () => {
    const { data } = await supabase
      .from("matches")
      .select("*, match_players(*), match_events(*)")
      .eq("id", matchId)
      .single();
    if (data) {
      setMatch(data, data.match_players, data.match_events);

      const playerIds = (data.match_players as { player_id: string | null }[])
        .map((p) => p.player_id)
        .filter((id): id is string => !!id);

      if (playerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, dupr_rating")
          .in("id", playerIds);

        const map: Record<
          string,
          { full_name: string | null; dupr_rating: string | null }
        > = {};
        for (const p of profiles ?? []) {
          map[p.id] = { full_name: p.full_name, dupr_rating: p.dupr_rating };
        }
        setProfilesMap(map);
      }
    }
  }, [matchId]);

  useEffect(() => {
    fetchMatchData();
  }, [fetchMatchData]);

  useLobbySync(matchId);

  useEffect(() => {
    if (currentMatch?.status === "active") {
      router.replace(`/(match)/live/${matchId}` as never);
    }
  }, [currentMatch?.status]);

  useEffect(() => {
    if (!matchId || matchId.startsWith("local-")) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("matches")
        .select("status")
        .eq("id", matchId)
        .single();
      if (data?.status === "active") {
        clearInterval(interval);
        router.replace(`/(match)/live/${matchId}` as never);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [matchId]);

  const userId = user?.id ?? "";
  const isDoubles = currentMatch?.match_type === "doubles";
  const slotsPerTeam = isDoubles ? 2 : 1;

  const myPlayer = myTeamSide
    ? players.find((p) => p.team_side === myTeamSide)
    : players.find((p) => p.player_id === userId);

  const isCreator =
    myTeamSide === "team_a" || currentMatch?.created_by === userId;

  const teamAPlayers = players.filter((p) => p.team_side === "team_a");
  const teamBPlayers = players.filter((p) => p.team_side === "team_b");

  const minPlayers = isDoubles ? 4 : 2;
  const allReady =
    players.length >= minPlayers && players.every((p) => p.is_ready);

  const myName = isGuest
    ? guestName
    : (user?.user_metadata?.full_name ?? "You");

  const getPlayerName = (player: (typeof players)[0]) => {
    if (player.player_id === userId) return myName;
    if (player.player_id && profilesMap[player.player_id]?.full_name) {
      return profilesMap[player.player_id].full_name!;
    }
    return player.guest_name ?? "Player";
  };

  const getDupr = (player: (typeof players)[0]): string | null => {
    if (player.player_id === userId) {
      return user?.user_metadata?.dupr_rating ?? null;
    }
    return player.player_id
      ? (profilesMap[player.player_id]?.dupr_rating ?? null)
      : null;
  };

  const isMyPlayer = (player: (typeof players)[0]) =>
    player.player_id === userId ||
    (myTeamSide != null && player.team_side === myTeamSide);

  const handleReadyToggle = async () => {
    if (!myPlayer) return;
    await setReady(myPlayer.id, !myPlayer.is_ready);
    setPlayers(
      players.map((p) =>
        p.id === myPlayer.id ? { ...p, is_ready: !myPlayer.is_ready } : p,
      ),
    );
  };

  const handleStart = async () => {
    if (!allReady) {
      Alert.alert("Not ready", "All players must be ready to start.");
      return;
    }
    setLoading(true);
    const isLocalMatch = matchId.startsWith("local-");
    const err = await startMatch(matchId, isLocalMatch);
    setLoading(false);
    if (err) {
      Alert.alert("Error", `Could not start match: ${err}`);
      return;
    }
    if (currentMatch) {
      setMatch({ ...currentMatch, status: "active" }, players, events);
    }
  };

  const handleCopyCode = async () => {
    if (!currentMatch?.match_code) return;
    await Clipboard.setStringAsync(currentMatch.match_code);
    Alert.alert("Copied!", `${currentMatch.match_code} copied to clipboard.`);
  };

  const handleLeaveLobby = () => {
    Alert.alert("Leave Lobby", "Are you sure you want to leave?", [
      { text: "Cancel", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: () => router.back() },
    ]);
  };

  const needsPartner =
    isDoubles &&
    (myTeamSide === "team_a"
      ? teamAPlayers.length < 2
      : teamBPlayers.length < 2);

  const startDisabled = !allReady || loading || players.length < minPlayers;

  const startLabel =
    players.length < minPlayers
      ? isDoubles
        ? "Waiting for players..."
        : "Waiting for opponent..."
      : allReady
        ? "START MATCH"
        : isDoubles
          ? "Waiting for player"
          : "Waiting for opponent";

  if (!currentMatch) {
    return (
      <ScreenWrapper>
        <LobbyAppBar connectionStatus={connectionStatus} />
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading match...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <LobbyAppBar connectionStatus={connectionStatus} onRefresh={fetchMatchData} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Match Code */}
        <View style={styles.codeSection}>
          <Text style={styles.codeLabel}>MATCH CODE</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>{currentMatch.match_code}</Text>
            <Pressable
              onPress={handleCopyCode}
              style={styles.copyBtn}
              hitSlop={12}>
              <Ionicons name="copy-outline" size={18} color={Colors.gold} />
            </Pressable>
          </View>
        </View>

        {/* Team A — HOME */}
        <View style={styles.teamSection}>
          <View style={styles.teamHeader}>
            <View style={styles.teamAccentBar} />
            <Text style={styles.teamLabel}>TEAM 01</Text>
          </View>

          {teamAPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              name={getPlayerName(player)}
              isReady={player.is_ready}
              isYou={isMyPlayer(player)}
              dupr_rating={getDupr(player)}
              onToggle={isMyPlayer(player) ? handleReadyToggle : undefined}
            />
          ))}

          {Array.from({ length: slotsPerTeam - teamAPlayers.length }).map(
            (_, i) => (
              <InvitePartnerCard key={i} />
            ),
          )}
        </View>

        {/* VS divider */}
        <View style={styles.vsDivider}>
          <View style={styles.vsLine} />
          <Text style={styles.vsText}>VS</Text>
          <View style={styles.vsLine} />
        </View>

        {/* Team B — AWAY */}
        <View style={styles.teamSection}>
          <View style={styles.teamHeader}>
            <View style={styles.teamAccentBar} />
            <Text style={styles.teamLabel}>TEAM 02 </Text>
          </View>

          {teamBPlayers.length === 0 ? (
            <View style={styles.waitingCard}>
              <Ionicons
                name="time-outline"
                size={20}
                color={Colors.onSurfaceVariant}
              />
              <Text style={styles.waitingCardText}>
                Waiting for opponent to join...
              </Text>
            </View>
          ) : (
            teamBPlayers.map((player) => (
              <PlayerCard
                key={player.id}
                name={getPlayerName(player)}
                isReady={player.is_ready}
                isYou={isMyPlayer(player)}
                dupr_rating={getDupr(player)}
                onToggle={isMyPlayer(player) ? handleReadyToggle : undefined}
              />
            ))
          )}

          {teamBPlayers.length > 0 &&
            Array.from({ length: slotsPerTeam - teamBPlayers.length }).map(
              (_, i) => <InvitePartnerCard key={i} />,
            )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable
          onPress={isCreator ? handleStart : undefined}
          disabled={!isCreator || startDisabled}
          style={[
            styles.startBtn,
            (!isCreator || startDisabled) && styles.startBtnDisabled,
          ]}>
          {loading ? null : (
            <Ionicons
              name="play"
              size={14}
              color={Colors.charcoal}
              style={styles.startIcon}
            />
          )}
          <Text style={styles.startBtnText}>{startLabel}</Text>
        </Pressable>

        {needsPartner && (
          <Text style={styles.footerNote}>
            Waiting for your partner to join before starting...
          </Text>
        )}

        <View style={styles.footerActions}>
          <Pressable style={styles.outlineBtn}>
            <Ionicons
              name="settings-outline"
              size={13}
              color={Colors.secondary}
            />
            <Text style={styles.outlineBtnText}>MATCH RULES</Text>
          </Pressable>
          <Pressable style={styles.outlineBtn} onPress={handleLeaveLobby}>
            <Ionicons name="exit-outline" size={13} color={Colors.secondary} />
            <Text style={styles.outlineBtnText}>LEAVE LOBBY</Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LobbyAppBar({
  connectionStatus,
  onRefresh,
}: {
  connectionStatus: string;
  onRefresh?: () => void;
}) {
  return (
    <View style={styles.appBar}>
      <View style={styles.appBarLeft}>
        <Ionicons
          name="person-circle-outline"
          size={22}
          color={Colors.primary}
        />
        <Text style={styles.appBarTitle}>CourtScore</Text>
      </View>
      <SyncIndicator status={connectionStatus as any} />
      <Pressable hitSlop={12} onPress={onRefresh}>
        <Ionicons
          name="refresh-circle-outline"
          size={26}
          color={Colors.onSurfaceVariant}
        />
      </Pressable>
    </View>
  );
}

function PlayerCard({
  name,
  isReady,
  isYou,
  onToggle,
  dupr_rating,
}: {
  name: string;
  isReady: boolean;
  isYou: boolean;
  onToggle?: () => void;
  dupr_rating: string | null;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={styles.playerCard}
      disabled={!onToggle}>
      <View style={styles.playerAvatar}>
        <Ionicons name="person" size={22} color={Colors.primary} />
      </View>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.playerChips}>
          {dupr_rating ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>DUPR {dupr_rating}</Text>
            </View>
          ) : null}
        </View>
      </View>
      {isYou ? (
        <View style={styles.youBadge}>
          <Text style={styles.youBadgeText}>Ready</Text>
        </View>
      ) : (
        <View style={[styles.statusBadge, isReady && styles.statusBadgeReady]}>
          <Text
            style={[
              styles.statusBadgeText,
              isReady && styles.statusBadgeTextReady,
            ]}>
            {isReady ? "READY" : "WAIT"}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function InvitePartnerCard() {
  return (
    <View style={styles.inviteCard}>
      <Ionicons name="person-add-outline" size={28} color={Colors.gold} />
      <Text style={styles.inviteLabel}>INVITE PARTNER</Text>
      <Text style={styles.inviteSubtext}>Waiting for teammate...</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // App bar
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  appBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  appBarTitle: {
    ...Typography.bodyLg,
    color: Colors.onSurface,
    fontWeight: "700",
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
  },

  // Match code
  codeSection: { alignItems: "center", gap: Spacing.xs },
  codeLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    letterSpacing: 2,
  },
  codeBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  codeText: {
    fontFamily: "Anybody_700Bold",
    fontSize: 52,
    color: Colors.gold,
    textAlign: "center",
    letterSpacing: 2,
    lineHeight: 60,
  },
  copyBtn: {
    alignSelf: "flex-start",
    marginTop: Spacing.xs,
  },

  // Team sections
  teamSection: { gap: Spacing.sm },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 2,
  },
  teamAccentBar: {
    width: 3,
    height: 16,
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.sm,
  },
  teamLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1.5,
  },

  // Player card
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.court,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  playerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.courtAccent,
    alignItems: "center",
    justifyContent: "center",
  },
  playerInfo: { flex: 1, gap: 4 },
  playerName: {
    ...Typography.bodyLg,
    color: Colors.onSurface,
    fontWeight: "700",
  },
  playerChips: { flexDirection: "row", gap: Spacing.xs },
  chip: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipText: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  youBadge: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  youBadgeText: {
    ...Typography.labelCaps,
    color: Colors.charcoal,
    fontSize: 11,
  },
  statusBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  statusBadgeReady: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primary,
  },
  statusBadgeText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  statusBadgeTextReady: { color: Colors.primary },

  // Invite partner card
  inviteCard: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    borderStyle: "dashed",
    paddingVertical: Spacing.lg,
  },
  inviteLabel: {
    ...Typography.labelCaps,
    color: Colors.gold,
    letterSpacing: 1.5,
  },
  inviteSubtext: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },

  // Waiting card (opponent hasn't joined)
  waitingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingVertical: Spacing.lg,
  },
  waitingCardText: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },

  // VS divider
  vsDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginVertical: Spacing.xs,
  },
  vsLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.outlineVariant,
  },
  vsText: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    fontWeight: "700",
    letterSpacing: 2,
  },

  // Loading
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { ...Typography.bodyLg, color: Colors.onSurfaceVariant },

  // Footer
  footer: {
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.md,
    height: 52,
    gap: 6,
  },
  startBtnDisabled: { opacity: 0.45 },
  startIcon: { marginRight: 2 },
  startBtnText: {
    ...Typography.labelCaps,
    color: Colors.charcoal,
    fontSize: 14,
    letterSpacing: 1.5,
  },
  footerNote: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
  },
  footerActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  outlineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  outlineBtnText: {
    ...Typography.labelCaps,
    color: Colors.secondary,
    fontSize: 11,
  },
});
