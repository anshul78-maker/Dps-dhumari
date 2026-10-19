import type { ReactNode } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, gradients, radius, spacing } from "@/theme";
import { Text } from "./Text";
import { Eyebrow } from "./Eyebrow";
import { Loading, ErrorState } from "./states";

interface Props {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  right?: ReactNode;
  children?: ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}

/** Signature navy gradient header + a scrollable, refreshable body. */
export function Screen({
  title,
  eyebrow,
  subtitle,
  right,
  children,
  loading,
  error,
  onRetry,
  refreshing,
  onRefresh,
  scroll = true,
  contentStyle,
}: Props) {
  const insets = useSafeAreaInsets();

  const header = (
    <LinearGradient
      colors={gradients.navy}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + spacing.md }]}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1, paddingRight: spacing.md }}>
          {eyebrow && (
            <View style={{ marginBottom: 8 }}>
              <Eyebrow pill={false} color={colors.gold}>
                {eyebrow}
              </Eyebrow>
            </View>
          )}
          <Text variant="display" color={colors.white} style={styles.title}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="bodyMuted" color={colors.onNavyMuted} style={{ marginTop: 6 }}>
              {subtitle}
            </Text>
          )}
        </View>
        {right}
      </View>
    </LinearGradient>
  );

  const body = loading ? (
    <Loading />
  ) : error ? (
    <ErrorState message={error} onRetry={onRetry} />
  ) : (
    children
  );

  return (
    <View style={styles.flex}>
      {header}
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            { padding: spacing.lg, paddingBottom: insets.bottom + 100 },
            (loading || error) && styles.centerContent,
            contentStyle,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={colors.navy}
                colors={[colors.navy]}
              />
            ) : undefined
          }
        >
          {body}
        </ScrollView>
      ) : (
        <View style={[styles.flex, contentStyle]}>{body}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.cream },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  title: { fontSize: 28, lineHeight: 32 },
  centerContent: { flexGrow: 1, justifyContent: "center" },
});
