import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { WebView } from "react-native-webview";


const fetchTrailerKey = async (movieId: number): Promise<string | null> => {
  try {
    
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=SUA_CHAVE_API`
    );
    const data = await response.json();
    
    
    const trailer = data.results.find(
      (video: any) => video.type === "Trailer" && video.site === "YouTube"
    );
    
    return trailer?.key || null;
  } catch (error) {
    console.error("Error fetching trailer:", error);
    return null;
  }
};

const TrailerScreen = () => {
  const { id } = useLocalSearchParams();
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrailer = async () => {
      try {
        const key = await fetchTrailerKey(Number(id));
        setVideoKey(key);
      } catch (error) {
        console.error("Failed to load trailer:", error);
        setVideoKey(null);
      } finally {
        setLoading(false);
      }
    };

    loadTrailer();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!videoKey) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-6">
        <Text className="text-white text-center text-lg">
          Trailer não disponível.
        </Text>
      </View>
    );
  }

  return (
    <WebView
      source={{ uri: `https://www.youtube.com/embed/${videoKey}?autoplay=1` }}
      style={{ flex: 1 }}
      allowsFullscreenVideo
      javaScriptEnabled
      domStorageEnabled
    />
  );
};

export default TrailerScreen;