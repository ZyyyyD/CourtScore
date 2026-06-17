import React, { useEffect } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { Badge } from '../../src/components/ui/Badge';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { BorderRadius, Spacing } from '../../src/theme/spacing';
import { useAuthStore } from '../../src/stores/authStore';
import { useHistoryStore } from '../../src/stores/historyStore';
import { formatDate } from '../../src/utils/formatters';
import type { MatchWithRelations } from '../../src/types/match';

function MatchHistoryItem({ match, userId }: { match: MatchWithRelations; userId: string }) {
  const myPlayer = match.match_players.find((p) => p.player_id === userId);
  const mySide = myPlayer?.team_side;
  const won = match.winner_side === mySide;
  const score = `${match.score_a} – ${match.score_b}`;

  return (
    <Pressable
      style={styles.historyItem}
      onPress={() => router.push(`/(match)/summary/${match.id}` as never)}
    >
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

  const displayName = isGuest ? guestName : (user?.user_metadata?.full_name ?? 'Player');
  const userId = user?.id ?? '';

  useEffect(() => {
    if (userId) loadHistory(userId);
  }, [userId]);

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
        <Pressable style={[styles.actionCard, styles.actionCardSecondary]} onPress={() => router.push('/(app)/join-match')}>
          <Ionicons name="enter" size={32} color={Colors.primary} />
          <Text style={styles.actionLabel}>Join Match</Text>
          <Text style={styles.actionSub}>Enter a code</Text>
        </Pressable>
      </View>

      {/* Recent Matches */}
      <Text style={styles.sectionTitle}>RECENT MATCHES</Text>
      <FlatList
        data={matches.slice(0, 10)}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <MatchHistoryItem match={item} userId={userId} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="tennisball-outline" size={40} color={Colors.outline} />
            <Text style={styles.emptyText}>No matches yet. Create one to get started!</Text>
          </View>
        }
      />
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
    marginBottom: Spacing.xxl,
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

  sectionTitle: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  separator: { height: 1, backgroundColor: Colors.outlineVariant, marginVertical: 4 },

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
});
