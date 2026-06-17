import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { BorderRadius, Spacing } from '../../theme/spacing';

type BadgeVariant = 'win' | 'loss' | 'gold' | 'neutral' | 'live';

interface Props {
  label: string;
  variant?: BadgeVariant;
}

const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
  win:     { bg: '#18512c', text: Colors.tertiary },
  loss:    { bg: Colors.errorContainer, text: Colors.error },
  gold:    { bg: '#3c2f00', text: Colors.secondary },
  neutral: { bg: Colors.surfaceContainerHigh, text: Colors.onSurfaceVariant },
  live:    { bg: '#043829', text: Colors.primary },
};

export function Badge({ label, variant = 'neutral' }: Props) {
  const vs = variantMap[variant];
  return (
    <View style={[styles.badge, { backgroundColor: vs.bg }]}>
      <Text style={[styles.text, { color: vs.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.labelCaps,
  },
});
