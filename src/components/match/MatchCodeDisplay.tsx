import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { BorderRadius, Spacing } from '../../theme/spacing';

interface Props {
  code: string;
  compact?: boolean;
}

export function MatchCodeDisplay({ code, compact }: Props) {
  const copy = async () => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied!', `Match code ${code} copied to clipboard.`);
  };

  if (compact) {
    return (
      <View style={styles.compactRow}>
        <Text style={styles.compactCode}>{code}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>MATCH CODE</Text>
      <Pressable onPress={copy} style={styles.codeRow}>
        <Text style={styles.code}>{code}</Text>
        <Ionicons name="copy-outline" size={20} color={Colors.gold} />
      </Pressable>
      <Text style={styles.hint}>Share this code with your opponent</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.sm },
  label: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  code: {
    ...Typography.headlineLg,
    color: Colors.gold,
    letterSpacing: 4,
  },
  hint: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },
  compactRow: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  compactCode: {
    ...Typography.labelCaps,
    color: Colors.gold,
    letterSpacing: 2,
  },
});
