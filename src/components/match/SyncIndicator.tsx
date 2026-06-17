import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withRepeat, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { ConnectionStatus } from '../../types/match';

interface Props {
  status: ConnectionStatus;
}

export function SyncIndicator({ status }: Props) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (status === 'live') {
      opacity.value = withRepeat(withTiming(0.3, { duration: 900 }), -1, true);
    } else {
      opacity.value = 1;
    }
  }, [status]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const cfg = {
    live:         { color: Colors.primary,  label: 'LIVE' },
    reconnecting: { color: Colors.secondary, label: 'SYNCING' },
    offline:      { color: Colors.error,     label: 'OFFLINE' },
  }[status];

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.dot, { backgroundColor: cfg.color }, dotStyle]} />
      <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot:   { width: 6, height: 6, borderRadius: 3 },
  label: { ...Typography.labelCaps },
});
