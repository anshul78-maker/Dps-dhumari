import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { useAuth } from "@/auth/AuthContext";
import { colors, fonts } from "@/theme";

export default function AccountantLayout() {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (!session) return <Redirect href="/login" />;
  if (session.role !== "accountant") return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.line,
          height: Platform.OS === "ios" ? 86 : 64,
          paddingTop: 6,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Fees",
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add-fee"
        options={{
          title: "Add fee",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: "Students",
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="certificates"
        options={{
          title: "TCs",
          tabBarIcon: ({ color, size }) => <Ionicons name="ribbon" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notices"
        options={{
          title: "Notices",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="megaphone" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
