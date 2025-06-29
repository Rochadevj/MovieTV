import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import "./globals.css";

import { FavoriteProvider } from "@/contexts/FavoriteContext";
export default function RootLayout() {
  return (
    <FavoriteProvider>
      <StatusBar hidden={true} />

      <Stack>
      
        <Stack.Screen
          name="splash"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="movie/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="trailer"
          options={{ 
            headerShown: false,
            presentation: 'fullScreenModal', 
            animation: 'fade'
          }}
        />
      </Stack>
    </FavoriteProvider>
  );
}