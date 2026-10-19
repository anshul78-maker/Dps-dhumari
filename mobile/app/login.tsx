import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { Button, Card, Crest, Eyebrow, Field, Text } from "@/components";
import { colors, fonts, gradients, radius, spacing } from "@/theme";

type Portal = "student" | "teacher" | "office";

const PORTALS: Record<
  Portal,
  { tab: string; title: string; label: string; icon: keyof typeof Ionicons.glyphMap; placeholder: string }
> = {
  student: {
    tab: "Student",
    title: "Student Login",
    label: "Admission number",
    icon: "school-outline",
    placeholder: "Enter admission number",
  },
  teacher: {
    tab: "Teacher",
    title: "Teacher Login",
    label: "Teacher ID",
    icon: "easel-outline",
    placeholder: "Enter Teacher ID",
  },
  office: {
    tab: "Office",
    title: "Office Login",
    label: "Staff ID",
    icon: "briefcase-outline",
    placeholder: "Enter staff ID",
  },
};

export default function Login() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [portal, setPortal] = useState<Portal>("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cfg = PORTALS[portal];

  const onSubmit = async () => {
    if (!username.trim() || !password) {
      setError("Enter your ID and password.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const s = await signIn(username, password);
      const target =
        s.role === "teacher"
          ? "/(teacher)"
          : s.role === "accountant"
            ? "/(accountant)"
            : s.role === "student"
              ? "/(student)"
              : null;
      if (!target) {
        setError("This account has no mobile portal. Please use the website.");
        return;
      }
      router.replace(target as never);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't sign you in. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.cream }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Navy hero */}
        <LinearGradient
          colors={gradients.navy}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + spacing.xl }]}
        >
          <View style={styles.grid} pointerEvents="none" />
          <Crest size={88} />
          <View style={{ marginTop: spacing.lg, alignItems: "center" }}>
            <Eyebrow pill={false} color={colors.gold}>
              School ERP Portal
            </Eyebrow>
            <Text
              style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 30, marginTop: 8 }}
              color={colors.white}
              center
            >
              Dr. Lokmandas
            </Text>
            <Text
              style={{ fontFamily: fonts.displaySemi, fontSize: 20, fontStyle: "italic" }}
              color={colors.gold}
              center
            >
              Public School
            </Text>
          </View>
        </LinearGradient>

        {/* Login card overlapping the hero */}
        <View style={styles.cardWrap}>
          <Card accentTop style={styles.card}>
            <Text variant="h2">Choose your portal</Text>
            <Text variant="bodyMuted" style={{ marginTop: 4 }}>
              Sign in with the credentials issued by the school office.
            </Text>

            {/* Portal switcher */}
            <View style={styles.switcher}>
              {(Object.keys(PORTALS) as Portal[]).map((p) => {
                const active = p === portal;
                return (
                  <Pressable
                    key={p}
                    onPress={() => {
                      setPortal(p);
                      setError(null);
                    }}
                    style={[styles.tab, active && styles.tabActive]}
                  >
                    <Ionicons
                      name={PORTALS[p].icon}
                      size={15}
                      color={active ? colors.ink : colors.muted}
                    />
                    <Text
                      style={{ fontFamily: fonts.bodySemi, fontSize: 13 }}
                      color={active ? colors.ink : colors.muted}
                    >
                      {PORTALS[p].tab}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
              <Field
                label={cfg.label}
                icon={cfg.icon}
                placeholder={cfg.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={setUsername}
                returnKeyType="next"
              />
              <Field
                label="Password"
                icon="lock-closed-outline"
                placeholder="Enter your password"
                password
                value={password}
                onChangeText={setPassword}
                returnKeyType="go"
                onSubmitEditing={onSubmit}
              />

              {!!error && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={16} color={colors.red} />
                  <Text variant="small" color={colors.red} style={{ flex: 1 }}>
                    {error}
                  </Text>
                </View>
              )}

              <Button
                label={`Sign in as ${cfg.tab}`}
                icon="arrow-forward"
                loading={submitting}
                onPress={onSubmit}
                style={{ marginTop: 4 }}
              />
            </View>
          </Card>

          <Text variant="small" center style={{ marginTop: spacing.lg }}>
            Powered by WeTakeFWD ERP
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: 72,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: "hidden",
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
  },
  cardWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: -52,
  },
  card: { padding: spacing.xl },
  switcher: {
    flexDirection: "row",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 4,
    marginTop: spacing.lg,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: radius.sm + 1,
  },
  tabActive: {
    backgroundColor: colors.white,
    shadowColor: colors.navy,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  errorRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    backgroundColor: "#fdecef",
    borderRadius: radius.sm,
    padding: 10,
  },
});
