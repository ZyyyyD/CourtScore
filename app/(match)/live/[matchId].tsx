import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import BottomSheet from '@gorhom/bottom-sheet';
import { ScreenWrapper } from '../../../src/components/layout/ScreenWrapper';
import { ScoreBoard } from '../../../src/components/match/ScoreBoard';
import { ScoreButton } from '../../../src/components/match/ScoreButton';
import { UndoButton } from '../../../src/components/match/UndoButton';
import { SyncIndicator } from '../../../src/components/match/SyncIndicator';
import { MatchCodeDisplay } from '../../../src/components/match/MatchCodeDisplay';
import { EventLoggerSheet } from '../../../src/components/match/EventLoggerSheet';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing } from '../../../src/theme/spacing';
import { useAuthStore } from '../../../src/stores/authStore';
import { useMatchStore } from '../../../src/stores/matchStore';
import { useLiveMatch } from '../../../src/hooks/useLiveMatch';
import { getPlayerName } from '../../../src/lib/pickleball';
import type { ShotType, TeamSide } from '../../../src/types/match';

export default function LiveMatchScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { user, isGuest, guestName } = useAuthStore();
  const {
    currentMatch,
    players,
    events,
    isLocked,
    connectionStatus,
    addPoint,
    undoLastEvent,
    clearMatch,
  } = useMatchStore();

  const sheetRef = useRef<BottomSheet>(null);
  const [pendingSide, setPendingSide] = useState<TeamSide | null>(null);

  // Subscribe to real-time updates
  useLiveMatch(matchId);

  const userId = user?.id ?? null;
  const myPlayer = players.find((p) => p.player_id === userId);
  const mySide: TeamSide = myPlayer?.team_side ?? 'team_a';

  const nameA = getPlayerName(players, 'team_a', userId === players.find((p) => p.team_side === 'team_a')?.player_id ? (isGuest ? guestName : user?.user_metadata?.full_name) : null);
  const nameB = getPlayerName(players, 'team_b', userId === players.find((p) => p.team_side === 'team_b')?.player_id ? (isGuest ? guestName : user?.user_metadata?.full_name) : null);

  // Navigate to summary when match is over
  useEffect(() => {
    if (currentMatch?.status === 'completed') {
      setTimeout(() => {
        router.replace(`/(match)/summary/${matchId}` as never);
      }, 1500);
    }
  }, [currentMatch?.status]);

  const handleScorePress = (side: TeamSide) => {
    if (isLocked || connectionStatus === 'offline') return;
    setPendingSide(side);
    sheetRef.current?.expand();
  };

  const handleEventConfirm = async (side: TeamSide, shotType: ShotType | null) => {
    await addPoint(side, shotType, userId);
  };

  const handleUndo = () => {
    Alert.alert('Undo Last Point', 'Remove the last scored point?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Undo',
        style: 'destructive',
        onPress: () => undoLastEvent(userId),
      },
    ]);
  };

  const handleEndMatch = () => {
    Alert.alert('End Match', 'Are you sure you want to end this match?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Match',
        style: 'destructive',
        onPress: async () => {
          clearMatch();
          router.replace('/(app)/home');
        },
      },
    ]);
  };

  if (!currentMatch) {
    return (
      <ScreenWrapper bg={Colors.court}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading match...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const pendingTeamName = pendingSide === 'team_a' ? nameA : nameB;
  const pointEvents = events.filter((e) => e.event_type === 'point');

  return (
    <ScreenWrapper bg={Colors.court} safeEdges={['top', 'bottom']}>
      {/* TOP ROW */}
      <View style={styles.topRow}>
        <MatchCodeDisplay code={currentMatch.match_code} compact />
        <SyncIndicator status={connectionStatus} />
        <Pressable onPress={handleEndMatch} style={styles.endBtn}>
          <Text style={styles.endBtnText}>END</Text>
        </Pressable>
      </View>

      {/* SCOREBOARD — center */}
      <View style={styles.scoreArea}>
        <ScoreBoard
          scoreA={currentMatch.score_a}
          scoreB={currentMatch.score_b}
          nameA={nameA}
          nameB={nameB}
          serverSide={currentMatch.server_side}
          scoringTarget={currentMatch.scoring_target}
        />

        {currentMatch.status === 'completed' && currentMatch.winner_side && (
          <View style={styles.winnerBanner}>
            <Text style={styles.winnerText}>
              {currentMatch.winner_side === 'team_a' ? nameA : nameB} WINS!
            </Text>
          </View>
        )}
      </View>

      {/* SCORE BUTTONS */}
      <View style={styles.scoreButtons}>
        <ScoreButton
          teamName={nameA}
          onPress={() => handleScorePress('team_a')}
          disabled={isLocked || connectionStatus === 'offline' || currentMatch.status === 'completed'}
        />
        <ScoreButton
          teamName={nameB}
          onPress={() => handleScorePress('team_b')}
          disabled={isLocked || connectionStatus === 'offline' || currentMatch.status === 'completed'}
        />
      </View>

      {/* BOTTOM CONTROLS */}
      <View style={styles.bottomRow}>
        <UndoButton
          onPress={handleUndo}
          disabled={pointEvents.length === 0 || isLocked}
        />
        <Text style={styles.rallyCount}>Rally #{pointEvents.length + 1}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* EVENT LOGGER BOTTOM SHEET */}
      <EventLoggerSheet
        sheetRef={sheetRef}
        pendingSide={pendingSide}
        teamName={pendingTeamName}
        onConfirm={handleEventConfirm}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...Typography.bodyLg, color: Colors.onPrimaryContainer },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  endBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.errorContainer,
  },
  endBtnText: { ...Typography.labelCaps, color: Colors.error, fontSize: 10 },

  scoreArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },

  winnerBanner: {
    marginTop: Spacing.lg,
    backgroundColor: '#3c2f00',
    borderRadius: 4,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  winnerText: { ...Typography.headlineMd, color: Colors.gold },

  scoreButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  rallyCount: { ...Typography.labelCaps, color: Colors.onPrimaryContainer },
  placeholder: { width: 60 },
});
