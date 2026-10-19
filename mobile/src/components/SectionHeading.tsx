import { View } from "react-native";
import { colors, spacing } from "@/theme";
import { Text } from "./Text";

/** In-body section heading: gold eyebrow + bold title (as on the site). */
export function SectionHeading({
  eyebrow,
  title,
  style,
}: {
  eyebrow?: string;
  title: string;
  style?: object;
}) {
  return (
    <View style={[{ marginBottom: spacing.md }, style]}>
      {eyebrow && (
        <Text
          style={{ fontSize: 11.5, letterSpacing: 1.4, textTransform: "uppercase" }}
          variant="eyebrow"
          color={colors.amber}
        >
          {eyebrow}
        </Text>
      )}
      <Text variant="h2" style={{ marginTop: eyebrow ? 4 : 0 }}>
        {title}
      </Text>
    </View>
  );
}
