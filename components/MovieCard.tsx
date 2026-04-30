import { icons } from "@/constants/icons";
import { useFavorites } from "@/contexts/FavoriteContext";
import { Movie } from "@/types";
import { useRouter } from "expo-router";
import React, { memo } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

const MovieCard = memo(({
  id,
  poster_path,
  title,
  vote_average,
  release_date,
}: Movie) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const router = useRouter();
  const favorite = isFavorite(id);

  const handleFavoritePress = () => {
    toggleFavorite({ id, poster_path, title, vote_average, release_date });
  };

  const handleCardPress = () => {
    router.push(`/movie/${id}`);
  };

  return (
    <TouchableOpacity
      onPress={handleCardPress}
      className="w-[31%]"
      activeOpacity={0.82}
    >
      <View className="overflow-hidden rounded-2xl border border-white/10 bg-dark-200/95">
        <View className="relative">
          <Image
            source={{
              uri: poster_path
                ? `https://image.tmdb.org/t/p/w500${poster_path}`
                : "https://placehold.co/600x900/0f0d23/D6C7FF.png",
            }}
            className="h-48 w-full"
            resizeMode="cover"
            fadeDuration={300}
            progressiveRenderingEnabled
          />

          <View className="absolute inset-x-0 top-0 flex-row items-start justify-between p-2">
            <View className="rounded-full bg-black/55 px-2 py-1">
              <Text className="text-[10px] font-black text-white">
                {Math.round(vote_average * 10)}%
              </Text>
            </View>

            <FavoriteButton
              isFavorite={favorite}
              onPress={handleFavoritePress}
            />
          </View>
        </View>

        <View className="px-2.5 py-3">
          <MovieInfo
            title={title}
            vote_average={vote_average}
            release_date={release_date}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
});

MovieCard.displayName = "MovieCard";

const FavoriteButton = memo(({
  isFavorite,
  onPress,
}: {
  isFavorite: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className={`z-10 h-8 w-8 items-center justify-center rounded-full ${
      isFavorite ? "bg-accent" : "bg-black/55"
    }`}
    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    activeOpacity={0.8}
  >
    <Image
      source={icons.save}
      className="h-4 w-4"
      tintColor={isFavorite ? "#030014" : "#FFFFFF"}
      resizeMode="contain"
    />
  </TouchableOpacity>
));

FavoriteButton.displayName = "FavoriteButton";

const MovieInfo = memo(({
  title,
  vote_average,
  release_date,
}: {
  title: string;
  vote_average: number;
  release_date?: string;
}) => (
  <>
    <Text
      className="text-[13px] font-bold leading-4 text-white"
      numberOfLines={2}
      ellipsizeMode="tail"
    >
      {title}
    </Text>

    <View className="mt-2 flex-row items-center justify-between">
      <View className="flex-row items-center">
        <Image
          source={icons.star}
          className="h-3.5 w-3.5"
          resizeMode="contain"
        />
        <Text className="ml-1 text-xs font-semibold text-light-100">
          {vote_average.toFixed(1)}
        </Text>
      </View>

      {release_date ? (
        <Text className="text-xs font-medium text-light-300">
          {release_date.split("-")[0]}
        </Text>
      ) : null}
    </View>
  </>
));

MovieInfo.displayName = "MovieInfo";

export default MovieCard;
