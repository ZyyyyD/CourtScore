import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

interface Props {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
}

export function Header({ title, showBack = true, right }: Props) {
  return (
    <View style={styles.container}>
      {showBack ? (
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={Colors.onSurface} />
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={styles.rightSlot}>{right ?? null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  backBtn: { width: 32 },
  placeholder: { width: 32 },
  title: {
    flex: 1,
    textAlign: 'center',
    color: Colors.onSurface,
    ...Typography.headlineMd,
  },
  rightSlot: { width: 32, alignItems: 'flex-end' },
});
