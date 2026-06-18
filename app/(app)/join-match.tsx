import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { ScreenWrapper } from "../../src/components/layout/ScreenWrapper";
import { Header } from "../../src/components/layout/Header";
import { Input } from "../../src/components/ui/Input";
import { Button } from "../../src/components/ui/Button";
import { Colors } from "../../src/theme/colors";
import { Typography } from "../../src/theme/typography";
import { Spacing } from "../../src/theme/spacing";
import { useAuthStore } from "../../src/stores/authStore";
import { useMatchStore } from "../../src/stores/matchStore";
import { joinMatch } from "../../src/hooks/useMatch";
import { isValidMatchCode } from "../../src/utils";

export default function JoinMatchScreen() {
  const { user, isGuest, guestName } = useAuthStore();
  const { setMyTeamSide } = useMatchStore();
  const [suffix, setSuffix] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const code = suffix.length > 0 ? `PKL-${suffix}` : "PKL-";

  const handleCodeChange = (val: string) => {
    setError("");
    // Strip any PKL- prefix the user might paste or type, keep only the 4-char suffix
    const clean = val
      .replace(/[^A-Z0-9]/gi, "")
      .toUpperCase()
      .replace(/^PKL/i, "")
      .slice(0, 4);
    setSuffix(clean);
  };

  const handleJoin = async () => {
    if (!isValidMatchCode(code)) {
      setError("Enter a valid code like PKL-1234");
      return;
    }
    setLoading(true);
    const result = await joinMatch(
      code,
      user?.id ?? null,
      isGuest ? guestName : null,
    );
    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }
    setMyTeamSide("team_b");
    router.push(`/(match)/lobby/${result.matchId}` as never);
  };

  return (
    <ScreenWrapper>
      <Header title="Join Match" showBack={false} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.content}>
          <Text style={styles.label}>ENTER MATCH CODE</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codePrefix}>PKL -</Text>
            <Input
              value={suffix}
              onChangeText={handleCodeChange}
              autoCapitalize="characters"
              maxLength={4}
              error={error}
              placeholder="XXXX"
              style={styles.codeInput}
              multiline={false}
              scrollEnabled={false}
            />
          </View>
          <Text style={styles.hint}>
            Ask your opponent for the 8-character code (e.g. PKL-A3B7)
          </Text>
        </View>

        <View style={styles.footer}>
          <Button
            label="Join Match"
            onPress={handleJoin}
            loading={loading}
            disabled={suffix.length < 4}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
    justifyContent: "center",
  },
  label: { ...Typography.labelCaps, color: Colors.onSurfaceVariant },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    justifyContent: "center",
  },
  codePrefix: {
    ...Typography.headlineMd,
    color: Colors.onSurfaceVariant,
    fontSize: 28,
    letterSpacing: 4,
  },
  codeInput: {
    width: 140,
    ...Typography.headlineMd,
    letterSpacing: 4,
    textAlign: "center",
    height: 72,
    fontSize: 28,
  },
  hint: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
  },
  footer: { padding: Spacing.lg },
});
