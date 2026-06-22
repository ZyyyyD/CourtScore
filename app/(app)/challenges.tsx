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
  ScrollView,
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
import { usePresence } from "../../src/hooks/usePresence";
import {
  fetchFriends,
  fetchIncomingFriendRequests,
  fetchOutgoingFriendRequestIds,
  fetchFriendIds,
  sendFriendRequest,
  respondFriendRequest,
  subscribeToFriendships,
} from "../../src/hooks/useFriends";
import type { FriendRequest } from "../../src/hooks/useFriends";
import type { Profile, Challenge } from "../../src/types/challenge";

export default function ChallengesScreen() {
  const { user, isGuest } = useAuthStore();
  const { setMyTeamSide } = useMatchStore();
  const userId = user?.id ?? "";

  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState<Profile[]>([]);
  const [incoming, setIncoming] = useState<Challenge[]>([]);
  // IDs of pending outgoing challenges
  const [outgoingChallengeIds, setOutgoingChallengeIds] = useState<Set<string>>(new Set());
  // Player IDs of players we've challenged (pending) - for UI purposes
  const [outgoingPlayerIds, setOutgoingPlayerIds] = useState<Set<string>>(new Set());
  // Map of challenger_id → challenge for players who challenged us
  const [incomingByPlayer, setIncomingByPlayer] = useState<Record<string, Challenge>>({});
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Profile | null>(null);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  const [friends, setFriends] = useState<Profile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequestIds, setOutgoingRequestIds] = useState<Set<string>>(new Set());
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [sendingRequestTo, setSendingRequestTo] = useState<string | null>(null);
  const [respondingToRequest, setRespondingToRequest] = useState<string | null>(null);

  const onlineUsers = usePresence(userId);

  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["60%"], []);

  const challengeSheetRef = useRef<BottomSheet>(null);
  const challengeSnapPoints = useMemo(() => ["72%"], []);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

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
    setOutgoingChallengeIds(new Set(out.map((c) => c.id as string)));
    setOutgoingPlayerIds(new Set(out.map((c) => c.challenged_id as string)));
    // Build a quick lookup: challenger_id → challenge
    const byPlayer: Record<string, Challenge> = {};
    inc.forEach((c) => { byPlayer[c.challenger_id] = c; });
    setIncomingByPlayer(byPlayer);
  }, [userId]);

  const loadFriends = useCallback(async () => {
    if (!userId) return;
    const [fr, reqs, outReqIds, fIds] = await Promise.all([
      fetchFriends(userId),
      fetchIncomingFriendRequests(userId),
      fetchOutgoingFriendRequestIds(userId),
      fetchFriendIds(userId),
    ]);
    setFriends(fr);
    setFriendRequests(reqs);
    setOutgoingRequestIds(outReqIds);
    setFriendIds(fIds);
  }, [userId]);

  // Reload whenever the tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadIncoming();
      loadPlayers();
      loadFriends();
    }, [loadIncoming, loadPlayers, loadFriends]),
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

  // Realtime: friendship changes
  useEffect(() => {
    if (!userId) return;
    const channel = subscribeToFriendships(userId, loadFriends);
    return () => { supabase.removeChannel(channel); };
  }, [userId, loadFriends]);

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
    if (!userId || outgoingChallengeIds.size === 0) return;
    const interval = setInterval(async () => {
      const accepted = await fetchAcceptedOutgoing(userId, [...outgoingChallengeIds]);
      if (accepted) {
        clearInterval(interval);
        setMyTeamSide("team_a");
        router.push(`/(match)/lobby/${accepted.matchId}` as never);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [userId, outgoingChallengeIds.size]);

  const handleSendFriendRequest = async (target: Profile) => {
    if (!userId) return;
    setSendingRequestTo(target.id);
    const error = await sendFriendRequest(userId, target.id);
    setSendingRequestTo(null);
    if (error) {
      Alert.alert("Error", error);
      return;
    }
    setOutgoingRequestIds((prev) => new Set([...prev, target.id]));
  };

  const handleRespondFriendRequest = async (
    requestId: string,
    action: "accepted" | "ignored",
  ) => {
    setRespondingToRequest(requestId);
    const error = await respondFriendRequest(requestId, action);
    setRespondingToRequest(null);
    if (error) {
      Alert.alert("Error", error);
      return;
    }
    setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
    if (action === "accepted") loadFriends();
  };

  const handleChallenge = async (target: Profile) => {
    if (!userId) return;
    setSendingTo(target.id);
    const result = await sendChallenge(userId, target.id);
    setSendingTo(null);
    if (result.error) {
      Alert.alert("Error", result.error);
      return;
    }
    if (result.challengeId) {
      setOutgoingChallengeIds((prev) => new Set([...prev, result.challengeId!]));
      setOutgoingPlayerIds((prev) => new Set([...prev, target.id]));
    }
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

  const openChallengeDetail = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    challengeSheetRef.current?.expand();
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
    const outgoing = outgoingPlayerIds.has(item.id);
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

    const isOnline = onlineUsers.has(item.id);
    return (
      <Pressable style={styles.playerCard} onPress={() => openProfile(item)}>
        <View style={styles.avatarWrapper}>
          <View style={styles.playerAvatar}>
            <Text style={styles.playerAvatarText}>
              {(item.full_name ?? "?").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={[styles.presenceDot, isOnline ? styles.presenceDotOnline : styles.presenceDotOffline]} />
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

  const renderFriendRequest = (req: FriendRequest) => {
    const requester = req.requester;
    const isResponding = respondingToRequest === req.id;
    return (
      <Card key={req.id} style={styles.friendRequestCard}>
        <View style={styles.friendRequestHeader}>
          <View style={styles.incomingAvatar}>
            <Text style={styles.incomingAvatarText}>
              {(requester?.full_name ?? "?").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.incomingInfo}>
            <Text style={styles.incomingName}>
              {requester?.full_name ?? "Someone"}
            </Text>
            {requester?.nickname ? (
              <Text style={styles.playerNickname}>"{requester.nickname}"</Text>
            ) : null}
            <Text style={styles.friendTag}>wants to be friends</Text>
          </View>
        </View>
        <View style={styles.friendRequestActions}>
          <Button
            label="Ignore"
            variant="secondary"
            onPress={() => handleRespondFriendRequest(req.id, "ignored")}
            loading={isResponding}
            style={{ flex: 1 }}
          />
          <Button
            label="Accept"
            onPress={() => handleRespondFriendRequest(req.id, "accepted")}
            loading={isResponding}
            style={{ flex: 1 }}
          />
        </View>
      </Card>
    );
  };

  const renderFriendButton = (player: Profile) => {
    const isFriend = friendIds.has(player.id);
    const isPending = outgoingRequestIds.has(player.id);
    const incomingReq = friendRequests.find((r) => r.requester_id === player.id);
    const isLoading = sendingRequestTo === player.id ||
      respondingToRequest === incomingReq?.id;

    let label = "Add Friend";
    let btnStyle: object[] = [styles.friendBtn];
    let textStyle: object[] = [styles.friendBtnText];
    let onPress: (() => void) | undefined = () => handleSendFriendRequest(player);
    let disabled = false;

    if (isFriend) {
      label = "Friends ✓";
      btnStyle = [styles.friendBtn, styles.friendBtnDone];
      textStyle = [styles.friendBtnText, styles.friendBtnDoneText];
      onPress = undefined;
      disabled = true;
    } else if (isPending) {
      label = "Request Sent";
      btnStyle = [styles.friendBtn, styles.friendBtnDone];
      textStyle = [styles.friendBtnText, styles.friendBtnDoneText];
      disabled = true;
    } else if (incomingReq) {
      label = "Accept Request";
      btnStyle = [styles.friendBtn, styles.friendBtnAccept];
      textStyle = [styles.friendBtnText, styles.friendBtnAcceptText];
      onPress = () => handleRespondFriendRequest(incomingReq.id, "accepted");
    } else {
      btnStyle = [styles.friendBtn, styles.friendBtnActive];
      textStyle = [styles.friendBtnText, styles.friendBtnActiveText];
    }

    return (
      <Pressable
        key="friend-btn"
        style={btnStyle}
        onPress={onPress}
        disabled={disabled || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <Text style={textStyle}>{label}</Text>
        )}
      </Pressable>
    );
  };

  const renderIncoming = (c: Challenge) => {
    const challenger = c.challenger;
    return (
      <Pressable key={c.id} style={styles.incomingCard} onPress={() => openChallengeDetail(c)}>
        <View style={styles.avatarWrapper}>
          <View style={styles.incomingAvatar}>
            <Text style={styles.incomingAvatarText}>
              {(challenger?.full_name ?? "?").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={[styles.presenceDot, onlineUsers.has(c.challenger_id) ? styles.presenceDotOnline : styles.presenceDotOffline]} />
        </View>
        <View style={styles.incomingInfo}>
          <Text style={styles.incomingName}>{challenger?.full_name ?? "Someone"}</Text>
          {challenger?.nickname ? (
            <Text style={styles.playerNickname}>"{challenger.nickname}"</Text>
          ) : null}
          <Text style={styles.challengeTag}>challenged you!</Text>
        </View>
        <View style={styles.seeDetailsBtn}>
          <Text style={styles.seeDetailsBtnText}>SEE DETAILS</Text>
          <Ionicons name="chevron-forward" size={12} color={Colors.primary} />
        </View>
      </Pressable>
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
              await Promise.all([loadPlayers(), loadIncoming(), loadFriends()]);
              setRefreshing(false);
            }}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          <>
            {/* Friends carousel */}
            {!isGuest && friends.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>FRIENDS</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.friendsCarousel}>
                  {friends.map((friend) => {
                    const isOnline = onlineUsers.has(friend.id);
                    return (
                      <Pressable
                        key={friend.id}
                        style={styles.friendAvatarBtn}
                        onPress={() => openProfile(friend)}>
                        <View style={styles.avatarWrapper}>
                          <View style={styles.friendAvatar}>
                            <Text style={styles.friendAvatarText}>
                              {(friend.full_name ?? "?").charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={[styles.presenceDot, isOnline ? styles.presenceDotOnline : styles.presenceDotOffline]} />
                        </View>
                        <Text style={styles.friendName} numberOfLines={1}>
                          {(friend.full_name ?? "Unknown").split(" ")[0]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Friend requests */}
            {!isGuest && friendRequests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>FRIEND REQUESTS</Text>
                {friendRequests.map(renderFriendRequest)}
              </View>
            )}

            {/* Incoming challenges */}
            {incoming.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>INCOMING CHALLENGES</Text>
                {incoming.map(renderIncoming)}
              </View>
            )}

            <Text style={styles.sectionLabel}>ALL PLAYERS</Text>
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

      {/* Challenge Detail Sheet */}
      <BottomSheet
        ref={challengeSheetRef}
        index={-1}
        snapPoints={challengeSnapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.handle}>
        <BottomSheetView style={styles.challengeSheetContent}>
          {selectedChallenge && (() => {
            const challenger = selectedChallenge.challenger;
            const isResponding = respondingTo === selectedChallenge.id;
            return (
              <>
                {/* Avatar */}
                <View style={styles.challengeAvatarWrapper}>
                  <View style={styles.challengeAvatar}>
                    <Text style={styles.challengeAvatarText}>
                      {(challenger?.full_name ?? "?").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  {challenger?.dupr_rating ? (
                    <View style={styles.challengeDuprBadge}>
                      <Text style={styles.challengeDuprLabel}>DUPR</Text>
                      <Text style={styles.challengeDuprValue}>{challenger.dupr_rating}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Name */}
                <Text style={styles.challengeSheetName}>
                  {challenger?.full_name ?? "Someone"}
                </Text>
                {challenger?.nickname ? (
                  <Text style={styles.challengeSheetNickname}>
                    "{challenger.nickname}"
                  </Text>
                ) : null}

                {/* Format / Rules row */}
                <View style={styles.challengeInfoRow}>
                  <View style={styles.challengeInfoCell}>
                    <Text style={styles.challengeInfoLabel}>FORMAT</Text>
                    <Text style={styles.challengeInfoValue}>Singles</Text>
                  </View>
                  <View style={styles.challengeInfoDivider} />
                  <View style={styles.challengeInfoCell}>
                    <Text style={styles.challengeInfoLabel}>RULES</Text>
                    <Text style={styles.challengeInfoValue}>11pt Match</Text>
                  </View>
                </View>

                {/* Accept */}
                <Pressable
                  style={[styles.acceptChallengeBtn, isResponding && { opacity: 0.6 }]}
                  onPress={() => {
                    challengeSheetRef.current?.close();
                    handleRespond(selectedChallenge.id, selectedChallenge.challenger_id, "accepted");
                  }}
                  disabled={isResponding}>
                  {isResponding ? (
                    <ActivityIndicator size="small" color={Colors.charcoal} />
                  ) : (
                    <>
                      <Text style={styles.acceptChallengeBtnText}>ACCEPT CHALLENGE</Text>
                      <Ionicons name="chevron-forward" size={16} color={Colors.charcoal} />
                    </>
                  )}
                </Pressable>

                {/* Decline */}
                <Pressable
                  style={styles.declineChallengeBtn}
                  onPress={() => {
                    challengeSheetRef.current?.close();
                    handleRespond(selectedChallenge.id, selectedChallenge.challenger_id, "declined");
                  }}
                  disabled={isResponding}>
                  <Text style={styles.declineChallengeBtnText}>DECLINE CHALLENGE</Text>
                </Pressable>
              </>
            );
          })()}
        </BottomSheetView>
      </BottomSheet>

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
              <View style={styles.avatarWrapper}>
                <View style={styles.sheetAvatar}>
                  <Text style={styles.sheetAvatarText}>
                    {(selectedPlayer.full_name ?? "?").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={[
                  styles.presenceDot,
                  styles.presenceDotSheet,
                  onlineUsers.has(selectedPlayer.id) ? styles.presenceDotOnline : styles.presenceDotOffline,
                ]} />
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
                <>
                  {renderFriendButton(selectedPlayer)}
                  <Button
                    label={
                      outgoingPlayerIds.has(selectedPlayer.id)
                        ? "Challenge Sent"
                        : "Send Challenge"
                    }
                    onPress={() => handleChallenge(selectedPlayer)}
                    loading={sendingTo === selectedPlayer.id}
                    disabled={outgoingPlayerIds.has(selectedPlayer.id)}
                    fullWidth
                    style={styles.sheetChallengeBtn}
                  />
                </>
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
  avatarWrapper: {
    position: "relative",
  },
  presenceDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.surfaceContainer,
  },
  presenceDotOnline: { backgroundColor: Colors.success },
  presenceDotOffline: { backgroundColor: Colors.outline },
  presenceDotSheet: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderColor: Colors.surfaceContainerHigh,
    bottom: 2,
    right: 2,
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
  incomingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  incomingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  incomingAvatarText: { ...Typography.bodyMd, fontWeight: "700", color: Colors.primary },
  incomingInfo: { flex: 1, gap: 2 },
  incomingName: { ...Typography.bodyMd, fontWeight: "700", color: Colors.onSurface },
  challengeTag: { ...Typography.labelCaps, color: Colors.primary, fontSize: 10 },
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

  // Friends carousel
  friendsCarousel: { gap: Spacing.md, paddingBottom: Spacing.xs },
  friendAvatarBtn: { alignItems: "center", gap: 4, width: 58 },
  friendAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  friendAvatarText: {
    ...Typography.bodyLg,
    fontWeight: "700",
    color: Colors.primary,
  },
  friendName: {
    ...Typography.labelSm,
    color: Colors.onSurface,
    textAlign: "center",
  },

  // Friend request card
  friendRequestCard: { gap: Spacing.md },
  friendRequestHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  friendRequestActions: { flexDirection: "row", gap: Spacing.sm },

  // Friend request card label
  friendTag: { ...Typography.labelCaps, color: Colors.secondary },

  // Friend button in bottom sheet
  friendBtn: {
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  friendBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryContainer,
  },
  friendBtnAccept: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  friendBtnDone: {
    borderColor: Colors.outlineVariant,
    backgroundColor: "transparent",
  },
  friendBtnText: { ...Typography.labelCaps, color: Colors.onSurfaceVariant },
  friendBtnActiveText: { color: Colors.primary },
  friendBtnAcceptText: { color: Colors.onPrimary },
  friendBtnDoneText: { color: Colors.onSurfaceVariant },

  // SEE DETAILS button on incoming challenge card
  seeDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  seeDetailsBtnText: {
    ...Typography.labelCaps,
    color: Colors.primary,
    fontSize: 10,
  },

  // Challenge detail bottom sheet
  challengeSheetContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    alignItems: "center",
    gap: Spacing.md,
  },
  challengeAvatarWrapper: {
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  challengeAvatar: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  challengeAvatarText: {
    fontFamily: "Anybody_700Bold",
    fontSize: 42,
    color: Colors.primary,
  },
  challengeDuprBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    marginTop: -12,
  },
  challengeDuprLabel: {
    ...Typography.labelCaps,
    color: Colors.charcoal,
    fontSize: 10,
  },
  challengeDuprValue: {
    ...Typography.bodyMd,
    color: Colors.charcoal,
    fontWeight: "700",
    fontSize: 13,
  },
  challengeSheetName: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    textAlign: "center",
  },
  challengeSheetNickname: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    fontStyle: "italic",
    marginTop: -Spacing.sm,
  },
  challengeInfoRow: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    overflow: "hidden",
    marginTop: Spacing.xs,
  },
  challengeInfoCell: {
    flex: 1,
    padding: Spacing.md,
    gap: 4,
  },
  challengeInfoDivider: {
    width: 1,
    backgroundColor: Colors.outlineVariant,
  },
  challengeInfoLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  challengeInfoValue: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontWeight: "700",
  },
  acceptChallengeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.md,
    height: 52,
    width: "100%",
    marginTop: Spacing.sm,
  },
  acceptChallengeBtnText: {
    ...Typography.labelCaps,
    color: Colors.charcoal,
    fontSize: 14,
    letterSpacing: 1.5,
  },
  declineChallengeBtn: {
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  declineChallengeBtnText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
});
