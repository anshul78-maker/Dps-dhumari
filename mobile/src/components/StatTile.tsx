import { StyleSheet, View, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing } from "@/theme";
import { Text } from "./Text";

interface Props {
  value: string | number;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: "navy" | "gold" | "plain";
  sub?: string;
  style?: ViewStyle;
}

/** Compact KPI tile echoing the site's gold stat band (big number + label). */
export function StatTile({ value, label, icon, tone = "plain", sub, style }: Props) {
  const navy = tone === "navy";
  const gold = tone === "gold";
  const bg = navy ? colors.navy : gold ? colors.gold : colors.surface;
  const fg = navy ? colors.white : colors.ink;
  const muted = navy ? colors.onNavyMuted : colors.muted;
  const iconBg = navy ? colors.onNavyFaint : gold ? "rgba(23,16,101,0.1)" : colors.surfaceAlt;
  const iconFg = navy ? colors.gold : colors.blue;

  return (
    <View
      style={[
        styles.tile,
        { backgroundColor: bg, borderColor: tone === "plain" ? colors.line : "transparent" },
        style,
      ]}
    >
      {icon && (
        <View style={[styles.icon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={16} color={iconFg} />
        </View>
      )}
      <Text style={[styles.value, { color: fg }]}>{value}</Text>
      <Text style={styles.label} color={muted}>
        {label}
      </Text>
      {sub && (
        <Text variant="small" color={muted} style={{ marginTop: 1 }}>
          {sub}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    minHeight: 110,
    justifyContent: "flex-end",
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "auto",
  },
  value: { fontFamily: fonts.display, fontSize: 28, marginTop: spacing.sm },
  label: { fontFamily: fonts.bodyMedium, fontSize: 12.5, marginTop: 1 },
});
