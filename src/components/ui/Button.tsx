import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, type ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { BorderRadius, Spacing } from '../../theme/spacing';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary:   { bg: Colors.gold,   text: Colors.charcoal },
  secondary: { bg: Colors.surfaceContainerHigh, text: Colors.onSurface, border: Colors.outline },
  ghost:     { bg: 'transparent', text: Colors.primary, border: Colors.outlineVariant },
  danger:    { bg: Colors.errorContainer, text: Colors.error },
};

export function Button({ label, onPress, variant = 'primary', disabled, loading, style, fullWidth }: Props) {
  const vs = variantStyles[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: vs.bg, borderColor: vs.border ?? 'transparent', borderWidth: vs.border ? 1 : 0 },
        fullWidth && { width: '100%' },
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vs.text} size="small" />
      ) : (
        <Text style={[styles.label, { color: vs.text }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...Typography.bodyLg,
    fontWeight: '700',
  },
  disabled: { opacity: 0.4 },
  pressed:  { opacity: 0.8 },
});
