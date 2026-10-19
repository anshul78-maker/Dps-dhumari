import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, type } from "@/theme";
import { Text } from "./Text";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  icon,
  iconRight,
  loading,
  disabled,
  full = true,
  style,
}: Props) {
  const v = VARIANTS[variant];
  const isDisabled = disabled || loading;
  const height = size === "lg" ? 54 : 46;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { height, backgroundColor: v.bg, borderColor: v.border },
        full && { alignSelf: "stretch" },
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={18} color={v.fg} style={styles.iconL} />}
          <Text style={[type.button, { color: v.fg }]}>{label}</Text>
          {iconRight && (
            <Ionicons name={iconRight} size={18} color={v.fg} style={styles.iconR} />
          )}
        </View>
      )}
    </Pressable>
  );
}

const VARIANTS: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.gold, fg: colors.ink, border: colors.gold },
  secondary: { bg: colors.surfaceAlt, fg: colors.ink, border: colors.surfaceAlt },
  ghost: { bg: "transparent", fg: colors.blue, border: "transparent" },
  danger: { bg: "#fdecef", fg: colors.red, border: "#f7cdd4" },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  iconL: { marginRight: 8 },
  iconR: { marginLeft: 8 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.5 },
});
