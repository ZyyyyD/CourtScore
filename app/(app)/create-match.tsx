import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { Header } from '../../src/components/layout/Header';
import { Button } from '../../src/components/ui/Button';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { BorderRadius, Spacing } from '../../src/theme/spacing';
import { useAuthStore } from '../../src/stores/authStore';
import { useMatchStore } from '../../src/stores/matchStore';
import { createMatch } from '../../src/hooks/useMatch';
import type { MatchType } from '../../src/types/match';

function SegmentButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.segment, selected && styles.segmentActive]}>
      <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

function FormatButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.format, selected && styles.formatActive]}>
      <Text style={[styles.formatText, selected && styles.formatTextActive]}>{label}</Text>
      <Text style={[styles.formatSub, selected && styles.formatSubActive]}>points</Text>
    </Pressable>
  );
}

export default function CreateMatchScreen() {
  const { user, isGuest, guestName } = useAuthStore();
  const { setMyTeamSide } = useMatchStore();
  const [matchType, setMatchType] = useState<MatchType>('singles');
  const [scoringTarget, setScoringTarget] = useState<11 | 15 | 21>(11);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    const result = await createMatch(
      user?.id ?? null,
      isGuest ? guestName : null,
      matchType,
      scoringTarget,
    );
    setLoading(false);

    if (!result) {
      Alert.alert('Error', 'Failed to create match. Check your connection and try again.');
      return;
    }
    setMyTeamSide('team_a');
    router.push(`/(match)/lobby/${result.matchId}` as never);
  };

  return (
    <ScreenWrapper>
      <Header title="Create Match" showBack={false} />

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MATCH TYPE</Text>
          <View style={styles.segmentRow}>
            <SegmentButton label="Singles" selected={matchType === 'singles'} onPress={() => setMatchType('singles')} />
            <SegmentButton label="Doubles" selected={matchType === 'doubles'} onPress={() => setMatchType('doubles')} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SCORING FORMAT</Text>
          <View style={styles.formatRow}>
            {([11, 15, 21] as const).map((n) => (
              <FormatButton
                key={n}
                label={String(n)}
                selected={scoringTarget === n}
                onPress={() => setScoringTarget(n)}
              />
            ))}
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            A unique match code will be generated. Share it with your opponent to join.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button label="Create Match" onPress={handleCreate} loading={loading} fullWidth />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: Spacing.lg, gap: Spacing.xxl },
  section: { gap: Spacing.md },
  sectionLabel: { ...Typography.labelCaps, color: Colors.onSurfaceVariant },

  segmentRow: { flexDirection: 'row', gap: Spacing.md },
  segment: {
    flex: 1,
    height: 52,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainer,
  },
  segmentActive: { backgroundColor: Colors.primaryContainer, borderColor: Colors.primary },
  segmentText:       { ...Typography.bodyLg, color: Colors.onSurfaceVariant },
  segmentTextActive: { color: Colors.primary, fontWeight: '700' },

  formatRow: { flexDirection: 'row', gap: Spacing.md },
  format: {
    flex: 1,
    height: 80,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainer,
    gap: 2,
  },
  formatActive: { backgroundColor: '#3c2f00', borderColor: Colors.gold, borderWidth: 2 },
  formatText:       { ...Typography.headlineLg, color: Colors.onSurface },
  formatTextActive: { color: Colors.gold },
  formatSub:        { ...Typography.labelCaps, color: Colors.onSurfaceVariant, fontSize: 10 },
  formatSubActive:  { color: Colors.secondaryContainer },

  infoBox: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  infoText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },

  footer: { padding: Spacing.lg, paddingBottom: Spacing.lg },
});
