import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenWrapper } from "../../src/components/layout/ScreenWrapper";
import { Header } from "../../src/components/layout/Header";
import { Card } from "../../src/components/ui/Card";
import { Input } from "../../src/components/ui/Input";
import { Button } from "../../src/components/ui/Button";
import { Badge } from "../../src/components/ui/Badge";
import { Colors } from "../../src/theme/colors";
import { Typography } from "../../src/theme/typography";
import { BorderRadius, Spacing } from "../../src/theme/spacing";
import { useAuthStore } from "../../src/stores/authStore";
import { useHistoryStore } from "../../src/stores/historyStore";

export default function ProfileScreen() {
  const { user, isGuest, guestName, signOut, updateProfile } = useAuthStore();
  const { matches } = useHistoryStore();

  const meta = user?.user_metadata ?? {};
  const displayName = isGuest ? guestName : (meta.full_name ?? "Player");
  const userId = user?.id ?? "";

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: meta.full_name ?? "",
    nickname: meta.nickname ?? "",
    dupr_rating: meta.dupr_rating ?? "",
    bio: meta.bio ?? "",
  });

  const wins = matches.filter(
    (m) =>
      m.winner_side ===
      m.match_players.find((p) => p.player_id === userId)?.team_side,
  ).length;
  const losses = matches.length - wins;
  const winRate =
    matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0;

  const handleSave = async () => {
    setSaving(true);
    const error = await updateProfile(form);
    setSaving(false);
    if (error) {
      Alert.alert("Error", error);
      return;
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setForm({
      full_name: meta.full_name ?? "",
      nickname: meta.nickname ?? "",
      dupr_rating: meta.dupr_rating ?? "",
      bio: meta.bio ?? "",
    });
    setEditing(false);
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/splash");
        },
      },
    ]);
  };

  return (
    <ScreenWrapper>
      <Header title="Profile" showBack={false} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          {meta.nickname ? (
            <Text style={styles.nickname}>"{meta.nickname}"</Text>
          ) : null}
          <View>{isGuest && <Badge label="GUEST" variant="neutral" />}</View>
          {user?.email && <Text style={styles.email}>{user.email}</Text>}
          {meta.dupr_rating ? (
            <View style={styles.duprBadge}>
              <Text style={styles.duprLabel}>DUPR</Text>
              <Text style={styles.duprValue}>{meta.dupr_rating}</Text>
            </View>
          ) : null}

          {!isGuest && !editing && (
            <Pressable style={styles.editBtn} onPress={() => setEditing(true)}>
              <Ionicons name="pencil" size={14} color={Colors.primary} />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </Pressable>
          )}
        </View>

        {/* Edit Form */}
        {!isGuest && editing && (
          <Card style={styles.editCard}>
            <Text style={styles.sectionTitle}>EDIT PROFILE</Text>
            <Input
              label="Full Name"
              value={form.full_name}
              onChangeText={(v) => setForm((f) => ({ ...f, full_name: v }))}
              placeholder="Your name"
              autoCapitalize="words"
            />
            <Input
              label="Nickname"
              value={form.nickname}
              onChangeText={(v) => setForm((f) => ({ ...f, nickname: v }))}
              placeholder="e.g. The Wall"
              autoCapitalize="words"
            />
            <Input
              label="DUPR Rating"
              value={form.dupr_rating}
              onChangeText={(v) => setForm((f) => ({ ...f, dupr_rating: v }))}
              placeholder="e.g. 4.25"
              keyboardType="decimal-pad"
            />
            <Input
              label="Bio"
              value={form.bio}
              onChangeText={(v) => setForm((f) => ({ ...f, bio: v }))}
              placeholder="Tell others about yourself..."
              multiline
              numberOfLines={3}
              style={styles.bioInput}
            />
            <View style={styles.editActions}>
              <Button
                label="Cancel"
                onPress={handleCancel}
                variant="secondary"
                style={{ flex: 1 }}
              />
              <Button
                label="Save"
                onPress={handleSave}
                loading={saving}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        )}

        {/* Bio display */}
        {!isGuest && !editing && meta.bio ? (
          <Card>
            <Text style={styles.sectionTitle}>BIO</Text>
            <Text style={styles.bioText}>{meta.bio}</Text>
          </Card>
        ) : null}

        {/* Career Stats */}
        <Card gold style={styles.statsCard}>
          <Text style={styles.cardTitle}>CAREER STATS</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <View style={styles.statTile}>
                <Text style={styles.statValue}>{matches.length}</Text>
                <Text style={styles.statLabel}>MATCHES</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statTile}>
                <Text style={[styles.statValue, styles.gold]}>{wins}</Text>
                <Text style={styles.statLabel}>WINS</Text>
              </View>
            </View>
            <View style={styles.statsRowDivider} />
            <View style={styles.statsRow}>
              <View style={styles.statTile}>
                <Text style={styles.statValue}>{losses}</Text>
                <Text style={styles.statLabel}>LOSSES</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statTile}>
                <Text style={[styles.statValue, styles.gold]}>{winRate}%</Text>
                <Text style={styles.statLabel}>WIN RATE</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Sign Out */}
        {isGuest ? (
          <Button
            label="Create Account to Save Progress"
            onPress={() => router.push("/(auth)/login")}
            variant="secondary"
            fullWidth
          />
        ) : null}
        <Button
          label="Sign Out"
          onPress={handleSignOut}
          variant="danger"
          fullWidth
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  avatarSection: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarLetter: { ...Typography.headlineLg, color: Colors.primary },
  displayName: { ...Typography.headlineMd, color: Colors.onSurface },
  nickname: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, fontStyle: "italic" },
  email: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  duprBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  duprLabel: { ...Typography.labelCaps, color: Colors.gold },
  duprValue: { ...Typography.bodyMd, color: Colors.gold, fontWeight: "700" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginTop: Spacing.xs,
  },
  editBtnText: { ...Typography.labelCaps, color: Colors.primary },
  editCard: { gap: Spacing.md },
  sectionTitle: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  bioInput: { height: 80, textAlignVertical: "top", paddingTop: Spacing.sm },
  editActions: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.sm },
  bioText: { ...Typography.bodyMd, color: Colors.onSurface, lineHeight: 22 },
  statsCard: { padding: 0, overflow: "hidden" },
  cardTitle: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  statsGrid: {
    backgroundColor: Colors.outlineVariant,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  statsRow: { flexDirection: "row" },
  statsRowDivider: { height: 1, backgroundColor: Colors.outlineVariant },
  statDivider: { width: 1, backgroundColor: Colors.outlineVariant },
  statTile: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: "center",
    gap: 4,
  },
  statValue: { ...Typography.headlineMd, color: Colors.onSurface },
  statLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
  },
  gold: { color: Colors.gold },
});
