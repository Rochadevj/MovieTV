import { YouTubePlayer } from "@/components/YouTubePlayer";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const getParamValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const TrailerScreen = () => {
  const router = useRouter();
  const { videoKey, title } = useLocalSearchParams();
  const trailerKey = getParamValue(videoKey);
  const movieTitle = getParamValue(title);

  if (!trailerKey) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-primary px-6">
        <StatusBar hidden />
        <View className="w-full rounded-3xl border border-white/10 bg-white/5 p-5">
          <Text className="text-center text-xl font-black text-white">
            Trailer não disponível
          </Text>
          {movieTitle ? (
            <Text className="mt-2 text-center text-sm text-light-200">
              {movieTitle}
            </Text>
          ) : null}
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
      <YouTubePlayer videoKey={trailerKey} style={{ flex: 1 }} />

      <SafeAreaView pointerEvents="box-none" className="absolute left-0 right-0 top-0 px-5">
        <View pointerEvents="box-none" className="mt-2 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={router.back}
            activeOpacity={0.85}
            className="h-12 flex-row items-center rounded-full border border-white/10 bg-black/70 px-4"
          >
            <Feather name="x" size={20} color="#FFFFFF" />
            <Text className="ml-2 text-sm font-black text-white">Fechar</Text>
          </TouchableOpacity>

          {movieTitle ? (
            <View className="ml-3 flex-1 rounded-full border border-white/10 bg-black/55 px-4 py-3">
              <Text className="text-right text-sm font-bold text-white" numberOfLines={1}>
                {movieTitle}
              </Text>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
};

export default TrailerScreen;
