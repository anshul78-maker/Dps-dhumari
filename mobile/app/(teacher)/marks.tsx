import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, TextInput, View } from "react-native";
import { ApiError } from "@/api/client";
import { useApi } from "@/auth/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Picker,
  Screen,
  SignOutButton,
  Text,
} from "@/components";
import { colors, fonts, radius, spacing } from "@/theme";
import type { ClassStudent } from "@/api/types";

export default function MarksEntry() {
  const api = useApi();
  const overview = useAsync(() => api.teacher.overview(), []);
  const classes = overview.data?.classes ?? [];

  const classNames = useMemo(() => [...new Set(classes.map((c) => c.class_name))], [classes]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [exam, setExam] = useState("");
  const [max, setMax] = useState("100");
  const [scores, setScores] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  const subjects = useMemo(
    () =>
      selectedClass
        ? [...new Set(classes.filter((c) => c.class_name === selectedClass).map((c) => c.subject))]
        : [],
    [classes, selectedClass]
  );

  useEffect(() => {
    if (!selectedClass && classNames.length) setSelectedClass(classNames[0]);
  }, [classNames, selectedClass]);

  useEffect(() => {
    // Reset subject when the class changes.
    if (subjects.length) setSelectedSubject((s) => (s && subjects.includes(s) ? s : subjects[0]));
    else setSelectedSubject(null);
  }, [subjects]);

  const students = useAsync(
    () =>
      selectedClass
        ? api.teacher.classStudents(selectedClass)
        : Promise.resolve({ students: [] as ClassStudent[] }),
    [selectedClass]
  );
  const roster = students.data?.students ?? [];

  useEffect(() => {
    setScores({});
  }, [selectedClass, selectedSubject, exam]);

  const maxNum = Number(max) || 0;
  const entered = roster.filter((s) => scores[s.id]?.trim());

  const onSave = async () => {
    if (!selectedClass || !selectedSubject) return;
    if (!exam.trim()) {
      Alert.alert("Exam name needed", "Enter the exam or test name first.");
      return;
    }
    if (!(maxNum > 0)) {
      Alert.alert("Total needed", "Enter a valid total (max score).");
      return;
    }
    // Validate entered scores.
    for (const s of entered) {
      const v = Number(scores[s.id]);
      if (!Number.isFinite(v) || v < 0 || v > maxNum) {
        Alert.alert("Check scores", `${s.name}'s score must be between 0 and ${maxNum}.`);
        return;
      }
    }
    if (entered.length === 0) {
      Alert.alert("Nothing to save", "Enter at least one student's score.");
      return;
    }

    try {
      setSaving(true);
      let ok = 0;
      for (const s of entered) {
        await api.teacher.saveMark({
          studentId: s.id,
          className: selectedClass,
          subject: selectedSubject,
          exam: exam.trim(),
          score: Number(scores[s.id]),
          max: maxNum,
        });
        ok++;
      }
      Alert.alert("Marks saved", `${ok} score${ok === 1 ? "" : "s"} recorded for ${exam.trim()}.`);
      setScores({});
    } catch (e) {
      Alert.alert("Couldn't save", e instanceof ApiError ? e.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      eyebrow="Gradebook"
      title="Enter marks"
      subtitle="Record exam scores for a class and subject."
      right={<SignOutButton />}
      loading={overview.loading}
      error={overview.error}
      onRetry={overview.reload}
    >
      {overview.data && (
        <View style={{ gap: spacing.lg }}>
          <Picker label="Class" options={classNames} value={selectedClass} onChange={setSelectedClass} />
          <Picker
            label="Subject"
            options={subjects}
            value={selectedSubject}
            onChange={setSelectedSubject}
          />

          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={{ flex: 2 }}>
              <Field
                label="Exam / test"
                icon="document-text-outline"
                placeholder="e.g. Unit Test 2"
                value={exam}
                onChangeText={setExam}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Total"
                icon="calculator-outline"
                placeholder="100"
                keyboardType="number-pad"
                value={max}
                onChangeText={setMax}
              />
            </View>
          </View>

          {students.loading ? (
            <View style={{ paddingVertical: spacing.xxl }}>
              <ActivityIndicator color={colors.navy} />
            </View>
          ) : roster.length === 0 ? (
            <EmptyState icon="people-outline" title="No students" subtitle="This class has no students yet." />
          ) : (
            <>
              <Text variant="bodyMuted">
                {entered.length} of {roster.length} entered
              </Text>
              <Card padded={false} style={{ overflow: "hidden" }}>
                {roster.map((s, i) => (
                  <View key={s.id} style={[styles.row, i > 0 && styles.rowBorder]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14.5 }} color={colors.ink}>
                        {s.name}
                      </Text>
                      <Text variant="small">Roll {s.roll}</Text>
                    </View>
                    <View style={styles.scoreBox}>
                      <TextInput
                        value={scores[s.id] ?? ""}
                        onChangeText={(t) =>
                          setScores((p) => ({ ...p, [s.id]: t.replace(/[^0-9.]/g, "") }))
                        }
                        keyboardType="number-pad"
                        placeholder="—"
                        placeholderTextColor={colors.muted}
                        style={styles.scoreInput}
                        maxLength={6}
                      />
                      <Text variant="small" color={colors.muted}>
                        / {maxNum || "?"}
                      </Text>
                    </View>
                  </View>
                ))}
              </Card>

              <Button
                label={`Save ${entered.length || ""} mark${entered.length === 1 ? "" : "s"}`.replace("  ", " ")}
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

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  scoreBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scoreInput: {
    width: 56,
    height: 42,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.field,
    textAlign: "center",
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
  },
});
