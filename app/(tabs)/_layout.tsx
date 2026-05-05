import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import { Keyboard, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FeatherIconName = ComponentProps<typeof Feather>["name"];
type TabRouteName = "index" | "search" | "save" | "profile";

const tabs = {
  index: { title: "Início", icon: "home" },
  search: { title: "Pesquisar", icon: "search" },
  save: { title: "Salvos", icon: "bookmark" },
  profile: { title: "Perfil", icon: "user" },
} satisfies Record<TabRouteName, { title: string; icon: FeatherIconName }>;

const isTabRoute = (name: string): name is TabRouteName => name in tabs;

function MovieTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  if (keyboardVisible) return null;

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0"
      style={{ bottom: Math.max(insets.bottom, 10) + 8 }}
    >
      <View
        className="mx-5 h-16 flex-row items-center rounded-[26px] border border-white/10 bg-primary/85 px-2"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 14 },
          shadowOpacity: 0.35,
          shadowRadius: 22,
          elevation: 18,
        }}
      >
        <View className="absolute inset-0 overflow-hidden rounded-[26px]">
          <BlurView intensity={30} tint="dark" style={{ flex: 1 }} />
          <View className="absolute inset-0 bg-primary/35" />
          <View className="absolute left-6 right-6 top-0 h-px bg-white/15" />
        </View>

        {state.routes.map((route, index) => {
          if (!isTabRoute(route.name)) return null;

          const isFocused = state.index === index;
          const tab = tabs[route.name];
          const descriptor = descriptors[route.key];
          const accessibilityLabel =
            descriptor.options.tabBarAccessibilityLabel ?? tab.title;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityRole="tab"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={accessibilityLabel}
              className="h-full flex-1 items-center justify-center"
            >
              <View
                className={`h-11 w-11 items-center justify-center rounded-2xl ${
                  isFocused ? "bg-accent" : "bg-white/5"
                }`}
                style={
                  isFocused
                    ? {
                        shadowColor: "#AB8BFF",
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.34,
                        shadowRadius: 10,
                        elevation: 8,
                      }
                    : undefined
                }
              >
                <Feather
                  name={tab.icon}
                  size={21}
                  color={isFocused ? "#030014" : "#A8B5DB"}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <MovieTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: tabs.index.title }} />
      <Tabs.Screen name="search" options={{ title: tabs.search.title }} />
      <Tabs.Screen name="save" options={{ title: tabs.save.title }} />
      <Tabs.Screen name="profile" options={{ title: tabs.profile.title }} />
    </Tabs>
  );
}
