import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';
import { BorderRadius, Spacing } from '../../theme/spacing';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  gold?: boolean;  // gold top-border accent (Level 1 from DESIGN.md)
}

export function Card({ children, style, gold }: Props) {
  return (
    <View style={[styles.card, gold && styles.goldBorder, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  goldBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.gold,
    borderColor: Colors.outlineVariant,
  },
});
