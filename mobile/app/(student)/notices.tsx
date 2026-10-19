import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "@/auth/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { Card, Chip, EmptyState, Screen, Text } from "@/components";
import { colors, spacing } from "@/theme";
import { formatDate } from "@/utils/format";
import type { NoticeRow } from "@/api/types";

export default function Notices() {
  const api = useApi();
  const { data, loading, error, refreshing, reload, refresh } = useAsync(
    () => api.notices(),
    []
  );
  const notices = data?.notices ?? [];

  return (
    <Screen
      eyebrow="Announcements"
      title="Notice board"
      subtitle="News from the school and your class."
      loading={loading}
      error={error}
      onRetry={reload}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      {data && notices.length === 0 ? (
        <EmptyState
          icon="megaphone-outline"
          title="No notices"
          subtitle="School and class announcements will appear here."
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {notices.map((n) => (
            <NoticeCard key={n.id} n={n} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function NoticeCard({ n }: { n: NoticeRow }) {
  const schoolWide = n.audience === "all";
  return (
    <Card accentTop>
      <View style={styles.top}>
        <View style={styles.icon}>
          <Ionicons name="megaphone" size={16} color={colors.blue} />
        </View>
        <Chip
          label={schoolWide ? "School-wide" : n.audience}
          tone={schoolWide ? "gold" : "blue"}
        />
      </View>
      <Text variant="h3" style={{ marginTop: spacing.md }}>
        {n.title}
      </Text>
      <Text variant="body" style={{ marginTop: 6 }}>
        {n.body}
      </Text>
      <View style={styles.meta}>
        <Text variant="small">
          {[n.author_name, formatDate(n.created_at)].filter(Boolean).join(" · ")}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#e9eefb",
    alignItems: "center",
    justifyContent: "center",
  },
  meta: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
