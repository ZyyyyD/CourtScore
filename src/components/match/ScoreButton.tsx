import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { BorderRadius, Spacing } from '../../theme/spacing';

interface Props {
  teamName: string;
  onPress: () => void;
  disabled?: boolean;
}

export function ScoreButton({ teamName, onPress, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.plus}>+1</Text>
      <Text style={styles.teamName} numberOfLines={1}>{teamName}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    height: 96,
    backgroundColor: Colors.court,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.courtAccent,
    gap: 4,
  },
  plus: {
    ...Typography.headlineLg,
    color: Colors.gold,
    fontWeight: '800',
  },
  teamName: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
  },
  disabled: { opacity: 0.35 },
  pressed: {
    borderColor: Colors.gold,
    borderWidth: 2,
    backgroundColor: Colors.primaryContainer,
  },
});
