import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { Header } from '../../src/components/layout/Header';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Spacing } from '../../src/theme/spacing';
import { useAuthStore } from '../../src/stores/authStore';

type Mode = 'login' | 'signup';

export default function LoginScreen() {
  const { signIn, signUp } = useAuthStore();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    const err = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password, displayName || 'Player');
    setLoading(false);

    if (err) {
      Alert.alert('Error', err);
      return;
    }
    router.replace('/(app)/home');
  };

  return (
    <ScreenWrapper>
      <Header title={mode === 'login' ? 'Log In' : 'Sign Up'} showBack />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>
          {mode === 'login'
            ? 'Welcome back to the court.'
            : 'Create your account to start tracking.'}
        </Text>

        <View style={styles.form}>
          {mode === 'signup' && (
            <Input
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name on the court"
              autoCapitalize="words"
            />
          )}
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />
        </View>

        <Button
          label={mode === 'login' ? 'Log In' : 'Create Account'}
          onPress={handleSubmit}
          loading={loading}
          fullWidth
          style={styles.submitBtn}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          </Text>
          <Text
            style={styles.switchLink}
            onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? 'Sign Up' : 'Log In'}
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, gap: Spacing.xxl, flexGrow: 1 },
  subtitle: { ...Typography.bodyLg, color: Colors.onSurfaceVariant },
  form: { gap: Spacing.md },
  submitBtn: { marginTop: Spacing.md },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.md },
  switchText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  switchLink: { ...Typography.bodyMd, color: Colors.primary, fontWeight: '700' },
});
