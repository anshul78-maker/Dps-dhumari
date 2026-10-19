import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "@/api/client";
import { useApi } from "@/auth/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Field,
  HeaderButton,
  Screen,
  Text,
} from "@/components";
import { colors, fonts, radius, spacing } from "@/theme";
import { pickPdf } from "@/utils/files";
import type { TeacherStudent } from "@/api/types";

export default function ReportCards() {
  const api = useApi();
  const { data, loading, error, refreshing, reload, refresh } = useAsync(
    () => api.teacher.students(),
    []
  );
  const [selected, setSelected] = useState<TeacherStudent | null>(null);
  const [title, setTitle] = useState("Report card");
  const [sending, setSending] = useState(false);

  const students = data?.students ?? [];
  const groups = useMemo(() => groupByClass(students), [students]);

  const onSend = async () => {
    if (!selected) return;
    if (!title.trim()) {
      Alert.alert("Title needed", "Give the report card a title.");
      return;
    }
    try {
      const picked = await pickPdf();
      if (!picked) return;
      setSending(true);
      await api.teacher.reportCard({
        studentId: selected.id,
        file: picked.dataUrl,
        title: title.trim(),
        name: picked.name,
      });
      Alert.alert("Report card sent", `${selected.name} can now see “${title.trim()}”.`);
      setSelected(null);
      setTitle("Report card");
    } catch (e) {
      Alert.alert("Couldn't send", e instanceof ApiError ? e.message : (e instanceof Error ? e.message : "Please try again."));
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen
      eyebrow="Documents"
      title="Report cards"
      subtitle="Send a report-card PDF to a student in your class."
      right={<HeaderButton icon="chevron-back" label="Back" onPress={() => router.back()} />}
      loading={loading}
      error={error}
      onRetry={reload}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      {data && (
        <View style={{ gap: spacing.lg }}>
          {selected && (
            <Card accentTop style={{ gap: spacing.md }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                <Avatar name={selected.name} size={44} tone="navy" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15 }} color={colors.ink}>
                    {selected.name}
                  </Text>
                  <Text variant="small">
                    {selected.class_name} · Roll {selected.roll}
                  </Text>
                </View>
                <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                  <Ionicons name="close-circle" size={22} color={colors.muted} />
                </Pressable>
              </View>
              <Field label="Title" icon="pricetag-outline" value={title} onChangeText={setTitle} />
              <Button
                label="Choose PDF & send"
                icon="cloud-upload-outline"
                loading={sending}
                onPress={onSend}
              />
            </Card>
          )}

          {students.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="No students"
              subtitle="Students in the classes you teach will appear here."
            />
          ) : (
            groups.map((g) => (
              <View key={g.className}>
                <Text variant="eyebrow" color={colors.amber} style={{ marginBottom: 8 }}>
                  {g.className}
                </Text>
                <Card padded={false} style={{ overflow: "hidden" }}>
                  {g.students.map((s, i) => {
                    const active = selected?.id === s.id;
                    return (
                      <Pressable
                        key={s.id}
                        onPress={() => setSelected(s)}
                        style={[styles.row, i > 0 && styles.border, active && styles.active]}
                      >
                        <Avatar name={s.name} size={36} tone="light" />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14.5 }} color={colors.ink}>
                            {s.name}
                          </Text>
                          <Text variant="small">Roll {s.roll}</Text>
                        </View>
                        <Ionicons
                          name={active ? "checkmark-circle" : "chevron-forward"}
                          size={18}
                          color={active ? colors.green : colors.muted}
                        />
                      </Pressable>
                    );
                  })}
                </Card>
              </View>
            ))
          )}
        </View>
      )}
    </Screen>
  );
}

function groupByClass(students: TeacherStudent[]) {
  const map = new Map<string, TeacherStudent[]>();
  for (const s of students) {
    const list = map.get(s.class_name) ?? [];
    list.push(s);
    map.set(s.class_name, list);
  }
  return [...map.entries()].map(([className, list]) => ({ className, students: list }));
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  border: { borderTopWidth: 1, borderTopColor: colors.line },
  active: { backgroundColor: "#f3f7ff" },
});
