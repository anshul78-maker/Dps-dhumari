import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "@/api/client";
import { useApi } from "@/auth/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  Picker,
  Screen,
  SignOutButton,
  Text,
} from "@/components";
import { colors, spacing } from "@/theme";
import { formatDate } from "@/utils/format";
import type { NoticeRow } from "@/api/types";

const SCHOOL = "Whole school";

export default function AccountantNotices() {
  const api = useApi();
  const overview = useAsync(() => api.accountant.overview(), []);
  const notices = useAsync(() => api.notices(), []);
  const [showForm, setShowForm] = useState(false);

  const classNames = useMemo(
    () => [...new Set((overview.data?.students ?? []).map((s) => s.class_name))],
    [overview.data]
  );
  const list = notices.data?.notices ?? [];

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audienceLabel, setAudienceLabel] = useState(SCHOOL);
  const [posting, setPosting] = useState(false);

  const onPost = async () => {
    if (!title.trim() || !body.trim())
      return Alert.alert("Title and message needed", "Fill in both fields.");
    try {
      setPosting(true);
      const audience = audienceLabel === SCHOOL ? "all" : audienceLabel;
      await api.postNotice({ title: title.trim(), body: body.trim(), audience });
      setTitle("");
      setBody("");
      setAudienceLabel(SCHOOL);
      setShowForm(false);
      notices.reload();
    } catch (e) {
      Alert.alert("Couldn't post", e instanceof ApiError ? e.message : "Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const onDelete = (n: NoticeRow) => {
    Alert.alert("Delete notice?", `“${n.title}” will be removed for everyone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteNotice(n.id);
            notices.reload();
          } catch (e) {
            Alert.alert("Couldn't delete", e instanceof ApiError ? e.message : "Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <Screen
      eyebrow="Announcements"
      title="Notices"
      subtitle="Post to the whole school or a class, as the office."
      right={<SignOutButton />}
      loading={notices.loading}
      error={notices.error}
      onRetry={notices.reload}
      refreshing={notices.refreshing}
      onRefresh={notices.refresh}
    >
      {notices.data && (
        <View style={{ gap: spacing.lg }}>
          <Button
            label={showForm ? "Close" : "Post a notice"}
            icon={showForm ? "close" : "add"}
            variant={showForm ? "secondary" : "primary"}
            onPress={() => setShowForm((s) => !s)}
          />

          {showForm && (
            <Card accentTop style={{ gap: spacing.md }}>
              <Text variant="h3">New notice</Text>
              <Field label="Title" icon="pricetag-outline" placeholder="Notice title" value={title} onChangeText={setTitle} />
              <Field
                label="Message"
                icon="chatbox-ellipses-outline"
                placeholder="What do you want to announce?"
                value={body}
                onChangeText={setBody}
                multiline
              />
              <Picker
                label="Audience"
                options={[SCHOOL, ...classNames]}
                value={audienceLabel}
                onChange={setAudienceLabel}
              />
              <Button label="Post notice" icon="send" loading={posting} onPress={onPost} />
            </Card>
          )}

          {list.length === 0 ? (
            <EmptyState icon="megaphone-outline" title="No notices" subtitle="Posted notices will appear here." />
          ) : (
            <View style={{ gap: spacing.md }}>
              {list.map((n) => {
                const schoolWide = n.audience === "all";
                return (
                  <Card key={n.id} accentTop>
                    <View style={styles.top}>
                      <Chip
                        label={schoolWide ? "School-wide" : n.audience}
                        tone={schoolWide ? "gold" : "blue"}
                      />
                      <Pressable onPress={() => onDelete(n)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={18} color={colors.red} />
                      </Pressable>
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
              })}
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  meta: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
