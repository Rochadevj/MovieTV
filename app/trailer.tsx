import { useLocalSearchParams } from "expo-router";
import { StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { YouTubePlayer } from "@/components/YouTubePlayer";

const getParamValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const TrailerScreen = () => {
  const { videoKey, title } = useLocalSearchParams();
  const trailerKey = getParamValue(videoKey);
  const movieTitle = getParamValue(title);

  if (!trailerKey) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#030014", padding: 24 }}>
        <StatusBar hidden />
        <View style={{ width: "100%", borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", padding: 20 }}>
          <Text style={{ color: "white", fontSize: 20, fontWeight: "700", textAlign: "center" }}>Trailer não disponível</Text>
          {movieTitle ? (
            <Text style={{ color: "#A8B5DB", marginTop: 8, textAlign: "center" }}>{movieTitle}</Text>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#030014" }}>
      <StatusBar hidden />
      <YouTubePlayer videoKey={trailerKey} style={{ flex: 1 }} />
    </View>
  );
};

export default TrailerScreen;
