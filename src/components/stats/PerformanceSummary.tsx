import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatsChart } from './StatsChart';
import { Card } from '../ui/Card';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { BorderRadius, Spacing } from '../../theme/spacing';
import type { MatchStats } from '../../types/stats';
import { formatPercent } from '../../utils/formatters';

interface Props {
  stats: MatchStats;
  nameA: string;
  nameB: string;
}

function StatRow({
  label,
  valueA,
  valueB,
  highlight,
}: {
  label: string;
  valueA: string | number;
  valueB: string | number;
  highlight?: boolean;
}) {
  return (
    <View style={row.container}>
      <Text style={row.label}>{label}</Text>
      <Text style={[row.value, highlight && row.gold]}>{valueA}</Text>
      <Text style={[row.value, highlight && row.gold]}>{valueB}</Text>
    </View>
  );
}

export function PerformanceSummary({ stats, nameA, nameB }: Props) {
  const { teamA: a, teamB: b } = stats;

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        {/* Header */}
        <View style={[row.container, styles.header]}>
          <Text style={styles.headerStat} />
          <Text style={styles.headerName} numberOfLines={1}>{nameA}</Text>
          <Text style={styles.headerName} numberOfLines={1}>{nameB}</Text>
        </View>

        <View style={styles.divider} />

        <StatRow label="POINTS"   valueA={a.totalPoints}          valueB={b.totalPoints}          highlight />
        <View style={styles.divider} />
        <StatRow label="WINNERS"  valueA={a.winners}              valueB={b.winners} />
        <View style={styles.divider} />
        <StatRow label="ERRORS"   valueA={a.errors}               valueB={b.errors} />
        <View style={styles.divider} />
        <StatRow label="WIN RATE" valueA={formatPercent(a.winRate)} valueB={formatPercent(b.winRate)} />
      </Card>

      {stats.totalRallies > 0 && (
        <StatsChart
          title="WINNERS vs ERRORS"
          labels={['Win', 'Err', 'Ace', 'Dink']}
          valuesA={[a.winners, a.errors, a.aces, a.dinks]}
          valuesB={[b.winners, b.errors, b.aces, b.dinks]}
          nameA={nameA}
          nameB={nameB}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.lg },
  card: { padding: 0, overflow: 'hidden' },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  headerStat: { flex: 1 },
  headerName: {
    ...Typography.labelCaps,
    color: Colors.primary,
    width: 72,
    textAlign: 'center',
  },
  divider: { height: 1, backgroundColor: Colors.outlineVariant },
});

const row = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  label: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  value: {
    ...Typography.bodyLg,
    fontWeight: '700',
    color: Colors.onSurface,
    width: 72,
    textAlign: 'center',
  },
  gold: { color: Colors.gold },
});
