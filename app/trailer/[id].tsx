import { YouTubePlayer } from "@/components/YouTubePlayer";
import { fetchTrailer } from "@/services/api";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

const getParamValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const TrailerScreen = () => {
  const { id } = useLocalSearchParams();
  const movieId = getParamValue(id);
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrailer = async () => {
      if (!movieId) {
        setVideoKey(null);
        setLoading(false);
        return;
      }

      try {
        const key = await fetchTrailer(Number(movieId));
        setVideoKey(key);
      } catch (error) {
        console.error("Erro ao carregar trailer:", error);
        setVideoKey(null);
      } finally {
        setLoading(false);
      }
    };

    loadTrailer();
  }, [movieId]);

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

  return <YouTubePlayer videoKey={videoKey} style={{ flex: 1 }} />;
};

export default TrailerScreen;
