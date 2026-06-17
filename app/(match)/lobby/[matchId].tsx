import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '../../../src/components/layout/ScreenWrapper';
import { Header } from '../../../src/components/layout/Header';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { MatchCodeDisplay } from '../../../src/components/match/MatchCodeDisplay';
import { ReadinessToggle } from '../../../src/components/match/ReadinessToggle';
import { SyncIndicator } from '../../../src/components/match/SyncIndicator';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing } from '../../../src/theme/spacing';
import { useAuthStore } from '../../../src/stores/authStore';
import { useMatchStore } from '../../../src/stores/matchStore';
import { useLobbySync } from '../../../src/hooks/useLiveMatch';
import { setReady, startMatch } from '../../../src/hooks/useMatch';
import { supabase } from '../../../src/lib/supabase';

export default function LobbyScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { user, isGuest, guestName } = useAuthStore();
  const { currentMatch, players, events, connectionStatus, setMatch, setPlayers, myTeamSide } = useMatchStore();
  const [loading, setLoading] = useState(false);

  // Initial fetch
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('matches')
        .select('*, match_players(*), match_events(*)')
        .eq('id', matchId)
        .single();
      if (data) {
        setMatch(data, data.match_players, data.match_events);
      }
    };
    fetch();
  }, [matchId]);

  // Realtime lobby sync
  useLobbySync(matchId);

  // Navigate when match starts — via Realtime OR polling fallback every 2s
  useEffect(() => {
    if (currentMatch?.status === 'active') {
      router.replace(`/(match)/live/${matchId}` as never);
    }
  }, [currentMatch?.status]);

  useEffect(() => {
    if (!matchId || matchId.startsWith('local-')) return;
    console.log('[lobby] starting poll for matchId:', matchId);
    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('status')
        .eq('id', matchId)
        .single();
      console.log('[lobby] poll result:', data?.status, error?.message);
      if (data?.status === 'active') {
        clearInterval(interval);
        router.replace(`/(match)/live/${matchId}` as never);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [matchId]);

  const userId = user?.id ?? '';
  // myTeamSide is set locally when you create ('team_a') or join ('team_b')
  // This is device-local so it can never be confused between two players
  const myPlayer = myTeamSide
    ? players.find((p) => p.team_side === myTeamSide)
    : players.find((p) => p.player_id === userId);
  const opponentPlayer = players.find((p) => p.id !== myPlayer?.id);
  const isCreator = myTeamSide === 'team_a' || currentMatch?.created_by === userId;

  const allReady = players.length >= 2 && players.every((p) => p.is_ready);

  const handleReadyToggle = async () => {
    if (!myPlayer) return;
    await setReady(myPlayer.id, !myPlayer.is_ready);
    // Optimistic local update
    setPlayers(players.map((p) => (p.id === myPlayer.id ? { ...p, is_ready: !myPlayer.is_ready } : p)));
  };

  const handleStart = async () => {
    if (!allReady) {
      Alert.alert('Not ready', 'Both players must be ready to start.');
      return;
    }
    setLoading(true);
    const isLocalMatch = matchId.startsWith('local-');
    const err = await startMatch(matchId, isLocalMatch);
    setLoading(false);
    if (err) {
      Alert.alert('Error', `Could not start match: ${err}`);
      return;
    }
    // Update local store immediately so creator navigates now.
    // Device 2 navigates via the Realtime matches UPDATE subscription.
    if (currentMatch) {
      setMatch({ ...currentMatch, status: 'active' }, players, events);
    }
  };

  if (!currentMatch) {
    return (
      <ScreenWrapper>
        <Header title="Lobby" />
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading match...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <Header
        title="Waiting Lobby"
        right={<SyncIndicator status={connectionStatus} />}
      />

      <View style={styles.content}>
        <MatchCodeDisplay code={currentMatch.match_code} />

        <Card style={styles.infoCard}>
          <Text style={styles.infoRow}>
            {currentMatch.match_type === 'singles' ? 'Singles' : 'Doubles'}
            {'  ·  '}First to {currentMatch.scoring_target}
          </Text>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PLAYERS</Text>
          <View style={styles.playerList}>
            <ReadinessToggle
              playerName={isGuest ? guestName : (user?.user_metadata?.full_name ?? 'You')}
              isReady={myPlayer?.is_ready ?? false}
              isYou
              onToggle={handleReadyToggle}
            />
            <ReadinessToggle
              playerName={opponentPlayer?.guest_name ?? 'Opponent'}
              isReady={opponentPlayer?.is_ready ?? false}
              isYou={false}
              isWaiting={!opponentPlayer}
            />
          </View>
        </View>

        {allReady && (
          <View style={styles.allReadyBanner}>
            <Text style={styles.allReadyText}>Both players ready!</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {isCreator ? (
          <Button
            label={
              players.length < 2
                ? 'Waiting for opponent...'
                : allReady
                ? 'Start Match'
                : 'Waiting for both to be ready...'
            }
            onPress={handleStart}
            disabled={!allReady || loading}
            loading={loading}
            fullWidth
          />
        ) : (
          <Button
            label={myPlayer?.is_ready ? '✓ You are ready' : 'Tap READY above to confirm'}
            onPress={() => {}}
            disabled
            variant="ghost"
            fullWidth
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content:  { flex: 1, padding: Spacing.lg, gap: Spacing.xxl },
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...Typography.bodyLg, color: Colors.onSurfaceVariant },
  infoCard: { paddingVertical: Spacing.md },
  infoRow:  { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center' },
  section:  { gap: Spacing.md },
  sectionLabel: { ...Typography.labelCaps, color: Colors.onSurfaceVariant },
  playerList: { gap: Spacing.sm },
  allReadyBanner: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: 4,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  allReadyText: { ...Typography.bodyLg, fontWeight: '700', color: Colors.primary },
  footer: { padding: Spacing.lg },
});
