import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "@/auth/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { Card, Chip, EmptyState, Screen, SectionHeading, StatTile, Text } from "@/components";
import { colors, fonts, radius, spacing } from "@/theme";
import { money } from "@/utils/format";
import type { FeeRow } from "@/api/types";

export default function Fees() {
  const api = useApi();
  const { data, loading, error, refreshing, reload, refresh } = useAsync(
    () => api.student.fees(),
    []
  );

  const fees = data?.fees ?? [];
  const due = fees.filter((f) => f.status === "due");
  const paid = fees.filter((f) => f.status === "paid");
  const paidTotal = paid.reduce((s, f) => s + f.amount, 0);

  return (
    <Screen
      eyebrow="Finance"
      title="Fees"
      subtitle="What's due and what's already paid."
      loading={loading}
      error={error}
      onRetry={reload}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      {data && (
        <View style={{ gap: spacing.lg }}>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <StatTile
              tone={data.totalDue > 0 ? "navy" : "plain"}
              icon="wallet"
              value={money(data.totalDue)}
              label="Outstanding"
            />
            <StatTile tone="plain" icon="checkmark-done" value={money(paidTotal)} label="Paid" />
          </View>

          {fees.length === 0 ? (
            <EmptyState
              icon="card-outline"
              title="No fees recorded"
              subtitle="Fee items set by the office will appear here."
            />
          ) : (
            <>
              {due.length > 0 && (
                <View>
                  <SectionHeading eyebrow="Pending" title="Due now" />
                  <View style={{ gap: spacing.md }}>
                    {due.map((f) => (
                      <FeeItem key={f.id} f={f} />
                    ))}
                  </View>
                </View>
              )}

              {paid.length > 0 && (
                <View>
                  <SectionHeading eyebrow="Cleared" title="Paid" />
                  <View style={{ gap: spacing.md }}>
                    {paid.map((f) => (
                      <FeeItem key={f.id} f={f} />
                    ))}
                  </View>
                </View>
              )}

              {due.length > 0 && (
                <View style={styles.note}>
                  <Ionicons name="information-circle-outline" size={18} color={colors.blue} />
                  <Text variant="small" color={colors.ink} style={{ flex: 1 }}>
                    Pay dues at the school office. The accountant updates your balance here once
                    received.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      )}
    </Screen>
  );
}

function FeeItem({ f }: { f: FeeRow }) {
  const isPaid = f.status === "paid";
  return (
    <Card padded={false} style={styles.item}>
      <View
        style={[
          styles.dot,
          { backgroundColor: isPaid ? "#e4f3e3" : colors.sky },
        ]}
      >
        <Ionicons
          name={isPaid ? "checkmark" : "time-outline"}
          size={18}
          color={isPaid ? colors.green : "#7a5b00"}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15 }} color={colors.ink}>
          {f.title}
        </Text>
        {!!f.period && <Text variant="small">{f.period}</Text>}
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15.5 }} color={colors.ink}>
          {money(f.amount)}
        </Text>
        <Chip
          label={isPaid ? "Paid" : "Due"}
          tone={isPaid ? "green" : "red"}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  dot: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  note: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: "#e9eefb",
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
