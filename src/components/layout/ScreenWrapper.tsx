import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  bg?: string;
  safeEdges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function ScreenWrapper({ children, style, bg = Colors.background, safeEdges = ['top', 'bottom'] }: Props) {
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={safeEdges}>
      <View style={[styles.inner, { backgroundColor: bg }, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  inner: { flex: 1 },
});
