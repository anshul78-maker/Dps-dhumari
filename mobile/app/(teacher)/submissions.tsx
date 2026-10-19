import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApi, useAuth } from "@/auth/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { Avatar, Card, Chip, EmptyState, HeaderButton, Screen, Text } from "@/components";
import { colors, fonts, spacing } from "@/theme";
import { formatDate } from "@/utils/format";
import { openAuthedPdf } from "@/utils/files";
import type { SubmissionRow } from "@/api/types";

export default function Submissions() {
  const api = useApi();
  const params = useLocalSearchParams<{ id?: string; title?: string }>();
  const id = Number(params.id);

  const { data, loading, error, refreshing, reload, refresh } = useAsync(
    () => api.teacher.submissions(id),
    [id]
  );

  const rows = data?.rows ?? [];
  const submitted = rows.filter((r) => r.has_file).length;

  return (
    <Screen
      eyebrow="Submissions"
      title={data?.assignment?.title ?? params.title ?? "Submissions"}
      subtitle={
        data
          ? `${submitted}/${rows.length} submitted · ${data.assignment.class_name} · ${data.assignment.subject}`
          : undefined
      }
      right={<HeaderButton icon="chevron-back" label="Back" onPress={() => router.back()} />}
      loading={loading}
      error={error}
      onRetry={reload}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      {data && (
        rows.length === 0 ? (
          <EmptyState icon="people-outline" title="No students" subtitle="This class has no students." />
        ) : (
          <Card padded={false} style={{ overflow: "hidden" }}>
            {rows.map((r, i) => (
              <SubmissionItem key={r.student_id} r={r} first={i === 0} />
            ))}
          </Card>
        )
      )}
    </Screen>
  );
}

function SubmissionItem({ r, first }: { r: SubmissionRow; first: boolean }) {
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);
  const has = !!r.has_file;

  const onOpen = async () => {
    if (!has || !r.submission_id) return;
    try {
      setBusy(true);
      await openAuthedPdf(
        `/api/files/submission/${r.submission_id}`,
        session?.token ?? null,
        r.original_name ?? "submission.pdf"
      );
    } catch (e) {
      Alert.alert("Couldn't open", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.row, !first && styles.border]}>
      <Avatar name={r.name} size={38} tone="light" />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14.5 }} color={colors.ink}>
          {r.name}
        </Text>
        <Text variant="small">
          Roll {r.roll}
          {has && r.uploaded_at ? ` · ${formatDate(r.uploaded_at)}` : ""}
        </Text>
      </View>
      {has ? (
        <Pressable onPress={onOpen} disabled={busy} style={styles.view}>
          <Ionicons name={busy ? "hourglass-outline" : "open-outline"} size={15} color={colors.blue} />
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5 }} color={colors.blue}>
            View
          </Text>
        </Pressable>
      ) : (
        <Chip label="Not submitted" tone="neutral" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  border: { borderTopWidth: 1, borderTopColor: colors.line },
  view: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#e9eefb",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
});
