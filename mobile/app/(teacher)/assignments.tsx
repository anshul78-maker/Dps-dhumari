import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "@/api/client";
import { useApi } from "@/auth/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  Picker,
  Screen,
  SignOutButton,
  Text,
} from "@/components";
import { colors, fonts, radius, spacing } from "@/theme";
import { dueLabel } from "@/utils/format";
import type { TeacherAssignment, TeacherClass } from "@/api/types";

export default function TeacherAssignments() {
  const api = useApi();
  const overview = useAsync(() => api.teacher.overview(), []);
  const assignments = useAsync(() => api.teacher.assignments(), []);
  const [showForm, setShowForm] = useState(false);

  const list = assignments.data?.assignments ?? [];

  return (
    <Screen
      eyebrow="Classwork"
      title="Assignments"
      subtitle="Set work and track who has submitted."
      right={<SignOutButton />}
      loading={assignments.loading}
      error={assignments.error}
      onRetry={assignments.reload}
      refreshing={assignments.refreshing}
      onRefresh={assignments.refresh}
    >
      {assignments.data && (
        <View style={{ gap: spacing.lg }}>
          <Button
            label={showForm ? "Close" : "New assignment"}
            icon={showForm ? "close" : "add"}
            variant={showForm ? "secondary" : "primary"}
            onPress={() => setShowForm((s) => !s)}
          />

          {showForm && (
            <CreateAssignment
              classes={overview.data?.classes ?? []}
              onCreated={() => {
                setShowForm(false);
                assignments.reload();
              }}
            />
          )}

          {list.length === 0 ? (
            <EmptyState
              icon="reader-outline"
              title="No assignments yet"
              subtitle="Tap “New assignment” to set work for one of your classes."
            />
          ) : (
            <View style={{ gap: spacing.md }}>
              {list.map((a) => (
                <AssignmentCard key={a.id} a={a} />
              ))}
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}

function AssignmentCard({ a }: { a: TeacherAssignment }) {
  const due = dueLabel(a.due_date);
  const pct = a.class_size ? Math.round((a.submitted / a.class_size) * 100) : 0;
  return (
    <Pressable
      onPress={() =>
        router.push(
          `/(teacher)/submissions?id=${a.id}&title=${encodeURIComponent(a.title)}` as never
        )
      }
    >
      {({ pressed }) => (
        <Card style={pressed ? { opacity: 0.85 } : undefined}>
          <View style={styles.topRow}>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Chip label={a.class_name} tone="neutral" />
              <Chip label={a.subject} tone="blue" />
            </View>
            {due && (
              <Chip
                label={due.text}
                tone={due.overdue ? "red" : "neutral"}
                icon={due.overdue ? "alarm" : "time-outline"}
              />
            )}
          </View>

          <Text variant="h3" style={{ marginTop: spacing.md }}>
            {a.title}
          </Text>

          <View style={{ marginTop: spacing.md }}>
            <View style={styles.subRow}>
              <Text variant="small" style={{ fontFamily: fonts.bodySemi }} color={colors.ink}>
                {a.submitted}/{a.class_size} submitted
              </Text>
              <Text variant="small" color={colors.blue} style={{ fontFamily: fonts.bodySemi }}>
                View submissions ›
              </Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct}%` }]} />
            </View>
          </View>
        </Card>
      )}
    </Pressable>
  );
}

function CreateAssignment({
  classes,
  onCreated,
}: {
  classes: TeacherClass[];
  onCreated: () => void;
}) {
  const api = useApi();
  const classNames = useMemo(() => [...new Set(classes.map((c) => c.class_name))], [classes]);
  const [className, setClassName] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [hasDue, setHasDue] = useState(false);
  const [due, setDue] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  });
  const [saving, setSaving] = useState(false);

  const subjects = useMemo(
    () =>
      className
        ? [...new Set(classes.filter((c) => c.class_name === className).map((c) => c.subject))]
        : [],
    [classes, className]
  );

  useEffect(() => {
    if (!className && classNames.length) setClassName(classNames[0]);
  }, [classNames, className]);
  useEffect(() => {
    if (subjects.length) setSubject((s) => (s && subjects.includes(s) ? s : subjects[0]));
    else setSubject(null);
  }, [subjects]);

  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const shiftDue = (delta: number) => {
    const d = new Date(due);
    d.setDate(d.getDate() + delta);
    if (d < new Date(new Date().toDateString())) return;
    setDue(d);
  };

  const onSubmit = async () => {
    if (!className || !subject) {
      Alert.alert("Pick a class", "Choose the class and subject first.");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Title needed", "Give the assignment a title.");
      return;
    }
    try {
      setSaving(true);
      await api.teacher.createAssignment({
        title: title.trim(),
        className,
        subject,
        details: details.trim(),
        due: hasDue ? iso(due) : null,
      });
      onCreated();
    } catch (e) {
      Alert.alert("Couldn't create", e instanceof ApiError ? e.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card accentTop style={{ gap: spacing.md }}>
      <Text variant="h3">New assignment</Text>
      <Picker label="Class" options={classNames} value={className} onChange={setClassName} />
      <Picker label="Subject" options={subjects} value={subject} onChange={setSubject} />
      <Field label="Title" icon="create-outline" placeholder="e.g. Chapter 4 worksheet" value={title} onChangeText={setTitle} />
      <Field
        label="Details (optional)"
        icon="list-outline"
        placeholder="Instructions for students"
        value={details}
        onChangeText={setDetails}
        multiline
      />

      <Pressable style={styles.dueToggle} onPress={() => setHasDue((h) => !h)}>
        <Ionicons
          name={hasDue ? "checkbox" : "square-outline"}
          size={20}
          color={hasDue ? colors.navy : colors.muted}
        />
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14 }} color={colors.ink}>
          Set a due date
        </Text>
      </Pressable>

      {hasDue && (
        <View style={styles.dueRow}>
          <Pressable onPress={() => shiftDue(-1)} hitSlop={8} style={styles.dateBtn}>
            <Ionicons name="chevron-back" size={18} color={colors.navy} />
          </Pressable>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14.5 }} color={colors.ink}>
            {iso(due)}
          </Text>
          <Pressable onPress={() => shiftDue(1)} hitSlop={8} style={styles.dateBtn}>
            <Ionicons name="chevron-forward" size={18} color={colors.navy} />
          </Pressable>
        </View>
      )}

      <Button label="Create assignment" icon="checkmark" loading={saving} onPress={onSubmit} />
    </Card>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  subRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  track: {
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.line,
    marginTop: 7,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 999, backgroundColor: colors.green },
  dueToggle: { flexDirection: "row", alignItems: "center", gap: 8 },
  dueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  dateBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
});
