import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Modal, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { Button } from '../../src/components/ui/Button';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { BorderRadius, Spacing } from '../../src/theme/spacing';
import { useAuthStore } from '../../src/stores/authStore';

export default function SplashScreen() {
  const { signInAsGuest } = useAuthStore();
  const [guestModalVisible, setGuestModalVisible] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGuest = async () => {
    const name = guestName.trim() || 'Player';
    setLoading(true);
    const err = await signInAsGuest(name);
    setLoading(false);
    if (err) {
      Alert.alert('Error', err);
      return;
    }
    setGuestModalVisible(false);
    router.replace('/(app)/home');
  };

  return (
    <ScreenWrapper bg={Colors.court} style={styles.wrapper}>
      {/* Logo area */}
      <View style={styles.logoArea}>
        <View style={styles.logoMark}>
          <Text style={styles.logoIcon}>⬡</Text>
        </View>
        <Text style={styles.appName}>COURTSCORE</Text>
        <Text style={styles.tagline}>Real-time pickleball scoring</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          label="Sign Up / Log In"
          onPress={() => router.push('/(auth)/login')}
          fullWidth
        />
        <Button
          label="Play as Guest"
          onPress={() => setGuestModalVisible(true)}
          variant="ghost"
          fullWidth
        />
      </View>

      <Text style={styles.version}>v1.0.0</Text>

      {/* Guest name modal */}
      <Modal visible={guestModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Enter your name</Text>
            <TextInput
              value={guestName}
              onChangeText={setGuestName}
              placeholder="Your name"
              placeholderTextColor={Colors.outline}
              style={styles.modalInput}
              maxLength={30}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setGuestModalVisible(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleGuest} style={styles.modalConfirm}>
                {loading ? null : <Text style={styles.modalConfirmText}>Continue</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
  },
  logoArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  logoMark: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoIcon: { fontSize: 40, color: Colors.charcoal },
  appName: {
    ...Typography.headlineLg,
    color: Colors.white,
    letterSpacing: 6,
    fontSize: 36,
  },
  tagline: {
    ...Typography.bodyMd,
    color: Colors.onPrimaryContainer,
  },
  actions: { gap: Spacing.md },
  version: {
    ...Typography.labelSm,
    color: Colors.onPrimaryContainer,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  modalTitle: { ...Typography.headlineMd, color: Colors.onSurface },
  modalInput: {
    backgroundColor: Colors.charcoal,
    borderRadius: BorderRadius.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.gold,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.onSurface,
    ...Typography.bodyLg,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.md, justifyContent: 'flex-end' },
  modalCancel: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  modalCancelText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  modalConfirm: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.md,
  },
  modalConfirmText: { ...Typography.bodyMd, fontWeight: '700', color: Colors.charcoal },
});
