import { View, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApi, useAuth } from "@/auth/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import {
  Card,
  Chip,
  HeaderButton,
  LineChart,
  ProgressRing,
  Screen,
  SectionHeading,
  StatTile,
  Text,
} from "@/components";
import { colors, fonts, spacing } from "@/theme";
import type { SubjectScore } from "@/api/types";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function StudentHome() {
  const api = useApi();
  const { session, signOut } = useAuth();
  const { data, loading, error, refreshing, reload, refresh } = useAsync(
    () => api.student.dashboard(),
    []
  );

  const onSignOut = () => {
    signOut();
    router.replace("/login");
  };

  return (
    <Screen
      eyebrow={data ? `${data.className} · Roll ${data.roll}` : "Student portal"}
      title={`${greeting()},\n${firstName(session?.name ?? data?.name ?? "")}`}
      right={<HeaderButton icon="log-out-outline" label="Sign out" onPress={onSignOut} />}
      loading={loading}
      error={error}
      onRetry={reload}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      {data && (
        <View style={{ gap: spacing.lg }}>
          {/* KPI row */}
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <StatTile
              tone="navy"
              icon="trophy"
              value={`${data.overall}%`}
              label="Overall average"
              sub="latest exams"
            />
            <StatTile
              tone="gold"
              icon="ribbon"
              value={data.rank.position ? `#${data.rank.position}` : "—"}
              label="Class rank"
              sub={data.rank.total ? `of ${data.rank.total} students` : undefined}
            />
          </View>

          {/* Attendance */}
          <Card>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1, paddingRight: spacing.md }}>
                <SectionHeading eyebrow="This year" title="Attendance" />
                <Text variant="bodyMuted">
                  {data.attendance >= 75
                    ? "You're meeting the attendance requirement. Keep it up."
                    : "Below the 75% requirement — try not to miss classes."}
                </Text>
                <Chip
                  label={data.attendance >= 75 ? "On track" : "Needs attention"}
                  tone={data.attendance >= 75 ? "green" : "red"}
                  icon={data.attendance >= 75 ? "checkmark-circle" : "warning"}
                />
              </View>
              <ProgressRing value={data.attendance} size={116} caption="present" />
            </View>
          </Card>

          {/* Growth trend */}
          <Card>
            <SectionHeading eyebrow="Progress" title="Marks growth" />
            <LineChart
              data={data.trend.map(([label, value]) => ({ label, value }))}
            />
          </Card>

          {/* Subjects */}
          <Card>
            <SectionHeading eyebrow="Latest scores" title="By subject" />
            {data.subjects.length === 0 ? (
              <Text variant="bodyMuted">No subject scores yet.</Text>
            ) : (
              <View style={{ gap: spacing.md }}>
                {data.subjects.map((s) => (
                  <SubjectRow key={s.subject} s={s} />
                ))}
              </View>
            )}
          </Card>

          {/* Quick links */}
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <QuickLink
              icon="document-text"
              label="Documents"
              hint="Report cards & TC"
              onPress={() => router.push("/(student)/documents")}
            />
            <QuickLink
              icon="card"
              label="Fees"
              hint="Dues & payments"
              onPress={() => router.push("/(student)/fees")}
            />
          </View>
        </View>
      )}
    </Screen>
  );
}

function SubjectRow({ s }: { s: SubjectScore }) {
  const pct = Math.max(0, Math.min(100, s.score));
  return (
    <View>
      <View style={styles.rowBetween}>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14.5 }} color={colors.ink}>
          {s.subject}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {s.change !== 0 && (
            <Chip
              label={`${s.change > 0 ? "+" : ""}${s.change}`}
              tone={s.change > 0 ? "green" : "red"}
              icon={s.change > 0 ? "trending-up" : "trending-down"}
            />
          )}
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15 }} color={colors.ink}>
            {s.score}%
          </Text>
        </View>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${pct}%`, backgroundColor: pct >= 40 ? colors.navy : colors.red },
          ]}
        />
      </View>
    </View>
  );
}

function QuickLink({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={{ flex: 1 }} onPress={onPress}>
      {({ pressed }) => (
        <Card style={[styles.quick, pressed && { opacity: 0.85 }]} padded={false}>
          <View style={styles.quickIcon}>
            <Ionicons name={icon} size={18} color={colors.blue} />
          </View>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15 }} color={colors.ink}>
            {label}
          </Text>
          <Text variant="small">{hint}</Text>
          <Ionicons
            name="arrow-forward"
            size={16}
            color={colors.muted}
            style={{ position: "absolute", top: spacing.lg, right: spacing.lg }}
          />
        </Card>
      )}
    </Pressable>
  );
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

const styles = StyleSheet.create({
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  track: {
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.line,
    marginTop: 8,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 999 },
  quick: { padding: spacing.lg, gap: 3, minHeight: 104, justifyContent: "flex-end" },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "auto",
  },
});
