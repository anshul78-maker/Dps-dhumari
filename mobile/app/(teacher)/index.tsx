import { View, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApi, useAuth } from "@/auth/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import {
  Card,
  Chip,
  EmptyState,
  Screen,
  SectionHeading,
  SignOutButton,
  StatTile,
  Text,
} from "@/components";
import { colors, fonts, radius, spacing } from "@/theme";
import type { TeacherClass } from "@/api/types";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const ACTIONS: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  href: string;
}[] = [
  { icon: "checkbox", label: "Attendance", hint: "Mark a class", href: "/(teacher)/attendance" },
  { icon: "create", label: "Enter marks", hint: "Record scores", href: "/(teacher)/marks" },
  { icon: "ribbon", label: "Report cards", hint: "Send a PDF", href: "/(teacher)/report-cards" },
  { icon: "megaphone", label: "Post notice", hint: "To a class", href: "/(teacher)/notices" },
];

export default function TeacherHome() {
  const api = useApi();
  const { session } = useAuth();
  const { data, loading, error, refreshing, reload, refresh } = useAsync(
    () => api.teacher.overview(),
    []
  );

  const classes = data?.classes ?? [];
  const classNames = new Set(classes.map((c) => c.class_name));
  const subjects = new Set(classes.map((c) => c.subject));

  return (
    <Screen
      eyebrow="Teacher portal"
      title={`${greeting()},\n${firstName(session?.name ?? data?.name ?? "")}`}
      right={<SignOutButton />}
      loading={loading}
      error={error}
      onRetry={reload}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      {data && (
        <View style={{ gap: spacing.lg }}>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <StatTile tone="navy" icon="grid" value={classNames.size} label="Classes" />
            <StatTile tone="gold" icon="library" value={subjects.size} label="Subjects" />
          </View>

          <View>
            <SectionHeading eyebrow="Shortcuts" title="Quick actions" />
            <View style={styles.grid}>
              {ACTIONS.map((a) => (
                <ActionCard key={a.label} {...a} />
              ))}
            </View>
          </View>

          <View>
            <SectionHeading eyebrow="My timetable" title="Classes I teach" />
            {classes.length === 0 ? (
              <EmptyState
                icon="grid-outline"
                title="No classes assigned"
                subtitle="Ask the office to assign your classes and subjects."
              />
            ) : (
              <View style={{ gap: spacing.md }}>
                {classes.map((c) => (
                  <ClassRow key={`${c.class_name}-${c.subject}`} c={c} />
                ))}
              </View>
            )}
          </View>
        </View>
      )}
    </Screen>
  );
}

function ActionCard({
  icon,
  label,
  hint,
  href,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  href: string;
}) {
  return (
    <Pressable style={styles.gridItem} onPress={() => router.push(href as never)}>
      {({ pressed }) => (
        <Card style={[styles.action, pressed && { opacity: 0.85 }]} padded={false}>
          <View style={styles.actionIcon}>
            <Ionicons name={icon} size={20} color={colors.blue} />
          </View>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15 }} color={colors.ink}>
            {label}
          </Text>
          <Text variant="small">{hint}</Text>
        </Card>
      )}
    </Pressable>
  );
}

function ClassRow({ c }: { c: TeacherClass }) {
  return (
    <Pressable
      onPress={() =>
        router.push(`/(teacher)/attendance?className=${encodeURIComponent(c.class_name)}` as never)
      }
    >
      {({ pressed }) => (
        <Card padded={false} style={[styles.classRow, pressed && { opacity: 0.85 }]}>
          <View style={styles.classIcon}>
            <Ionicons name="people" size={18} color={colors.navy} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15 }} color={colors.ink}>
              {c.class_name}
            </Text>
            <Chip label={c.subject} tone="blue" />
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Card>
      )}
    </Pressable>
  );
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  gridItem: { width: "47.5%", flexGrow: 1 },
  action: { padding: spacing.lg, gap: 3, minHeight: 104, justifyContent: "flex-end" },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "auto",
  },
  classRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  classIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
});
