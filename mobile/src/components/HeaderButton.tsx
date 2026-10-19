import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  label?: string;
}

/** Round translucent icon button for the navy header's top-right slot. */
export function HeaderButton({ icon, onPress, label }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={icon} size={20} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.onNavyFaint,
    alignItems: "center",
    justifyContent: "center",
  },
});
