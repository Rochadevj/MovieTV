import { YouTubePlayer } from "@/components/YouTubePlayer";
import { fetchTrailer } from "@/services/api";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const getParamValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const TrailerScreen = () => {
  const router = useRouter();
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
      <View className="flex-1 items-center justify-center bg-primary">
        <StatusBar hidden />
        <ActivityIndicator size="large" color="#D6C7FF" />
      </View>
    );
  }

  if (!videoKey) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-primary px-6">
        <StatusBar hidden />
        <View className="w-full rounded-3xl border border-white/10 bg-white/5 p-5">
          <Text className="text-center text-xl font-black text-white">
            Trailer não disponível
          </Text>
          <TouchableOpacity
            onPress={router.back}
            activeOpacity={0.85}
            className="mt-5 h-12 flex-row items-center justify-center rounded-2xl bg-accent"
          >
            <Feather name="arrow-left" size={18} color="#030014" />
            <Text className="ml-2 font-black text-primary">Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-primary">
      <StatusBar hidden />
      <YouTubePlayer videoKey={videoKey} style={{ flex: 1 }} />

      <SafeAreaView pointerEvents="box-none" className="absolute left-0 right-0 top-0 px-5">
        <View className="mt-2 flex-row items-center">
          <TouchableOpacity
            onPress={router.back}
            activeOpacity={0.85}
            className="h-12 flex-row items-center rounded-full border border-white/10 bg-black/70 px-4"
          >
            <Feather name="x" size={20} color="#FFFFFF" />
            <Text className="ml-2 text-sm font-black text-white">Fechar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default TrailerScreen;
