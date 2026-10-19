import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "@/api/client";
import { useApi } from "@/auth/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Screen,
  SignOutButton,
  Text,
} from "@/components";
import { colors, fonts, radius, spacing } from "@/theme";
import { formatDate } from "@/utils/format";
import type { ClassStudent } from "@/api/types";

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function Attendance() {
  const api = useApi();
  const params = useLocalSearchParams<{ className?: string }>();
  const overview = useAsync(() => api.teacher.overview(), []);

  const classNames = useMemo(
    () => [...new Set((overview.data?.classes ?? []).map((c) => c.class_name))],
    [overview.data]
  );

  const [selected, setSelected] = useState<string | null>(null);
  const [date, setDate] = useState(() => new Date());
  const [present, setPresent] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Default the selected class once classes load.
  useEffect(() => {
    if (!selected && classNames.length) {
      setSelected(
        params.className && classNames.includes(params.className)
          ? params.className
          : classNames[0]
      );
    }
  }, [classNames, selected, params.className]);

  const students = useAsync(
    () =>
      selected
        ? api.teacher.classStudents(selected)
        : Promise.resolve({ students: [] as ClassStudent[] }),
    [selected]
  );

  // Seed everyone present whenever the roster changes.
  useEffect(() => {
    if (students.data) {
      const seed: Record<number, boolean> = {};
      for (const s of students.data.students) seed[s.id] = true;
      setPresent(seed);
    }
  }, [students.data]);

  const roster = students.data?.students ?? [];
  const presentCount = roster.filter((s) => present[s.id]).length;

  const shiftDay = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    if (d > new Date()) return; // no future dates
    setDate(d);
  };

  const onSave = async () => {
    if (!selected || roster.length === 0) return;
    try {
      setSaving(true);
      const records = roster.map((s) => ({ studentId: s.id, present: !!present[s.id] }));
      const res = await api.teacher.saveAttendance({ date: isoDay(date), records });
      Alert.alert("Attendance saved", `${res.count} students recorded for ${selected}.`);
    } catch (e) {
      Alert.alert("Couldn't save", e instanceof ApiError ? e.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const isToday = isoDay(date) === isoDay(new Date());

  return (
    <Screen
      eyebrow="Register"
      title="Attendance"
      subtitle="Pick a class and date, then mark the register."
      right={<SignOutButton />}
      loading={overview.loading}
      error={overview.error}
      onRetry={overview.reload}
    >
      {overview.data && (
        <View style={{ gap: spacing.lg }}>
          {/* Class picker */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm, paddingVertical: 2 }}
          >
            {classNames.map((name) => {
              const active = name === selected;
              return (
                <Pressable
                  key={name}
                  onPress={() => setSelected(name)}
                  style={[styles.classChip, active && styles.classChipActive]}
                >
                  <Text
                    style={{ fontFamily: fonts.bodySemi, fontSize: 13.5 }}
                    color={active ? colors.white : colors.ink}
                  >
                    {name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Date stepper */}
          <Card padded={false} style={styles.dateRow}>
            <Pressable onPress={() => shiftDay(-1)} hitSlop={8} style={styles.dateBtn}>
              <Ionicons name="chevron-back" size={20} color={colors.navy} />
            </Pressable>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15 }} color={colors.ink}>
                {isToday ? "Today" : formatDate(isoDay(date))}
              </Text>
              {!isToday && <Text variant="small">{formatDate(isoDay(date))}</Text>}
            </View>
            <Pressable
              onPress={() => shiftDay(1)}
              hitSlop={8}
              style={[styles.dateBtn, isToday && { opacity: 0.3 }]}
              disabled={isToday}
            >
              <Ionicons name="chevron-forward" size={20} color={colors.navy} />
            </Pressable>
          </Card>

          {/* Roster */}
          {students.loading ? (
            <View style={{ paddingVertical: spacing.xxl }}>
              <ActivityIndicator color={colors.navy} />
            </View>
          ) : roster.length === 0 ? (
            <EmptyState icon="people-outline" title="No students" subtitle="This class has no students yet." />
          ) : (
            <>
              <View style={styles.summaryRow}>
                <Text variant="bodyMuted">
                  {presentCount}/{roster.length} present
                </Text>
                <View style={{ flexDirection: "row", gap: spacing.md }}>
                  <Pressable onPress={() => setAll(roster, setPresent, true)}>
                    <Text variant="small" color={colors.green} style={{ fontFamily: fonts.bodySemi }}>
                      All present
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => setAll(roster, setPresent, false)}>
                    <Text variant="small" color={colors.red} style={{ fontFamily: fonts.bodySemi }}>
                      All absent
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Card padded={false} style={{ overflow: "hidden" }}>
                {roster.map((s, i) => {
                  const isPresent = !!present[s.id];
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => setPresent((p) => ({ ...p, [s.id]: !p[s.id] }))}
                      style={[styles.studentRow, i > 0 && styles.rowBorder]}
                    >
                      <Avatar name={s.name} size={38} tone="light" />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14.5 }} color={colors.ink}>
                          {s.name}
                        </Text>
                        <Text variant="small">Roll {s.roll}</Text>
                      </View>
                      <View
                        style={[
                          styles.toggle,
                          { backgroundColor: isPresent ? "#e4f3e3" : "#fdecef" },
                        ]}
                      >
                        <Ionicons
                          name={isPresent ? "checkmark-circle" : "close-circle"}
                          size={16}
                          color={isPresent ? colors.green : colors.red}
                        />
                        <Text
                          style={{ fontFamily: fonts.bodyBold, fontSize: 12.5 }}
                          color={isPresent ? colors.green : colors.red}
                        >
                          {isPresent ? "Present" : "Absent"}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </Card>

              <Button
                label="Save attendance"
                icon="save-outline"
                loading={saving}
                onPress={onSave}
              />
            </>
          )}
        </View>
      )}
    </Screen>
  );
}

function setAll(
  roster: ClassStudent[],
  setPresent: (updater: (p: Record<number, boolean>) => Record<number, boolean>) => void,
  value: boolean
) {
  setPresent(() => {
    const next: Record<number, boolean> = {};
    for (const s of roster) next[s.id] = value;
    return next;
  });
}

const styles = StyleSheet.create({
  classChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.line,
  },
  classChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  dateBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
