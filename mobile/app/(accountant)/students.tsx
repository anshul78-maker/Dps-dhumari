import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "@/auth/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { Avatar, Card, Chip, EmptyState, Field, Screen, SignOutButton, Text } from "@/components";
import { colors, fonts, spacing } from "@/theme";
import type { RosterStudent } from "@/api/types";

export default function Students() {
  const api = useApi();
  const { data, loading, error, refreshing, reload, refresh } = useAsync(
    () => api.accountant.students(),
    []
  );
  const [query, setQuery] = useState("");

  const students = data?.students ?? [];
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? students.filter((s) =>
          `${s.name} ${s.class_name} ${s.roll} ${s.admission_no ?? ""} ${s.guardian_name ?? ""}`
            .toLowerCase()
            .includes(q)
        )
      : students;
    const map = new Map<string, RosterStudent[]>();
    for (const s of filtered) {
      const list = map.get(s.class_name) ?? [];
      list.push(s);
      map.set(s.class_name, list);
    }
    return [...map.entries()].map(([className, list]) => ({ className, list }));
  }, [students, query]);

  return (
    <Screen
      eyebrow="Register"
      title="Students"
      subtitle={`${students.length} enrolled across the school.`}
      right={<SignOutButton />}
      loading={loading}
      error={error}
      onRetry={reload}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      {data && (
        <View style={{ gap: spacing.lg }}>
          <Field
            icon="search-outline"
            placeholder="Search name, class, roll or guardian"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />

          {groups.length === 0 ? (
            <EmptyState icon="people-outline" title="No students found" subtitle="Try a different search." />
          ) : (
            groups.map((g) => (
              <View key={g.className}>
                <View style={styles.groupHead}>
                  <Text variant="eyebrow" color={colors.amber}>
                    {g.className}
                  </Text>
                  <Chip label={`${g.list.length}`} tone="neutral" />
                </View>
                <Card padded={false} style={{ overflow: "hidden" }}>
                  {g.list.map((s, i) => (
                    <View key={s.id} style={[styles.row, i > 0 && styles.border]}>
                      <Avatar name={s.name} size={40} tone="light" />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14.5 }} color={colors.ink}>
                          {s.name}
                        </Text>
                        <Text variant="small">
                          Roll {s.roll}
                          {s.admission_no ? ` · Adm ${s.admission_no}` : ""}
                        </Text>
                        {(s.guardian_name || s.phone) && (
                          <View style={styles.contact}>
                            {!!s.guardian_name && (
                              <View style={styles.contactItem}>
                                <Ionicons name="person-outline" size={12} color={colors.muted} />
                                <Text variant="small">{s.guardian_name}</Text>
                              </View>
                            )}
                            {!!s.phone && (
                              <View style={styles.contactItem}>
                                <Ionicons name="call-outline" size={12} color={colors.muted} />
                                <Text variant="small">{s.phone}</Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </Card>
              </View>
            ))
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  groupHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, padding: spacing.md },
  border: { borderTopWidth: 1, borderTopColor: colors.line },
  contact: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: 4 },
  contactItem: { flexDirection: "row", alignItems: "center", gap: 4 },
});
