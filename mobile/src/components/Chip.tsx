import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius } from "@/theme";
import { Text } from "./Text";

type Tone = "gold" | "green" | "red" | "blue" | "neutral";

const TONES: Record<Tone, { bg: string; fg: string }> = {
  gold: { bg: colors.sky, fg: "#7a5b00" },
  green: { bg: "#e4f3e3", fg: colors.green },
  red: { bg: "#fdecef", fg: colors.red },
  blue: { bg: "#e9eefb", fg: colors.blue },
  neutral: { bg: colors.surfaceAlt, fg: colors.muted },
};

interface Props {
  label: string;
  tone?: Tone;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function Chip({ label, tone = "neutral", icon }: Props) {
  const t = TONES[tone];
  return (
    <View style={[styles.chip, { backgroundColor: t.bg }]}>
      {icon && <Ionicons name={icon} size={12.5} color={t.fg} style={{ marginRight: 4 }} />}
      <Text style={styles.text} color={t.fg}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: { fontFamily: fonts.bodyBold, fontSize: 11.5, letterSpacing: 0.3 },
});
