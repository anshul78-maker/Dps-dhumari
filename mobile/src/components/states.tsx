import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "@/theme";
import { Text } from "./Text";
import { Button } from "./Button";

export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.navy} />
      {label && (
        <Text variant="bodyMuted" style={{ marginTop: spacing.md }}>
          {label}
        </Text>
      )}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <View style={[styles.badge, { backgroundColor: "#fdecef" }]}>
        <Ionicons name="cloud-offline-outline" size={26} color={colors.red} />
      </View>
      <Text variant="h3" center style={{ marginTop: spacing.md }}>
        Couldn't load this
      </Text>
      <Text variant="bodyMuted" center style={{ marginTop: 4, maxWidth: 300 }}>
        {message}
      </Text>
      {onRetry && (
        <Button
          label="Try again"
          icon="refresh"
          variant="secondary"
          full={false}
          onPress={onRetry}
          style={{ marginTop: spacing.lg }}
        />
      )}
    </View>
  );
}

export function EmptyState({
  icon = "file-tray-outline",
  title,
  subtitle,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.center}>
      <View style={[styles.badge, { backgroundColor: colors.surfaceAlt }]}>
        <Ionicons name={icon} size={26} color={colors.blue} />
      </View>
      <Text variant="h3" center style={{ marginTop: spacing.md }}>
        {title}
      </Text>
      {subtitle && (
        <Text variant="bodyMuted" center style={{ marginTop: 4, maxWidth: 300 }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    minHeight: 220,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
