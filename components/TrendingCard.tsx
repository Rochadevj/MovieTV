import { images } from "@/constants/images";
import MaskedView from "@react-native-masked-view/masked-view";
import { Link } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface TrendingCardProps {
  movie: {
    movie_id: number;
    title: string;
    poster_url: string;
  };
  index: number;
}

const TrendingCard = ({ movie, index }: TrendingCardProps) => {
  
  const displayNumber = index + 1; 

  return (
    <Link href={`/movie/${movie.movie_id}`} asChild>
      <TouchableOpacity className="w-32 relative pl-5">
        {movie.poster_url ? (
          <Image
            source={{ uri: movie.poster_url }}
            className="w-32 h-48 rounded-lg"
            resizeMode="cover"
            onError={(e) => console.log("Erro ao carregar imagem:", e.nativeEvent.error)}
          />
        ) : (
          <View className="w-32 h-48 rounded-lg bg-gray-800 items-center justify-center">
            <Text className="text-white">Imagem não disponível</Text>
          </View>
        )}

        <View className="absolute bottom-9 -left-3.5 px-2 py-1 rounded-full">
          <MaskedView
            maskElement={
              <Text className="font-bold text-white text-6xl">{displayNumber}</Text>
            }
          >
            <Image
              source={images.rankingGradient}
              className="size-14"
              resizeMode="cover"
            />
          </MaskedView>
        </View>

        <Text className="text-sm font-bold mt-2 text-light-200" numberOfLines={2}>
          {movie.title}
        </Text>
      </TouchableOpacity>
    </Link>
  );
};

export default TrendingCard;