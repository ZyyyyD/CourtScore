import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  withSequence,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { BorderRadius, Spacing } from '../../theme/spacing';
import type { TeamSide } from '../../types/match';

interface Props {
  scoreA: number;
  scoreB: number;
  nameA: string;
  nameB: string;
  serverSide: TeamSide | null;
  scoringTarget: number;
}

function ScoreTile({
  score,
  name,
  isServer,
  onScoreChange,
}: {
  score: number;
  name: string;
  isServer: boolean;
  onScoreChange: number;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.25, { damping: 5, stiffness: 200 }),
      withSpring(1.0, { damping: 10, stiffness: 150 }),
    );
  }, [onScoreChange]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={[styles.tile, isServer && styles.tileServer]}>
      <Text style={styles.playerName} numberOfLines={1}>{name}</Text>
      <Animated.Text style={[styles.score, animStyle]}>{score}</Animated.Text>
      {isServer && (
        <View style={styles.serverDot}>
          <Text style={styles.serverText}>SERVER</Text>
        </View>
      )}
    </View>
  );
}

export function ScoreBoard({ scoreA, scoreB, nameA, nameB, serverSide, scoringTarget }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <ScoreTile
          score={scoreA}
          name={nameA}
          isServer={serverSide === 'team_a'}
          onScoreChange={scoreA}
        />
        <Text style={styles.divider}>—</Text>
        <ScoreTile
          score={scoreB}
          name={nameB}
          isServer={serverSide === 'team_b'}
          onScoreChange={scoreB}
        />
      </View>
      <Text style={styles.target}>FIRST TO {scoringTarget}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  tile: {
    alignItems: 'center',
    backgroundColor: Colors.charcoal,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    minWidth: 120,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  tileServer: {
    borderColor: Colors.gold,
    borderWidth: 3,
  },
  playerName: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.xs,
  },
  score: {
    ...Typography.scoreDisplay,
    color: Colors.white,
  },
  serverDot: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.secondaryContainer,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  serverText: {
    ...Typography.labelCaps,
    color: Colors.secondary,
    fontSize: 9,
  },
  divider: {
    ...Typography.headlineLg,
    color: Colors.outlineVariant,
  },
  target: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    marginTop: Spacing.sm,
  },
});
