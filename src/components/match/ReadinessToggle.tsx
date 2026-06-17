import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { BorderRadius, Spacing } from '../../theme/spacing';

interface Props {
  playerName: string;
  isReady: boolean;
  isYou: boolean;
  isWaiting?: boolean;
  onToggle?: () => void;
}

export function ReadinessToggle({ playerName, isReady, isYou, isWaiting, onToggle }: Props) {
  return (
    <View style={[styles.row, isReady && styles.rowReady]}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{playerName}</Text>
        {isWaiting && <Text style={styles.waiting}>Waiting to join...</Text>}
      </View>
      {isYou && !isWaiting ? (
        <Pressable onPress={onToggle} style={[styles.toggle, isReady && styles.toggleReady]}>
          <Ionicons
            name={isReady ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={isReady ? Colors.charcoal : Colors.onSurfaceVariant}
          />
          <Text style={[styles.toggleLabel, isReady && styles.toggleLabelReady]}>
            {isReady ? 'READY' : 'NOT READY'}
          </Text>
        </Pressable>
      ) : (
        <View style={[styles.status, isReady && styles.statusReady]}>
          <Ionicons
            name={isReady ? 'checkmark-circle' : 'time-outline'}
            size={16}
            color={isReady ? Colors.charcoal : Colors.onSurfaceVariant}
          />
          <Text style={[styles.statusLabel, isReady && styles.statusLabelReady]}>
            {isReady ? 'READY' : 'WAITING'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainer,
  },
  rowReady: { borderColor: Colors.primary },
  info: { flex: 1 },
  name: { ...Typography.bodyLg, color: Colors.onSurface },
  waiting: { ...Typography.labelSm, color: Colors.onSurfaceVariant, marginTop: 2 },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  toggleReady: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  toggleLabel: { ...Typography.labelCaps, color: Colors.onSurfaceVariant },
  toggleLabelReady: { color: Colors.charcoal },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  statusReady: { backgroundColor: Colors.primary },
  statusLabel: { ...Typography.labelCaps, color: Colors.onSurfaceVariant, fontSize: 10 },
  statusLabelReady: { color: Colors.charcoal },
});
