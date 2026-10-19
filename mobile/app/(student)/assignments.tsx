import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "@/api/client";
import { useApi, useAuth } from "@/auth/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { Button, Card, Chip, EmptyState, Screen, Text } from "@/components";
import { colors, fonts, radius, spacing } from "@/theme";
import { dueLabel } from "@/utils/format";
import { openAuthedPdf, pickPdf } from "@/utils/files";
import type { AssignmentRow } from "@/api/types";

export default function Assignments() {
  const api = useApi();
  const { data, loading, error, refreshing, reload, refresh } = useAsync(
    () => api.student.assignments(),
    []
  );

  const list = data?.assignments ?? [];
  const pending = list.filter((a) => !a.done).length;

  return (
    <Screen
      eyebrow="Classwork"
      title="Assignments"
      subtitle={pending ? `${pending} still to do` : "All caught up — nice work."}
      loading={loading}
      error={error}
      onRetry={reload}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      {data && list.length === 0 ? (
        <EmptyState
          icon="reader-outline"
          title="No assignments"
          subtitle="Work set for your class will show up here."
        />
      ) : (
        <View style={{ gap: spacing.lg }}>
          {list.map((a) => (
            <AssignmentCard key={a.id} a={a} onChanged={reload} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function AssignmentCard({ a, onChanged }: { a: AssignmentRow; onChanged: () => void }) {
  const api = useApi();
  const { session } = useAuth();
  const [busy, setBusy] = useState<null | "upload" | "toggle" | "view">(null);

  const submitted = !!a.submission_id && !!a.original_name;
  const done = !!a.done;
  const due = dueLabel(a.due_date);

  const onUpload = async () => {
    try {
      const picked = await pickPdf();
      if (!picked) return;
      setBusy("upload");
      await api.student.submitAssignment(a.id, picked.dataUrl, picked.name);
      onChanged();
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const onToggle = async () => {
    try {
      setBusy("toggle");
      await api.student.toggleAssignment(a.id, !done);
      onChanged();
    } catch (e) {
      Alert.alert("Couldn't update", e instanceof ApiError ? e.message : "Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const onView = async () => {
    try {
      setBusy("view");
      await openAuthedPdf(
        `/api/files/submission/${a.submission_id}`,
        session?.token ?? null,
        a.original_name ?? "submission.pdf"
      );
    } catch (e) {
      Alert.alert("Couldn't open", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <View style={styles.topRow}>
        <Chip label={a.subject} tone="blue" />
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
      {!!a.details && (
        <Text variant="bodyMuted" style={{ marginTop: 4 }}>
          {a.details}
        </Text>
      )}

      {/* Status strip */}
      <View
        style={[
          styles.status,
          { backgroundColor: submitted ? "#e4f3e3" : done ? colors.sky : colors.surfaceAlt },
        ]}
      >
        <Ionicons
          name={submitted ? "checkmark-done-circle" : done ? "checkmark-circle" : "ellipse-outline"}
          size={17}
          color={submitted ? colors.green : done ? "#7a5b00" : colors.muted}
        />
        <Text
          variant="small"
          color={submitted ? colors.green : done ? "#7a5b00" : colors.muted}
          style={{ flex: 1, fontFamily: fonts.bodySemi }}
        >
          {submitted
            ? `Submitted · ${a.original_name}`
            : done
              ? "Marked as done"
              : "Not submitted yet"}
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md }}>
        <Button
          label={submitted ? "Replace PDF" : "Upload PDF"}
          icon="cloud-upload-outline"
          size="md"
          variant={submitted ? "secondary" : "primary"}
          loading={busy === "upload"}
          onPress={onUpload}
          style={{ flex: 1 }}
        />
        {submitted ? (
          <Button
            label="View"
            icon="open-outline"
            size="md"
            variant="secondary"
            loading={busy === "view"}
            onPress={onView}
            style={{ flex: 1 }}
          />
        ) : (
          <Button
            label={done ? "Undo" : "Mark done"}
            icon={done ? "arrow-undo-outline" : "checkmark"}
            size="md"
            variant="secondary"
            loading={busy === "toggle"}
            onPress={onToggle}
            style={{ flex: 1 }}
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radius.md,
    padding: 10,
    marginTop: spacing.md,
  },
});
