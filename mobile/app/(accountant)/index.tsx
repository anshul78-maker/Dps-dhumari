import { useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "@/api/client";
import { useApi } from "@/auth/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  Picker,
  Screen,
  SignOutButton,
  StatTile,
  Text,
} from "@/components";
import { colors, fonts, radius, spacing } from "@/theme";
import { money } from "@/utils/format";
import type { AccountantFee } from "@/api/types";

type Filter = "Due" | "Paid" | "All";

export default function AccountantOverview() {
  const api = useApi();
  const { data, loading, error, refreshing, reload, refresh } = useAsync(
    () => api.accountant.overview(),
    []
  );
  const [filter, setFilter] = useState<Filter>("Due");
  const [query, setQuery] = useState("");

  const fees = data?.fees ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return fees.filter((f) => {
      if (filter === "Due" && f.status !== "due") return false;
      if (filter === "Paid" && f.status !== "paid") return false;
      if (q && !`${f.student_name} ${f.class_name} ${f.title}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [fees, filter, query]);

  const rate =
    data && data.totalDue + data.totalPaid > 0
      ? Math.round((data.totalPaid / (data.totalPaid + data.totalDue)) * 100)
      : 0;

  return (
    <Screen
      eyebrow="Office portal"
      title="Fee collection"
      right={<SignOutButton />}
      loading={loading}
      error={error}
      onRetry={reload}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      {data && (
        <View style={{ gap: spacing.lg }}>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <StatTile tone="navy" icon="wallet" value={money(data.totalDue)} label="Outstanding" />
            <StatTile
              tone="gold"
              icon="checkmark-done"
              value={money(data.totalPaid)}
              label="Collected"
              sub={`${rate}% of total`}
            />
          </View>

          <Field
            icon="search-outline"
            placeholder="Search student, class or fee"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          <Picker
            options={["Due", "Paid", "All"]}
            value={filter}
            onChange={(v) => setFilter(v as Filter)}
          />

          {filtered.length === 0 ? (
            <EmptyState
              icon="wallet-outline"
              title={filter === "Due" ? "Nothing outstanding" : "No matching fees"}
              subtitle={
                filter === "Due"
                  ? "All fees in view are collected."
                  : "Try a different filter or search."
              }
            />
          ) : (
            <View style={{ gap: spacing.md }}>
              {filtered.map((f) => (
                <FeeCard key={f.id} f={f} onPaid={reload} />
              ))}
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}

function FeeCard({ f, onPaid }: { f: AccountantFee; onPaid: () => void }) {
  const api = useApi();
  const [busy, setBusy] = useState(false);
  const isPaid = f.status === "paid";

  const onMarkPaid = () => {
    Alert.alert("Mark as paid?", `${f.student_name} — ${f.title} (${money(f.amount)})`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Mark paid",
        onPress: async () => {
          try {
            setBusy(true);
            await api.accountant.markPaid(f.id);
            onPaid();
          } catch (e) {
            Alert.alert("Couldn't update", e instanceof ApiError ? e.message : "Please try again.");
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <Card>
      <View style={styles.row}>
        <Avatar name={f.student_name} size={40} tone="light" />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15 }} color={colors.ink}>
            {f.student_name}
          </Text>
          <Text variant="small">
            {f.class_name} · Roll {f.roll}
          </Text>
        </View>
        <Chip label={isPaid ? "Paid" : "Due"} tone={isPaid ? "green" : "red"} />
      </View>

      <View style={styles.feeRow}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14 }} color={colors.ink}>
            {f.title}
          </Text>
          {!!f.period && <Text variant="small">{f.period}</Text>}
        </View>
        <Text style={{ fontFamily: fonts.display, fontSize: 20 }} color={colors.ink}>
          {money(f.amount)}
        </Text>
      </View>

      {!isPaid && (
        <Button
          label="Mark as paid"
          icon="checkmark-circle-outline"
          size="md"
          loading={busy}
          onPress={onMarkPaid}
          style={{ marginTop: spacing.md }}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  feeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
