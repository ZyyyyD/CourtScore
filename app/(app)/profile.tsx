import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { Header } from '../../src/components/layout/Header';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { StatRow } from '../../src/components/stats/StatRow';
import { Badge } from '../../src/components/ui/Badge';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { BorderRadius, Spacing } from '../../src/theme/spacing';
import { useAuthStore } from '../../src/stores/authStore';
import { useHistoryStore } from '../../src/stores/historyStore';

export default function ProfileScreen() {
  const { user, isGuest, guestName, signOut } = useAuthStore();
  const { matches } = useHistoryStore();

  const displayName = isGuest ? guestName : (user?.user_metadata?.full_name ?? 'Player');
  const userId = user?.id ?? '';

  const wins   = matches.filter((m) => m.winner_side === m.match_players.find((p) => p.player_id === userId)?.team_side).length;
  const losses = matches.length - wins;
  const winRate = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0;

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/splash');
        },
      },
    ]);
  };

  return (
    <ScreenWrapper>
      <Header title="Profile" showBack={false} />

      <View style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          {isGuest && <Badge label="GUEST" variant="neutral" />}
          {user?.email && <Text style={styles.email}>{user.email}</Text>}
        </View>

        {/* Career Stats */}
        <Card gold>
          <Text style={styles.cardTitle}>CAREER STATS</Text>
          <StatRow label="Total Matches"  valueA={matches.length} />
          <StatRow label="Wins"           valueA={wins} highlight />
          <StatRow label="Losses"         valueA={losses} />
          <StatRow label="Win Rate"       valueA={`${winRate}%`} highlight />
        </Card>

        {/* Sign Out */}
        {isGuest ? (
          <Button
            label="Create Account to Save Progress"
            onPress={() => router.push('/(auth)/login')}
            variant="secondary"
            fullWidth
          />
        ) : null}
        <Button
          label="Sign Out"
          onPress={handleSignOut}
          variant="danger"
          fullWidth
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: Spacing.lg, gap: Spacing.lg },
  avatarSection: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarLetter: { ...Typography.headlineLg, color: Colors.primary },
  displayName:  { ...Typography.headlineMd, color: Colors.onSurface },
  email:        { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  cardTitle:    { ...Typography.labelCaps, color: Colors.onSurfaceVariant, marginBottom: Spacing.sm },
});
