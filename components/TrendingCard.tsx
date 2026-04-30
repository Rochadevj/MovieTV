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
      <TouchableOpacity
        className="w-32 overflow-hidden rounded-2xl border border-white/10 bg-dark-200/95"
        activeOpacity={0.82}
      >
        {movie.poster_url ? (
          <View className="relative">
            <Image
              source={{ uri: movie.poster_url }}
              className="h-48 w-full"
              resizeMode="cover"
            />
            <View className="absolute inset-x-0 top-0 p-2">
              <View className="self-start rounded-full bg-black/55 px-2 py-1">
                <Text className="text-[10px] font-black uppercase text-white">
                  Top {displayNumber}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View className="h-48 w-full items-center justify-center bg-dark-100 px-3">
            <Text className="text-center text-xs text-light-200">Imagem indisponível</Text>
          </View>
        )}

        <View className="absolute bottom-12 -left-2">
          <MaskedView
            maskElement={
              <Text className="text-5xl font-black text-white">{displayNumber}</Text>
            }
          >
            <Image
              source={images.rankingGradient}
              className="h-12 w-12"
              resizeMode="cover"
            />
          </MaskedView>
        </View>

        <View className="min-h-14 justify-center px-3 py-2.5">
          <Text className="text-sm font-bold leading-4 text-white" numberOfLines={2}>
            {movie.title}
          </Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

export default TrendingCard;
