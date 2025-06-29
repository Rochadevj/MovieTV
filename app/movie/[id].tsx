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
        params: { videoKey: trailerKey }
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
      <SafeAreaView className="bg-primary flex-1">
        <ActivityIndicator size="large" color="#FFFFFF" />
      </SafeAreaView>
    );
  }

  return (
    <View className="bg-primary flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View>
          <Image
            source={{
              uri: `https://image.tmdb.org/t/p/w500${movie?.poster_path}`,
            }}
            className="w-full h-[550px]"
            resizeMode="stretch"
          />

          <TouchableOpacity
            className="absolute bottom-5 right-5 rounded-full size-14 bg-white flex items-center justify-center"
            onPress={handlePlayPress}
          >
            <Image
              source={icons.play}
              className="w-6 h-7 ml-1"
              resizeMode="stretch"
            />
          </TouchableOpacity>
        </View>

        <View className="flex-col items-start justify-center mt-5 px-5">
          <Text className="text-white font-bold text-xl">{movie?.title}</Text>
          <View className="flex-row items-center gap-x-1 mt-2">
            <Text className="text-light-200 text-sm">
              {movie?.release_date?.split("-")[0]} •
            </Text>
            <Text className="text-light-200 text-sm">{movie?.runtime}m</Text>
          </View>

          <View className="flex-row items-center bg-dark-100 px-2 py-1 rounded-md gap-x-1 mt-2">
            <Image source={icons.star} className="size-4" />

            <Text className="text-white font-bold text-sm">
              {Math.round(movie?.vote_average ?? 0)}/10
            </Text>

            <Text className="text-light-200 text-sm">
              ({movie?.vote_count} votos)
            </Text>
          </View>

          <MovieInfo label="Resumo" value={movie?.overview} />
          <MovieInfo
            label="Gênero"
            value={movie?.genres?.map((g) => g.name).join(" • ") || "N/A"}
          />

          <View className="flex flex-row justify-between w-1/2">
            <MovieInfo
              label="Orçamento"
              value={`$${(movie?.budget ?? 0) / 1_000_000} milhões`}
            />
            <MovieInfo
              label="Receita"
              value={`$${Math.round(
                (movie?.revenue ?? 0) / 1_000_000
              )} milhões`}
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
        className="absolute bottom-5 left-0 right-0 mx-5 bg-accent rounded-lg py-3.5 flex flex-row items-center justify-center z-50"
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