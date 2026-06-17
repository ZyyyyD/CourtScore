import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '../../../src/components/layout/ScreenWrapper';
import { Header } from '../../../src/components/layout/Header';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { PerformanceSummary } from '../../../src/components/stats/PerformanceSummary';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing } from '../../../src/theme/spacing';
import { useAuthStore } from '../../../src/stores/authStore';
import { useMatchStore } from '../../../src/stores/matchStore';
import { useMatchStats } from '../../../src/hooks/useMatchStats';
import { supabase } from '../../../src/lib/supabase';
import { getPlayerName } from '../../../src/lib/pickleball';
import { formatDuration } from '../../../src/utils/formatters';
import type { MatchWithRelations } from '../../../src/types/match';

export default function SummaryScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { user, isGuest, guestName } = useAuthStore();
  const storeMatch = useMatchStore((s) => s.currentMatch);
  const storePlayers = useMatchStore((s) => s.players);
  const storeEvents = useMatchStore((s) => s.events);

  const [match, setMatch] = useState<MatchWithRelations | null>(null);

  useEffect(() => {
    // Try store first (just finished a live match), else fetch from DB
    if (storeMatch?.id === matchId && storeEvents.length > 0) {
      setMatch({ ...storeMatch, match_players: storePlayers, match_events: storeEvents });
      return;
    }
    supabase
      .from('matches')
      .select('*, match_players(*), match_events(*)')
      .eq('id', matchId)
      .single()
      .then(({ data }) => {
        if (data) setMatch(data as MatchWithRelations);
      });
  }, [matchId]);

  const events = match?.match_events ?? [];
  const players = match?.match_players ?? [];
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

  const userId = user?.id ?? '';
  const myPlayer = players.find((p) => p.player_id === userId);
  const mySide = myPlayer?.team_side;
  const iWon = match.winner_side === mySide;

  const nameA = getPlayerName(players, 'team_a');
  const nameB = getPlayerName(players, 'team_b');
  const winnerName = match.winner_side === 'team_a' ? nameA : nameB;

  const duration = match.started_at ? formatDuration(match.started_at, match.completed_at) : null;

  return (
    <ScreenWrapper>
      <Header title="Match Summary" showBack />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Winner banner */}
        <Card gold style={styles.winnerCard}>
          <Badge label={iWon ? 'VICTORY' : 'DEFEAT'} variant={iWon ? 'win' : 'loss'} />
          <Text style={styles.winnerName}>{winnerName}</Text>
          <Text style={styles.finalScore}>
            {match.score_a} — {match.score_b}
          </Text>
          {duration && <Text style={styles.duration}>{duration}</Text>}
        </Card>

        {/* Performance */}
        <Text style={styles.sectionLabel}>PERFORMANCE BREAKDOWN</Text>
        <PerformanceSummary stats={stats} nameA={nameA} nameB={nameB} />

        {/* Match info */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoRow}>
            {match.match_type === 'singles' ? 'Singles' : 'Doubles'}
            {'  ·  '}First to {match.scoring_target}
            {'  ·  '}{stats.totalRallies} rallies
          </Text>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label="Play Again"
            onPress={() => router.push('/(app)/create-match')}
            variant="primary"
            style={{ flex: 1 }}
          />
          <Button
            label="Home"
            onPress={() => router.replace('/(app)/home')}
            variant="secondary"
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...Typography.bodyLg, color: Colors.onSurfaceVariant },
  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  winnerCard: { alignItems: 'center', gap: Spacing.sm },
  winnerName: { ...Typography.headlineLg, color: Colors.onSurface, marginTop: Spacing.sm },
  finalScore: { ...Typography.scoreDisplay, color: Colors.gold, letterSpacing: 4 },
  duration:   { ...Typography.labelCaps, color: Colors.onSurfaceVariant },
  sectionLabel: { ...Typography.labelCaps, color: Colors.onSurfaceVariant },
  infoCard: { paddingVertical: Spacing.md },
  infoRow:  { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center' },
  actions:  { flexDirection: 'row', gap: Spacing.md },
});
