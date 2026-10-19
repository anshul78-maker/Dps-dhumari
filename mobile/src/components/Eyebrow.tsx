import { StyleSheet, View } from "react-native";
import { colors, radius, type } from "@/theme";
import { Text } from "./Text";

interface Props {
  children: string;
  /** Gold pill (on light) vs plain gold text. */
  pill?: boolean;
  color?: string;
}

/** The small-caps section label used across the site (e.g. "SCHOOL ERP PORTAL"). */
export function Eyebrow({ children, pill = true, color }: Props) {
  if (!pill) {
    return (
      <Text style={type.eyebrow} color={color ?? colors.amber}>
        {children}
      </Text>
    );
  }
  return (
    <View style={styles.pill}>
      <Text style={type.eyebrow} color={colors.ink}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    backgroundColor: colors.sky,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
