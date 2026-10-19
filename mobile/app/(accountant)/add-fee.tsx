import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "@/api/client";
import { useApi } from "@/auth/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import {
  Avatar,
  Button,
  Card,
  Field,
  Picker,
  Screen,
  SignOutButton,
  Text,
} from "@/components";
import { colors, fonts, radius, spacing } from "@/theme";
import { money } from "@/utils/format";
import type { TeacherStudent } from "@/api/types";

type Mode = "One student" | "Whole class";

export default function AddFee() {
  const api = useApi();
  const overview = useAsync(() => api.accountant.overview(), []);
  const students = overview.data?.students ?? [];
  const classNames = useMemo(
    () => [...new Set(students.map((s) => s.class_name))],
    [students]
  );

  const [mode, setMode] = useState<Mode>("One student");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("");
  const [selected, setSelected] = useState<TeacherStudent | null>(null);
  const [className, setClassName] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students.slice(0, 8);
    return students
      .filter((s) => `${s.name} ${s.class_name} ${s.roll}`.toLowerCase().includes(q))
      .slice(0, 12);
  }, [students, query]);

  const amountNum = Math.round(Number(amount) || 0);

  const reset = () => {
    setTitle("");
    setAmount("");
    setPeriod("");
    setSelected(null);
    setQuery("");
  };

  const onSubmit = async () => {
    if (!title.trim()) return Alert.alert("Title needed", "Enter what the fee is for.");
    if (!(amountNum > 0)) return Alert.alert("Amount needed", "Enter a positive amount.");

    try {
      setSaving(true);
      if (mode === "One student") {
        if (!selected) {
          setSaving(false);
          return Alert.alert("Pick a student", "Choose which student to bill.");
        }
        await api.accountant.addFee({
          studentId: selected.id,
          title: title.trim(),
          amount: amountNum,
          period: period.trim(),
        });
        Alert.alert("Fee added", `${money(amountNum)} billed to ${selected.name}.`);
      } else {
        if (!className) {
          setSaving(false);
          return Alert.alert("Pick a class", "Choose which class to bill.");
        }
        const res = await api.accountant.addFeeToClass({
          className,
          title: title.trim(),
          amount: amountNum,
          period: period.trim(),
        });
        Alert.alert("Fees added", `${money(amountNum)} billed to ${res.count} students in ${className}.`);
      }
      reset();
    } catch (e) {
      Alert.alert("Couldn't add", e instanceof ApiError ? e.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      eyebrow="Billing"
      title="Add a fee"
      subtitle="Charge one student or a whole class at once."
      right={<SignOutButton />}
      loading={overview.loading}
      error={overview.error}
      onRetry={overview.reload}
    >
      {overview.data && (
        <View style={{ gap: spacing.lg }}>
          <Picker options={["One student", "Whole class"]} value={mode} onChange={(v) => setMode(v as Mode)} />

          {mode === "One student" ? (
            selected ? (
              <Card padded={false} style={styles.selected}>
                <Avatar name={selected.name} size={42} tone="navy" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15 }} color={colors.ink}>
                    {selected.name}
                  </Text>
                  <Text variant="small">
                    {selected.class_name} · Roll {selected.roll}
                  </Text>
                </View>
                <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                  <Text variant="small" color={colors.blue} style={{ fontFamily: fonts.bodySemi }}>
                    Change
                  </Text>
                </Pressable>
              </Card>
            ) : (
              <View style={{ gap: spacing.sm }}>
                <Field
                  icon="search-outline"
                  placeholder="Search student by name, class or roll"
                  value={query}
                  onChangeText={setQuery}
                  autoCapitalize="none"
                />
                <Card padded={false} style={{ overflow: "hidden" }}>
                  {matches.map((s, i) => (
                    <Pressable
                      key={s.id}
                      onPress={() => setSelected(s)}
                      style={[styles.pickRow, i > 0 && styles.border]}
                    >
                      <Avatar name={s.name} size={34} tone="light" />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14 }} color={colors.ink}>
                          {s.name}
                        </Text>
                        <Text variant="small">
                          {s.class_name} · Roll {s.roll}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                    </Pressable>
                  ))}
                </Card>
              </View>
            )
          ) : (
            <Picker label="Class" options={classNames} value={className} onChange={setClassName} />
          )}

          <Card accentTop style={{ gap: spacing.md }}>
            <Field label="Fee title" icon="pricetag-outline" placeholder="e.g. Term 2 tuition" value={title} onChangeText={setTitle} />
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Field label="Amount (₹)" icon="cash-outline" placeholder="0" keyboardType="number-pad" value={amount} onChangeText={setAmount} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Period (optional)" icon="calendar-outline" placeholder="e.g. Term 2" value={period} onChangeText={setPeriod} />
              </View>
            </View>
            <Button
              label={mode === "Whole class" ? "Add fee to class" : "Add fee"}
              icon="add-circle-outline"
              loading={saving}
              onPress={onSubmit}
            />
          </Card>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  selected: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  pickRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  border: { borderTopWidth: 1, borderTopColor: colors.line },
});
