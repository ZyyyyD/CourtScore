import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { BorderRadius, Spacing } from '../../theme/spacing';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        {...rest}
        style={[
          styles.input,
          focused && styles.focused,
          error && styles.errored,
          style,
        ]}
        placeholderTextColor={Colors.outline}
        onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
        onBlur={(e)  => { setFocused(false); rest.onBlur?.(e); }}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
  },
  input: {
    backgroundColor: Colors.charcoal,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderBottomWidth: 2,
    borderBottomColor: Colors.outlineVariant,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.onSurface,
    ...Typography.bodyMd,
    height: 52,
  },
  focused: {
    borderBottomColor: Colors.gold,
    borderColor: Colors.outline,
  },
  errored: {
    borderBottomColor: Colors.error,
  },
  error: {
    ...Typography.labelSm,
    color: Colors.error,
  },
});
