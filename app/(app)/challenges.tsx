import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFocusEffect, router } from "expo-router";
import { useMatchStore } from "../../src/stores/matchStore";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import type { BottomSheetDefaultBackdropProps } from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types";
import { Ionicons } from "@expo/vector-icons";
import { ScreenWrapper } from "../../src/components/layout/ScreenWrapper";
import { Header } from "../../src/components/layout/Header";
import { Input } from "../../src/components/ui/Input";
import { Button } from "../../src/components/ui/Button";
import { Card } from "../../src/components/ui/Card";
import { Colors } from "../../src/theme/colors";
import { Typography } from "../../src/theme/typography";
import { BorderRadius, Spacing } from "../../src/theme/spacing";
import { useAuthStore } from "../../src/stores/authStore";
import { supabase } from "../../src/lib/supabase";
import {
  fetchPlayers,
  fetchIncomingChallenges,
  fetchOutgoingChallenges,
  fetchAcceptedOutgoing,
  sendChallenge,
  respondChallenge,
  acceptAndCreateMatch,
  subscribeToChallenges,
  subscribeToOutgoingChallenges,
} from "../../src/hooks/useChallenges";
import type { Profile, Challenge } from "../../src/types/challenge";

export default function ChallengesScreen() {
  const { user, isGuest } = useAuthStore();
  const { setMyTeamSide } = useMatchStore();
  const userId = user?.id ?? "";

  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState<Profile[]>([]);
  const [incoming, setIncoming] = useState<Challenge[]>([]);
  // IDs of players we've already challenged (pending)
  const [outgoingIds, setOutgoingIds] = useState<Set<string>>(new Set());
  // Map of challenger_id → challenge for players who challenged us
  const [incomingByPlayer, setIncomingByPlayer] = useState<Record<string, Challenge>>({});
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Profile | null>(null);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["60%"], []);

  const loadPlayers = useCallback(async () => {
    if (!userId) return;
    setLoadingPlayers(true);
    const data = await fetchPlayers(userId, search);
    setPlayers(data);
    setLoadingPlayers(false);
  }, [userId, search]);

  const loadIncoming = useCallback(async () => {
    if (!userId) return;
    const [inc, out] = await Promise.all([
      fetchIncomingChallenges(userId),
      fetchOutgoingChallenges(userId),
    ]);
    setIncoming(inc);
    setOutgoingIds(new Set(out.map((c) => c.challenged_id as string)));
    // Build a quick lookup: challenger_id → challenge
    const byPlayer: Record<string, Challenge> = {};
    inc.forEach((c) => { byPlayer[c.challenger_id] = c; });
    setIncomingByPlayer(byPlayer);
  }, [userId]);

  // Reload whenever the tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadIncoming();
      loadPlayers();
    }, [loadIncoming, loadPlayers]),
  );

  // Debounce search
  useEffect(() => {
    const t = setTimeout(loadPlayers, 300);
    return () => clearTimeout(t);
  }, [loadPlayers]);

  // Realtime: incoming challenges (challenged side)
  useEffect(() => {
    if (!userId) return;
    const channel = subscribeToChallenges(userId, loadIncoming);
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Realtime: outgoing challenges accepted (challenger side)
  useEffect(() => {
    if (!userId) return;
    const channel = subscribeToOutgoingChallenges(userId, (matchId) => {
      setMyTeamSide("team_a");
      router.push(`/(match)/lobby/${matchId}` as never);
    });
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Poll every 3s while there are pending outgoing challenges (realtime fallback)
  useEffect(() => {
    if (!userId || outgoingIds.size === 0) return;
    const interval = setInterval(async () => {
      const accepted = await fetchAcceptedOutgoing(userId);
      if (accepted) {
        clearInterval(interval);
        setMyTeamSide("team_a");
        router.push(`/(match)/lobby/${accepted.matchId}` as never);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [userId, outgoingIds.size]);

  const handleChallenge = async (target: Profile) => {
    if (!userId) return;
    setSendingTo(target.id);
    const error = await sendChallenge(userId, target.id);
    setSendingTo(null);
    if (error) {
      Alert.alert("Error", error);
      return;
    }
    setOutgoingIds((prev) => new Set([...prev, target.id]));
    sheetRef.current?.close();
  };

  const handleRespond = async (
    challengeId: string,
    challengerId: string,
    status: "accepted" | "declined",
  ) => {
    setRespondingTo(challengeId);

    if (status === "accepted") {
      const result = await acceptAndCreateMatch(challengeId, challengerId, userId);
      setRespondingTo(null);
      if ("error" in result) {
        Alert.alert("Error", result.error);
        return;
      }
      setIncoming((prev) => prev.filter((c) => c.id !== challengeId));
      setIncomingByPlayer((prev) => {
        const next = { ...prev };
        delete next[challengerId];
        return next;
      });
      setMyTeamSide("team_b");
      router.push(`/(match)/lobby/${result.matchId}` as never);
    } else {
      const error = await respondChallenge(challengeId, status);
      setRespondingTo(null);
      if (error) {
        Alert.alert("Error", error);
        return;
      }
      setIncoming((prev) => prev.filter((c) => c.id !== challengeId));
      setIncomingByPlayer((prev) => {
        const next = { ...prev };
        delete next[challengerId];
        return next;
      });
    }
  };

  const openProfile = (player: Profile) => {
    setSelectedPlayer(player);
    sheetRef.current?.expand();
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetDefaultBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
      />
    ),
    [],
  );

  const renderPlayer = ({ item }: { item: Profile }) => {
    const outgoing = outgoingIds.has(item.id);
    const incomingChallenge = incomingByPlayer[item.id];
    let btnLabel = "CHALLENGE";
    let btnStyle: object[] = [styles.challengeBtn];
    let btnTextStyle: object[] = [styles.challengeBtnText];
    if (outgoing) {
      btnLabel = "SENT";
      btnStyle = [styles.challengeBtn, styles.challengeBtnPending];
      btnTextStyle = [styles.challengeBtnText, styles.challengeBtnTextPending];
    } else if (incomingChallenge) {
      btnLabel = "ACCEPT";
      btnStyle = [styles.challengeBtn, styles.challengeBtnAccept];
    }

    return (
      <Pressable style={styles.playerCard} onPress={() => openProfile(item)}>
        <View style={styles.playerAvatar}>
          <Text style={styles.playerAvatarText}>
            {(item.full_name ?? "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{item.full_name ?? "Unknown"}</Text>
          {item.nickname ? (
            <Text style={styles.playerNickname}>"{item.nickname}"</Text>
          ) : null}
          {item.dupr_rating ? (
            <Text style={styles.playerDupr}>DUPR {item.dupr_rating}</Text>
          ) : null}
        </View>
        {!isGuest && (
          <Pressable
            style={btnStyle}
            onPress={() =>
              incomingChallenge
                ? handleRespond(incomingChallenge.id, item.id, "accepted")
                : handleChallenge(item)
            }
            disabled={outgoing || sendingTo === item.id || respondingTo === incomingChallenge?.id}>
            {sendingTo === item.id || respondingTo === incomingChallenge?.id ? (
              <ActivityIndicator size="small" color={Colors.charcoal} />
            ) : (
              <Text style={btnTextStyle}>{btnLabel}</Text>
            )}
          </Pressable>
        )}
      </Pressable>
    );
  };

  const renderIncoming = (c: Challenge) => {
    const challenger = c.challenger;
    const isResponding = respondingTo === c.id;
    return (
      <Card key={c.id} style={styles.incomingCard}>
        <View style={styles.incomingHeader}>
          <View style={styles.playerAvatar}>
            <Text style={styles.playerAvatarText}>
              {(challenger?.full_name ?? "?").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>
              {challenger?.full_name ?? "Someone"}
            </Text>
            {challenger?.nickname ? (
              <Text style={styles.playerNickname}>"{challenger.nickname}"</Text>
            ) : null}
            <Text style={styles.challengeTag}>challenged you!</Text>
          </View>
        </View>
        <View style={styles.incomingActions}>
          <Button
            label="Decline"
            variant="secondary"
            onPress={() => handleRespond(c.id, c.challenger_id, "declined")}
            loading={isResponding}
            style={{ flex: 1 }}
          />
          <Button
            label="Accept"
            onPress={() => handleRespond(c.id, c.challenger_id, "accepted")}
            loading={isResponding}
            style={{ flex: 1 }}
          />
        </View>
      </Card>
    );
  };

  return (
    <ScreenWrapper>
      <Header title="Challenge" showBack={false} />

      <View style={styles.searchBar}>
        <Ionicons
          name="search"
          size={18}
          color={Colors.outline}
          style={styles.searchIcon}
        />
        <View style={styles.searchInput}>
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search players..."
            multiline={false}
          />
        </View>
      </View>

      <FlatList
        data={players}
        keyExtractor={(p) => p.id}
        renderItem={renderPlayer}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await Promise.all([loadPlayers(), loadIncoming()]);
              setRefreshing(false);
            }}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          <>
            {incoming.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>INCOMING CHALLENGES</Text>
                {incoming.map(renderIncoming)}
              </View>
            )}
            <Text style={styles.sectionLabel}>PLAYERS</Text>
          </>
        }
        ListEmptyComponent={
          loadingPlayers ? (
            <ActivityIndicator
              color={Colors.primary}
              style={{ marginTop: Spacing.xl }}
            />
          ) : (
            <View style={styles.empty}>
              <Ionicons
                name="people-outline"
                size={40}
                color={Colors.outline}
              />
              <Text style={styles.emptyText}>
                {search ? "No players found" : "No players yet"}
              </Text>
            </View>
          )
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Player Profile Sheet */}
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.handle}>
        <BottomSheetView style={styles.sheetContent}>
          {selectedPlayer && (
            <>
              <View style={styles.sheetAvatar}>
                <Text style={styles.sheetAvatarText}>
                  {(selectedPlayer.full_name ?? "?").charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.sheetName}>
                {selectedPlayer.full_name ?? "Unknown"}
              </Text>
              {selectedPlayer.nickname ? (
                <Text style={styles.sheetNickname}>
                  "{selectedPlayer.nickname}"
                </Text>
              ) : null}
              {selectedPlayer.dupr_rating ? (
                <View style={styles.duprBadge}>
                  <Text style={styles.duprLabel}>DUPR</Text>
                  <Text style={styles.duprValue}>
                    {selectedPlayer.dupr_rating}
                  </Text>
                </View>
              ) : null}
              {selectedPlayer.bio ? (
                <Text style={styles.sheetBio}>{selectedPlayer.bio}</Text>
              ) : null}
              {!isGuest && (
                <Button
                  label={
                    outgoingIds.has(selectedPlayer.id)
                      ? "Challenge Sent"
                      : "Send Challenge"
                  }
                  onPress={() => handleChallenge(selectedPlayer)}
                  loading={sendingTo === selectedPlayer.id}
                  disabled={outgoingIds.has(selectedPlayer.id)}
                  fullWidth
                  style={styles.sheetChallengeBtn}
                />
              )}
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
    gap: Spacing.sm,
  },
  searchIcon: { marginTop: 2 },
  searchInput: { width: "100%", flex: 1 },
  list: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  section: { gap: Spacing.sm, marginBottom: Spacing.md },
  sectionLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.xs,
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  playerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  playerAvatarText: {
    ...Typography.bodyLg,
    fontWeight: "700",
    color: Colors.primary,
  },
  playerInfo: { flex: 1, gap: 2 },
  playerName: {
    ...Typography.bodyLg,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  playerNickname: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    fontStyle: "italic",
  },
  playerDupr: { ...Typography.labelSm, color: Colors.gold },
  challengeBtn: {
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    minWidth: 88,
    alignItems: "center",
  },
  challengeBtnPending: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  challengeBtnAccept: {
    backgroundColor: Colors.primary,
  },
  challengeBtnText: { ...Typography.labelCaps, color: Colors.charcoal },
  challengeBtnTextPending: { color: Colors.onSurfaceVariant },
  separator: { height: 8 },
  empty: {
    alignItems: "center",
    gap: Spacing.md,
    paddingTop: Spacing.xxl,
  },
  emptyText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  incomingCard: { gap: Spacing.md },
  incomingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  challengeTag: { ...Typography.labelCaps, color: Colors.primary },
  incomingActions: { flexDirection: "row", gap: Spacing.sm },
  sheetBg: { backgroundColor: Colors.surfaceContainerHigh },
  handle: { backgroundColor: Colors.outline },
  sheetContent: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.md,
  },
  sheetAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: Spacing.xs,
  },
  sheetAvatarText: { ...Typography.headlineMd, color: Colors.primary },
  sheetName: { ...Typography.headlineMd, color: Colors.onSurface },
  sheetNickname: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    fontStyle: "italic",
  },
  duprBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  duprLabel: { ...Typography.labelCaps, color: Colors.gold },
  duprValue: { ...Typography.bodyMd, color: Colors.gold, fontWeight: "700" },
  sheetBio: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 22,
  },
  sheetChallengeBtn: { marginTop: Spacing.sm },
});
