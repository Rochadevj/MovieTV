import { icons } from "@/constants/icons";
import { fetchMovieDetails, fetchTrailer } from "@/services/api";
import useFetch from "@/services/usefetch";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
interface MovieInfoProps {
  label: string;
  value?: string | number | null;
}

const MovieInfo = ({ label, value }: MovieInfoProps) => (
  <View className="flex-col items-start justify-center mt-5">
    <Text className="text-light-200 font-normal text-sm">{label}</Text>
    <Text className="text-light-100 font-bold text-sm mt-2">
      {value || "N/A"}
    </Text>
  </View>
);

const Details = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const { data: movie, loading } = useFetch(() =>
    fetchMovieDetails(id as string)
  );

 



const handlePlayPress = async () => {
  try {
    const trailerKey = await fetchTrailer(Number(id)); 
    
    if (trailerKey) {
      router.push({
        pathname: "/trailer",
        params: { videoKey: trailerKey, title: movie?.title }
      });
    } else {
      alert("Trailer não disponível");
    }
  } catch (error) {
    console.error("Erro:", error);
    alert("Erro ao buscar trailer");
  }
};

  if (loading) {
    return (
      <SafeAreaView className="bg-primary flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#D6C7FF" />
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-primary">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="relative">
          <Image
            source={{
              uri: `https://image.tmdb.org/t/p/w500${movie?.poster_path}`,
            }}
            className="w-full h-[560px]"
            resizeMode="cover"
          />

          <View className="absolute inset-0 bg-primary/35" />

          <View className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-primary to-transparent" />

          <TouchableOpacity
            className="absolute bottom-6 right-5 rounded-full h-14 w-14 bg-accent flex items-center justify-center shadow-lg"
            onPress={handlePlayPress}
          >
            <Image
              source={icons.play}
              className="w-6 h-7 ml-1"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <View className="-mt-10 rounded-t-[32px] bg-primary px-5 pt-6">
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <Text className="text-white font-black text-3xl">{movie?.title}</Text>
              <View className="mt-3 flex-row items-center gap-x-2">
                <Text className="text-light-200 text-sm">
                  {movie?.release_date?.split("-")[0]} •
                </Text>
                <Text className="text-light-200 text-sm">{movie?.runtime}m</Text>
              </View>
            </View>

            <View className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <Text className="text-[10px] uppercase tracking-[2px] text-light-300">Nota</Text>
              <Text className="mt-1 text-center text-lg font-bold text-white">
                {Math.round(movie?.vote_average ?? 0)}/10
              </Text>
            </View>
          </View>

          <View className="mt-4 flex-row flex-wrap gap-2">
            <View className="flex-row items-center rounded-full bg-white/5 px-3 py-2">
              <Image source={icons.star} className="size-4" />
              <Text className="ml-2 text-white font-semibold text-sm">
                {Math.round(movie?.vote_average ?? 0)}/10
              </Text>
            </View>

            <View className="rounded-full bg-accent/10 px-3 py-2">
              <Text className="text-accent text-sm font-semibold">
                {movie?.vote_count} votos
              </Text>
            </View>
          </View>

          <MovieInfo label="Resumo" value={movie?.overview} />
          <MovieInfo
            label="Gênero"
            value={movie?.genres?.map((g) => g.name).join(" • ") || "N/A"}
          />

          <View className="mt-2 flex-row justify-between gap-3">
            <MovieInfo
              label="Orçamento"
              value={`$${(movie?.budget ?? 0) / 1_000_000} mi`}
            />
            <MovieInfo
              label="Receita"
              value={`$${Math.round(
                (movie?.revenue ?? 0) / 1_000_000
              )} mi`}
            />
          </View>

          <MovieInfo
            label="Produção"
            value={
              movie?.production_companies?.map((c) => c.name).join(" • ") ||
              "N/A"
            }
          />
        </View>
      </ScrollView>

      <TouchableOpacity
        className="absolute bottom-6 left-0 right-0 mx-5 flex flex-row items-center justify-center rounded-full bg-accent py-4 z-50"
        onPress={router.back}
      >
        <Image
          source={icons.arrow}
          className="size-5 mr-1 mt-0.5 rotate-180"
          tintColor="#fff"
        />
        <Text className="text-white font-semibold text-base">Voltar</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Details;
