import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { View } from "react-native";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

const tabs = {
  index: { title: "Início", icon: "home" },
  search: { title: "Pesquisar", icon: "search" },
  save: { title: "Salvos", icon: "bookmark" },
  profile: { title: "Perfil", icon: "user" },
} satisfies Record<string, { title: string; icon: FeatherIconName }>;

function TabIcon({
  focused,
  icon,
}: {
  focused: boolean;
  icon: FeatherIconName;
}) {
  return (
    <View className="h-16 w-16 items-center justify-center">
      {focused ? (
        <View
          className="absolute h-12 w-12 rounded-2xl bg-accent"
          style={{
            shadowColor: "#AB8BFF",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.45,
            shadowRadius: 14,
            elevation: 10,
          }}
        />
      ) : (
        <View className="absolute h-11 w-11 rounded-2xl bg-white/5" />
      )}

      <Feather
        name={icon}
        size={focused ? 23 : 21}
        color={focused ? "#030014" : "#A8B5DB"}
      />

      <View
        className={`absolute bottom-0 h-1 rounded-full ${
          focused ? "w-5 bg-accent" : "w-1 bg-white/20"
        }`}
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: {
          height: 66,
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarStyle: {
          backgroundColor: "rgba(8, 7, 20, 0.72)",
          borderRadius: 28,
          marginHorizontal: 18,
          marginBottom: 18,
          height: 74,
          paddingHorizontal: 10,
          paddingTop: 4,
          paddingBottom: 4,
          position: "absolute",
          overflow: "visible",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.12)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.38,
          shadowRadius: 24,
          elevation: 18,
        },
        tabBarBackground: () => (
          <View className="flex-1 overflow-hidden rounded-[28px]">
            <BlurView intensity={32} tint="dark" style={{ flex: 1 }} />
            <View className="absolute inset-0 bg-primary/35" />
            <View className="absolute left-7 right-7 top-0 h-px bg-white/15" />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: tabs.index.title,
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={tabs.index.icon} />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: tabs.search.title,
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={tabs.search.icon} />
          ),
        }}
      />

      <Tabs.Screen
        name="save"
        options={{
          title: tabs.save.title,
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={tabs.save.icon} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: tabs.profile.title,
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={tabs.profile.icon} />
          ),
        }}
      />
    </Tabs>
  );
}
