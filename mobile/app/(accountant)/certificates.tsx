import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "@/api/client";
import { useApi, useAuth } from "@/auth/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  Screen,
  SectionHeading,
  SignOutButton,
  Text,
} from "@/components";
import { colors, fonts, radius, spacing } from "@/theme";
import { formatDate } from "@/utils/format";
import { openAuthedPdf, pickPdf } from "@/utils/files";
import type { TcDocument, TeacherStudent } from "@/api/types";

export default function Certificates() {
  const api = useApi();
  const overview = useAsync(() => api.accountant.overview(), []);
  const tcs = useAsync(() => api.accountant.tcs(), []);

  const students = overview.data?.students ?? [];
  const [selected, setSelected] = useState<TeacherStudent | null>(null);
  const [title, setTitle] = useState("Transfer Certificate");
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students.slice(0, 6);
    return students
      .filter((s) => `${s.name} ${s.class_name} ${s.roll}`.toLowerCase().includes(q))
      .slice(0, 10);
  }, [students, query]);

  const issued = tcs.data?.documents ?? [];

  const onIssue = async () => {
    if (!selected) return Alert.alert("Pick a student", "Choose who the certificate is for.");
    if (!title.trim()) return Alert.alert("Title needed", "Give the certificate a title.");
    try {
      const picked = await pickPdf();
      if (!picked) return;
      setSending(true);
      await api.accountant.issueTc({
        studentId: selected.id,
        file: picked.dataUrl,
        title: title.trim(),
        name: picked.name,
      });
      Alert.alert("Certificate issued", `${selected.name} can now view it.`);
      setSelected(null);
      setTitle("Transfer Certificate");
      setQuery("");
      tcs.reload();
    } catch (e) {
      Alert.alert(
        "Couldn't issue",
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen
      eyebrow="Documents"
      title="Transfer Certificates"
      right={<SignOutButton />}
      loading={tcs.loading}
      error={tcs.error}
      onRetry={tcs.reload}
      refreshing={tcs.refreshing}
      onRefresh={tcs.refresh}
    >
      {tcs.data && (
        <View style={{ gap: spacing.lg }}>
          {/* Issue */}
          <Card accentTop style={{ gap: spacing.md }}>
            <Text variant="h3">Issue a certificate</Text>
            {selected ? (
              <View style={styles.selected}>
                <Avatar name={selected.name} size={40} tone="navy" />
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
            ) : (
              <>
                <Field
                  icon="search-outline"
                  placeholder="Search student"
                  value={query}
                  onChangeText={setQuery}
                  autoCapitalize="none"
                />
                {(query.trim() || matches.length > 0) && (
                  <Card padded={false} style={{ overflow: "hidden" }}>
                    {matches.map((s, i) => (
                      <Pressable
                        key={s.id}
                        onPress={() => setSelected(s)}
                        style={[styles.pickRow, i > 0 && styles.border]}
                      >
                        <Avatar name={s.name} size={32} tone="light" />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14 }} color={colors.ink}>
                            {s.name}
                          </Text>
                          <Text variant="small">
                            {s.class_name} · Roll {s.roll}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </Card>
                )}
              </>
            )}
            <Field label="Title" icon="pricetag-outline" value={title} onChangeText={setTitle} />
            <Button label="Attach PDF & issue" icon="cloud-upload-outline" loading={sending} onPress={onIssue} />
          </Card>

          {/* Issued list */}
          <View>
            <SectionHeading eyebrow="History" title="Issued certificates" />
            {issued.length === 0 ? (
              <EmptyState
                icon="ribbon-outline"
                title="None issued yet"
                subtitle="Certificates you issue will be listed here."
              />
            ) : (
              <View style={{ gap: spacing.md }}>
                {issued.map((d) => (
                  <TcRow key={d.id} d={d} />
                ))}
              </View>
            )}
          </View>
        </View>
      )}
    </Screen>
  );
}

function TcRow({ d }: { d: TcDocument }) {
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);
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
        <Card padded={false} style={[styles.tcRow, pressed && { opacity: 0.85 }]}>
          <View style={styles.tcIcon}>
            <Ionicons name="ribbon-outline" size={20} color="#7a5b00" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14.5 }} color={colors.ink} numberOfLines={1}>
              {d.student_name}
            </Text>
            <Text variant="small">
              {[d.class_name && `${d.class_name}`, d.title, formatDate(d.created_at)]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </View>
          <Ionicons name={busy ? "hourglass-outline" : "download-outline"} size={20} color={colors.muted} />
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  selected: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  pickRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  border: { borderTopWidth: 1, borderTopColor: colors.line },
  tcRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg },
  tcIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.sky,
    alignItems: "center",
    justifyContent: "center",
  },
});
