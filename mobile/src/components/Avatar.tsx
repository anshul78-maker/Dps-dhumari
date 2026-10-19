import { StyleSheet, View } from "react-native";
import { colors, fonts } from "@/theme";
import { Text } from "./Text";

interface Props {
  name: string;
  size?: number;
  tone?: "navy" | "gold" | "light";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, size = 44, tone = "navy" }: Props) {
  const palette =
    tone === "gold"
      ? { bg: colors.gold, fg: colors.ink }
      : tone === "light"
        ? { bg: colors.surfaceAlt, fg: colors.blue }
        : { bg: colors.navy, fg: colors.white };
  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 3, backgroundColor: palette.bg },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.36 }]} color={palette.fg}>
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center" },
  text: { fontFamily: fonts.bodyBold },
});
