import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApi, useAuth } from "@/auth/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { Card, Chip, EmptyState, HeaderButton, Screen, Text } from "@/components";
import { colors, radius, spacing } from "@/theme";
import { formatDate } from "@/utils/format";
import { openAuthedPdf } from "@/utils/files";
import type { DocumentRow } from "@/api/types";

const META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; tone: "blue" | "gold" }> = {
  report_card: { label: "Report Card", icon: "ribbon-outline", tone: "blue" },
  tc: { label: "Transfer Certificate", icon: "ribbon-outline", tone: "gold" },
};

export default function Documents() {
  const api = useApi();
  const { data, loading, error, refreshing, reload, refresh } = useAsync(
    () => api.student.documents(),
    []
  );
  const docs = data?.documents ?? [];

  return (
    <Screen
      eyebrow="My records"
      title="Documents"
      subtitle="Report cards and certificates from the school."
      right={<HeaderButton icon="chevron-back" label="Back" onPress={() => router.back()} />}
      loading={loading}
      error={error}
      onRetry={reload}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      {data && docs.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title="No documents yet"
          subtitle="Report cards and your transfer certificate will appear here once issued."
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {docs.map((d) => (
            <DocRow key={d.id} d={d} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function DocRow({ d }: { d: DocumentRow }) {
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);
  const meta = META[d.type] ?? { label: d.type, icon: "document-outline" as const, tone: "blue" as const };

  const onOpen = async () => {
    try {
      setBusy(true);
      await openAuthedPdf(
        `/api/files/document/${d.id}`,
        session?.token ?? null,
        d.original_name ?? `${d.title}.pdf`
      );
    } catch (e) {
      Alert.alert("Couldn't open", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable onPress={onOpen} disabled={busy}>
      {({ pressed }) => (
        <Card padded={false} style={[styles.row, pressed && { opacity: 0.85 }]}>
          <View style={[styles.icon, { backgroundColor: meta.tone === "gold" ? colors.sky : "#e9eefb" }]}>
            <Ionicons name={meta.icon} size={20} color={meta.tone === "gold" ? "#7a5b00" : colors.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Chip label={meta.label} tone={meta.tone} />
            <Text variant="h3" style={{ marginTop: 6 }} numberOfLines={1}>
              {d.title}
            </Text>
            <Text variant="small" style={{ marginTop: 2 }}>
              {[d.uploaded_by_name && `by ${d.uploaded_by_name}`, formatDate(d.created_at)]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </View>
          <Ionicons
            name={busy ? "hourglass-outline" : "download-outline"}
            size={20}
            color={colors.muted}
          />
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
