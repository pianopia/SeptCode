import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#0e1730", borderTopColor: "#1c2b55" },
        tabBarActiveTintColor: "#69f6cb",
        tabBarInactiveTintColor: "#90a2d4"
      }}
    >
      <Tabs.Screen
        name="timeline"
        options={{
          title: "ホーム",
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "検索",
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="compose"
        options={{
          title: "投稿",
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="create-outline" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: "マイページ",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />
        }}
      />
      <Tabs.Screen name="user/[id]" options={{ title: "User", href: null }} />
    </Tabs>
  );
}
