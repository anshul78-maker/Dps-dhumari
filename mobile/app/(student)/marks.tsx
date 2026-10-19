import { View, StyleSheet } from "react-native";
import { useApi } from "@/auth/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { Card, Chip, EmptyState, Screen, Text } from "@/components";
import { colors, fonts, spacing } from "@/theme";
import type { MarkRow } from "@/api/types";

export default function Marks() {
  const api = useApi();
  const { data, loading, error, refreshing, reload, refresh } = useAsync(
    () => api.student.marks(),
    []
  );

  const groups = groupBySubject(data?.marks ?? []);

  return (
    <Screen
      eyebrow="Academics"
      title="My marks"
      subtitle="Every exam score, subject by subject."
      loading={loading}
      error={error}
      onRetry={reload}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      {data && groups.length === 0 ? (
        <EmptyState
          icon="stats-chart-outline"
          title="No marks yet"
          subtitle="Your exam scores will appear here as teachers enter them."
        />
      ) : (
        <View style={{ gap: spacing.lg }}>
          {groups.map((g) => (
            <Card key={g.subject}>
              <View style={styles.header}>
                <Text variant="h3">{g.subject}</Text>
                <Chip
                  label={`${g.average}% avg`}
                  tone={g.average >= 40 ? "blue" : "red"}
                />
              </View>
              <View style={{ gap: spacing.md, marginTop: spacing.md }}>
                {g.exams.map((m, i) => {
                  const pct = m.max_score ? Math.round((m.score / m.max_score) * 100) : 0;
                  return (
                    <View key={`${m.exam}-${i}`}>
                      <View style={styles.header}>
                        <Text variant="bodyMuted">{m.exam}</Text>
                        <Text style={{ fontFamily: fonts.bodySemi }} color={colors.ink}>
                          {m.score}
                          <Text variant="small" color={colors.muted}>
                            {" "}
                            / {m.max_score}
                          </Text>
                        </Text>
                      </View>
                      <View style={styles.track}>
                        <View
                          style={[
                            styles.fill,
                            {
                              width: `${Math.min(100, pct)}%`,
                              backgroundColor: pct >= 40 ? colors.navy : colors.red,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

interface SubjectGroup {
  subject: string;
  exams: MarkRow[];
  average: number;
}

function groupBySubject(rows: MarkRow[]): SubjectGroup[] {
  const map = new Map<string, MarkRow[]>();
  for (const r of rows) {
    const list = map.get(r.subject) ?? [];
    list.push(r);
    map.set(r.subject, list);
  }
  return [...map.entries()].map(([subject, exams]) => {
    const pcts = exams.map((e) => (e.max_score ? (e.score / e.max_score) * 100 : 0));
    const average = pcts.length
      ? Math.round(pcts.reduce((s, x) => s + x, 0) / pcts.length)
      : 0;
    return { subject, exams, average };
  });
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  track: {
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.line,
    marginTop: 7,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 999 },
});
