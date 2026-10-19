import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { useAuth } from "@/auth/AuthContext";
import { colors, fonts } from "@/theme";

export default function TeacherLayout() {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (!session) return <Redirect href="/login" />;
  if (session.role !== "teacher") return <Redirect href="/" />;

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
          title: "Classes",
          tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Attendance",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="marks"
        options={{
          title: "Marks",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="create" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assignments"
        options={{
          title: "Work",
          tabBarIcon: ({ color, size }) => <Ionicons name="reader" size={size} color={color} />,
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
      {/* Reached by navigation, hidden from the tab bar */}
      <Tabs.Screen name="submissions" options={{ href: null }} />
      <Tabs.Screen name="report-cards" options={{ href: null }} />
    </Tabs>
  );
}
