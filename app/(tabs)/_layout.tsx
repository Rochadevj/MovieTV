import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { Image, ImageBackground, View } from "react-native";

import { icons } from "@/constants/icons";
import { images } from "@/constants/images";

function TabIcon({ focused, icon }: { focused: boolean; icon: any }) {
  if (focused) {
    return (
      <ImageBackground
        source={images.highlight}
        className="h-12 w-12 items-center justify-center rounded-full"
        imageStyle={{ borderRadius: 999 }}
      >
        <Image source={icon} tintColor="#151312" className="h-5 w-5" />
      </ImageBackground>
    );
  }

  return (
    <View className="items-center justify-center">
      <View className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5">
        <Image source={icon} tintColor="#A8B5DB" className="h-5 w-5" />
      </View>
      <View className="mt-1 h-1 w-1 rounded-full bg-white/20" />
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
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 8,
        },
        tabBarStyle: {
          backgroundColor: "rgba(10, 9, 24, 0.85)",
          borderRadius: 999,
          marginHorizontal: 16,
          marginBottom: 18,
          height: 72,
          paddingHorizontal: 12,
          paddingVertical: 6,
          position: "absolute",
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.12)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 18 },
          shadowOpacity: 0.4,
          shadowRadius: 26,
          elevation: 22,
        },
        tabBarBackground: () => (
          <BlurView intensity={28} tint="dark" style={{ flex: 1 }} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.home} />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: "Pesquisar",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.search} />
          ),
        }}
      />

      <Tabs.Screen
        name="save"
        options={{
          title: "Salvos",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.save} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.person} />
          ),
        }}
      />
    </Tabs>
  );
}
