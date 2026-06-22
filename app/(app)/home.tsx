import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import type { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { Badge } from '../../src/components/ui/Badge';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { BorderRadius, Spacing } from '../../src/theme/spacing';
import { useAuthStore } from '../../src/stores/authStore';
import { useHistoryStore } from '../../src/stores/historyStore';
import { useMatchStore } from '../../src/stores/matchStore';
import { supabase } from '../../src/lib/supabase';
import {
  fetchIncomingChallenges,
  acceptAndCreateMatch,
  respondChallenge,
  subscribeToChallenges,
} from '../../src/hooks/useChallenges';
import { formatDate } from '../../src/utils/formatters';
import type { MatchWithRelations } from '../../src/types/match';
import type { Challenge } from '../../src/types/challenge';

function MatchHistoryItem({ match, userId }: { match: MatchWithRelations; userId: string }) {
  const myPlayer = match.match_players.find((p) => p.player_id === userId);
  const mySide = myPlayer?.team_side;
  const won = match.winner_side === mySide;
  const score = `${match.score_a} – ${match.score_b}`;

  return (
    <Pressable
      style={styles.historyItem}
      onPress={() => router.push(`/(match)/summary/${match.id}` as never)}>
      <View style={styles.historyLeft}>
        <Text style={styles.historyCode}>{match.match_code}</Text>
        <Text style={styles.historyDate}>{formatDate(match.completed_at ?? match.created_at)}</Text>
      </View>
      <View style={styles.historyRight}>
        <Text style={styles.historyScore}>{score}</Text>
        <Badge label={won ? 'WIN' : 'LOSS'} variant={won ? 'win' : 'loss'} />
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { user, isGuest, guestName } = useAuthStore();
  const { matches, loadHistory } = useHistoryStore();
  const { setMyTeamSide } = useMatchStore();

  const displayName = isGuest ? guestName : (user?.user_metadata?.full_name ?? 'Player');
  const userId = user?.id ?? '';

  const [incoming, setIncoming] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  const challengeSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['72%'], []);

  const loadIncoming = useCallback(async () => {
    if (!userId) return;
    const data = await fetchIncomingChallenges(userId);
    setIncoming(data);
  }, [userId]);

  useEffect(() => {
    if (userId) loadHistory(userId);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadIncoming();
    }, [loadIncoming]),
  );

  // Realtime: new challenge arrives while on this screen
  useEffect(() => {
    if (!userId) return;
    const channel = subscribeToChallenges(userId, loadIncoming);
    return () => { supabase.removeChannel(channel); };
  }, [userId, loadIncoming]);

  const handleRespond = async (
    challengeId: string,
    challengerId: string,
    status: 'accepted' | 'declined',
  ) => {
    setRespondingTo(challengeId);
    if (status === 'accepted') {
      const result = await acceptAndCreateMatch(challengeId, challengerId, userId);
      setRespondingTo(null);
      if ('error' in result) return;
      setIncoming((prev) => prev.filter((c) => c.id !== challengeId));
      challengeSheetRef.current?.close();
      setMyTeamSide('team_b');
      router.push(`/(match)/lobby/${result.matchId}` as never);
    } else {
      const error = await respondChallenge(challengeId, status);
      setRespondingTo(null);
      if (error) return;
      setIncoming((prev) => prev.filter((c) => c.id !== challengeId));
      challengeSheetRef.current?.close();
    }
  };

  const openChallengeDetail = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    challengeSheetRef.current?.expand();
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetDefaultBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
    ),
    [],
  );

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>COURTSCORE</Text>
          <Text style={styles.subGreeting}>Welcome back, {displayName}</Text>
        </View>
        <Pressable onPress={() => router.push('/(app)/profile')} hitSlop={8}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
        </Pressable>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionRow}>
        <Pressable style={styles.actionCard} onPress={() => router.push('/(app)/create-match')}>
          <Ionicons name="add-circle" size={32} color={Colors.gold} />
          <Text style={styles.actionLabel}>Create Match</Text>
          <Text style={styles.actionSub}>Generate a code</Text>
        </Pressable>
        <Pressable
          style={[styles.actionCard, styles.actionCardSecondary]}
          onPress={() => router.push('/(app)/join-match')}>
          <Ionicons name="enter" size={32} color={Colors.primary} />
          <Text style={styles.actionLabel}>Join Match</Text>
          <Text style={styles.actionSub}>Enter a code</Text>
        </Pressable>
      </View>

      <FlatList
        data={matches.slice(0, 10)}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <MatchHistoryItem match={item} userId={userId} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <>
            {/* Incoming Challenges */}
            {!isGuest && incoming.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>INCOMING CHALLENGES</Text>
                  <Pressable onPress={() => router.push('/(app)/challenges' as never)}>
                    <Text style={styles.seeAll}>See all</Text>
                  </Pressable>
                </View>
                {incoming.map((c) => {
                  const challenger = c.challenger;
                  return (
                    <Pressable
                      key={c.id}
                      style={styles.challengeCard}
                      onPress={() => openChallengeDetail(c)}>
                      <View style={styles.challengeAvatar}>
                        <Text style={styles.challengeAvatarText}>
                          {(challenger?.full_name ?? '?').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.challengeInfo}>
                        <Text style={styles.challengeName}>
                          {challenger?.full_name ?? 'Someone'}
                        </Text>
                        <Text style={styles.challengeTag}>challenged you!</Text>
                      </View>
                      <View style={styles.seeDetailsBtn}>
                        <Text style={styles.seeDetailsBtnText}>SEE DETAILS</Text>
                        <Ionicons name="chevron-forward" size={12} color={Colors.primary} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Text style={styles.sectionTitle}>RECENT MATCHES</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="tennisball-outline" size={40} color={Colors.outline} />
            <Text style={styles.emptyText}>No matches yet. Create one to get started!</Text>
          </View>
        }
      />

      {/* Challenge Detail Sheet */}
      <BottomSheet
        ref={challengeSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.handle}>
        <BottomSheetView style={styles.sheetContent}>
          {selectedChallenge && (() => {
            const challenger = selectedChallenge.challenger;
            const isResponding = respondingTo === selectedChallenge.id;
            return (
              <>
                <View style={styles.sheetAvatarWrapper}>
                  <View style={styles.sheetAvatar}>
                    <Text style={styles.sheetAvatarText}>
                      {(challenger?.full_name ?? '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  {challenger?.dupr_rating ? (
                    <View style={styles.duprBadge}>
                      <Text style={styles.duprLabel}>DUPR</Text>
                      <Text style={styles.duprValue}>{challenger.dupr_rating}</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.sheetName}>{challenger?.full_name ?? 'Someone'}</Text>
                {challenger?.nickname ? (
                  <Text style={styles.sheetNickname}>"{challenger.nickname}"</Text>
                ) : null}

                <View style={styles.infoRow}>
                  <View style={styles.infoCell}>
                    <Text style={styles.infoLabel}>FORMAT</Text>
                    <Text style={styles.infoValue}>Singles</Text>
                  </View>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoCell}>
                    <Text style={styles.infoLabel}>RULES</Text>
                    <Text style={styles.infoValue}>11pt Match</Text>
                  </View>
                </View>

                <Pressable
                  style={[styles.acceptBtn, isResponding && { opacity: 0.6 }]}
                  onPress={() => handleRespond(selectedChallenge.id, selectedChallenge.challenger_id, 'accepted')}
                  disabled={isResponding}>
                  {isResponding ? (
                    <ActivityIndicator size="small" color={Colors.charcoal} />
                  ) : (
                    <>
                      <Text style={styles.acceptBtnText}>ACCEPT CHALLENGE</Text>
                      <Ionicons name="chevron-forward" size={16} color={Colors.charcoal} />
                    </>
                  )}
                </Pressable>

                <Pressable
                  style={styles.declineBtn}
                  onPress={() => handleRespond(selectedChallenge.id, selectedChallenge.challenger_id, 'declined')}
                  disabled={isResponding}>
                  <Text style={styles.declineBtnText}>DECLINE CHALLENGE</Text>
                </Pressable>
              </>
            );
          })()}
        </BottomSheetView>
      </BottomSheet>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  greeting:    { ...Typography.headlineMd, color: Colors.gold },
  subGreeting: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, marginTop: 2 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  avatarText: { ...Typography.bodyLg, fontWeight: '700', color: Colors.primary },

  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gold,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  actionCardSecondary: { borderTopColor: Colors.primary },
  actionLabel: { ...Typography.bodyLg, fontWeight: '700', color: Colors.onSurface },
  actionSub:   { ...Typography.labelSm, color: Colors.onSurfaceVariant },

  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  separator: { height: 1, backgroundColor: Colors.outlineVariant, marginVertical: 4 },

  section: { marginBottom: Spacing.lg, gap: Spacing.sm },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.md,
  },
  seeAll: { ...Typography.labelSm, color: Colors.primary },

  // Incoming challenge card
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  challengeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeAvatarText: { ...Typography.bodyMd, fontWeight: '700', color: Colors.primary },
  challengeInfo: { flex: 1, gap: 2 },
  challengeName: { ...Typography.bodyMd, fontWeight: '700', color: Colors.onSurface },
  challengeTag:  { ...Typography.labelCaps, color: Colors.primary, fontSize: 10 },
  seeDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  seeDetailsBtnText: { ...Typography.labelCaps, color: Colors.primary, fontSize: 10 },

  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  historyLeft:  { gap: 4 },
  historyRight: { alignItems: 'flex-end', gap: 4 },
  historyCode:  { ...Typography.bodyMd, fontWeight: '700', color: Colors.onSurface },
  historyDate:  { ...Typography.labelSm, color: Colors.onSurfaceVariant },
  historyScore: { ...Typography.bodyLg, fontWeight: '700', color: Colors.onSurface },

  empty: { alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.xxl },
  emptyText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center' },

  // Bottom sheet
  sheetBg: { backgroundColor: Colors.surfaceContainerHigh },
  handle:  { backgroundColor: Colors.outline },
  sheetContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  sheetAvatarWrapper: { alignItems: 'center', marginBottom: Spacing.xs },
  sheetAvatar: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  sheetAvatarText: { fontFamily: 'Anybody_700Bold', fontSize: 42, color: Colors.primary },
  duprBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    marginTop: -12,
  },
  duprLabel: { ...Typography.labelCaps, color: Colors.charcoal, fontSize: 10 },
  duprValue: { ...Typography.bodyMd, color: Colors.charcoal, fontWeight: '700', fontSize: 13 },
  sheetName: { ...Typography.headlineMd, color: Colors.onSurface, textAlign: 'center' },
  sheetNickname: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginTop: -Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  infoCell:    { flex: 1, padding: Spacing.md, gap: 4 },
  infoDivider: { width: 1, backgroundColor: Colors.outlineVariant },
  infoLabel:   { ...Typography.labelCaps, color: Colors.onSurfaceVariant, fontSize: 10 },
  infoValue:   { ...Typography.bodyMd, color: Colors.onSurface, fontWeight: '700' },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.md,
    height: 52,
    width: '100%',
    marginTop: Spacing.sm,
  },
  acceptBtnText: {
    ...Typography.labelCaps,
    color: Colors.charcoal,
    fontSize: 14,
    letterSpacing: 1.5,
  },
  declineBtn: { paddingVertical: Spacing.sm, alignItems: 'center' },
  declineBtnText: { ...Typography.labelCaps, color: Colors.onSurfaceVariant, fontSize: 12 },
});
