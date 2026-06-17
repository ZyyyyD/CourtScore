import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

interface Props {
  label: string;
  valueA: string | number;
  valueB?: string | number;
  highlight?: boolean;
}

export function StatRow({ label, valueA, valueB, highlight }: Props) {
  return (
    <View style={styles.row}>
      <Text style={[styles.value, highlight && styles.gold]}>{valueA}</Text>
      <Text style={styles.label}>{label}</Text>
      {valueB !== undefined && (
        <Text style={[styles.value, highlight && styles.gold]}>{valueB}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
  },
  value: {
    width: 48,
    textAlign: 'center',
    ...Typography.bodyLg,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  gold: { color: Colors.gold },
});
