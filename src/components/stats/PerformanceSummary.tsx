import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatRow } from './StatRow';
import { StatsChart } from './StatsChart';
import { Card } from '../ui/Card';
import { Spacing } from '../../theme/spacing';
import type { MatchStats } from '../../types/stats';
import { formatPercent } from '../../utils/formatters';

interface Props {
  stats: MatchStats;
  nameA: string;
  nameB: string;
}

export function PerformanceSummary({ stats, nameA, nameB }: Props) {
  const { teamA: a, teamB: b } = stats;

  return (
    <View style={styles.container}>
      <Card>
        <StatRow label="Total Points" valueA={a.totalPoints} valueB={b.totalPoints} highlight />
        <StatRow label="Winners"      valueA={a.winners}     valueB={b.winners} />
        <StatRow label="Errors"       valueA={a.errors}      valueB={b.errors} />
        <StatRow label="Aces"         valueA={a.aces}        valueB={b.aces} />
        <StatRow label="Dinks"        valueA={a.dinks}       valueB={b.dinks} />
        <StatRow label="Win Rate"     valueA={formatPercent(a.winRate)} valueB={formatPercent(b.winRate)} />
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
});
