import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { BorderRadius, Spacing } from '../../theme/spacing';

const SCREEN_W = Dimensions.get('window').width;

interface Props {
  title: string;
  labels: string[];
  valuesA: number[];
  valuesB?: number[];
  nameA?: string;
  nameB?: string;
}

export function StatsChart({ title, labels, valuesA, valuesB, nameA = 'You', nameB = 'Opponent' }: Props) {
  const chartConfig = {
    backgroundColor: Colors.surfaceContainer,
    backgroundGradientFrom: Colors.surfaceContainer,
    backgroundGradientTo: Colors.surfaceContainerHigh,
    decimalPlaces: 0,
    color: () => Colors.primary,
    labelColor: () => Colors.onSurfaceVariant,
    style: { borderRadius: BorderRadius.md },
    barPercentage: 0.6,
  };

  const data = {
    labels,
    datasets: [
      { data: valuesA, color: () => Colors.primary },
      ...(valuesB ? [{ data: valuesB, color: () => Colors.secondary }] : []),
    ],
    legend: valuesB ? [nameA, nameB] : [nameA],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <BarChart
        data={data}
        width={SCREEN_W - Spacing.lg * 2}
        height={180}
        chartConfig={chartConfig}
        style={styles.chart}
        yAxisLabel=""
        yAxisSuffix=""
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  title: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  chart: { borderRadius: BorderRadius.md, overflow: 'hidden' },
});
