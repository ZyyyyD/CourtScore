import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import type { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { BorderRadius, Spacing } from '../../theme/spacing';
import type { ShotType, TeamSide } from '../../types/match';

const SHOTS: { key: ShotType; label: string }[] = [
  { key: 'winner', label: 'Winner' },
  { key: 'error',  label: 'Error' },
  { key: 'ace',    label: 'Ace' },
  { key: 'dink',   label: 'Dink' },
  { key: 'drop',   label: 'Drop' },
  { key: 'smash',  label: 'Smash' },
  { key: 'lob',    label: 'Lob' },
  { key: 'drive',  label: 'Drive' },
];

interface Props {
  sheetRef: React.RefObject<BottomSheet | null>;
  pendingSide: TeamSide | null;
  teamName: string;
  onConfirm: (side: TeamSide, shotType: ShotType | null) => void;
}

export function EventLoggerSheet({ sheetRef, pendingSide, teamName, onConfirm }: Props) {
  const [selected, setSelected] = useState<ShotType | null>(null);
  const snapPoints = useMemo(() => ['45%'], []);

  const renderBackdrop = useCallback(
    (props: BottomSheetDefaultBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
    ),
    [],
  );

  const confirm = (shot: ShotType | null) => {
    if (!pendingSide) return;
    onConfirm(pendingSide, shot);
    setSelected(null);
    sheetRef.current?.close();
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>Point for {teamName}</Text>
        <Text style={styles.subtitle}>Select shot type (optional)</Text>

        <View style={styles.chips}>
          {SHOTS.map((s) => (
            <Pressable
              key={s.key}
              onPress={() => setSelected(selected === s.key ? null : s.key)}
              style={[styles.chip, selected === s.key && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected === s.key && styles.chipTextSelected]}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.actions}>
          <Pressable onPress={() => confirm(null)} style={styles.skipBtn}>
            <Text style={styles.skipText}>SKIP</Text>
          </Pressable>
          <Pressable onPress={() => confirm(selected)} style={styles.confirmBtn}>
            <Text style={styles.confirmText}>CONFIRM</Text>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBg:  { backgroundColor: Colors.surfaceContainerHigh },
  handle:   { backgroundColor: Colors.outline },
  content:  { flex: 1, padding: Spacing.lg, gap: Spacing.md },
  title:    { ...Typography.headlineMd, color: Colors.gold },
  subtitle: { ...Typography.labelCaps, color: Colors.onSurfaceVariant },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainer,
  },
  chipSelected: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  chipText:         { ...Typography.labelCaps, color: Colors.onSurfaceVariant },
  chipTextSelected: { color: Colors.charcoal },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 'auto',
  },
  skipBtn: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  skipText:    { ...Typography.labelCaps, color: Colors.onSurfaceVariant },
  confirmBtn: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gold,
  },
  confirmText: { ...Typography.labelCaps, color: Colors.charcoal },
});
