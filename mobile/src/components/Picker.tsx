import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { colors, fonts, radius, spacing } from "@/theme";
import { Text } from "./Text";

interface Props {
  label?: string;
  options: string[];
  value: string | null;
  onChange: (v: string) => void;
}

/** Horizontal chip picker for a small set of options (class, subject…). */
export function Picker({ label, options, value, onChange }: Props) {
  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13.5 }} color={colors.ink}>
          {label}
        </Text>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingVertical: 2 }}
      >
        {options.length === 0 ? (
          <Text variant="small">—</Text>
        ) : (
          options.map((o) => {
            const active = o === value;
            return (
              <Pressable
                key={o}
                onPress={() => onChange(o)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text
                  style={{ fontFamily: fonts.bodySemi, fontSize: 13.5 }}
                  color={active ? colors.white : colors.ink}
                >
                  {o}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
});
