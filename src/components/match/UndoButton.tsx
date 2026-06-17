import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { BorderRadius, Spacing } from '../../theme/spacing';

interface Props {
  onPress: () => void;
  disabled?: boolean;
}

export function UndoButton({ onPress, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.btn, disabled && styles.disabled, pressed && styles.pressed]}
      hitSlop={8}
    >
      <Ionicons name="arrow-undo" size={16} color={Colors.onSurfaceVariant} />
      <Text style={styles.label}>UNDO</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainer,
  },
  label: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
  },
  disabled: { opacity: 0.3 },
  pressed:  { borderColor: Colors.error, backgroundColor: Colors.errorContainer },
});
