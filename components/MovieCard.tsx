import { useFavorites } from "@/contexts/FavoriteContext";
import { Movie } from "@/types";
import { useRouter } from "expo-router";
import React, { memo } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

const MovieCard = memo(({
  id,
  poster_path,
  title,
  vote_average,
  release_date,
}: Movie) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const router = useRouter();

  const handleFavoritePress = () => {
    toggleFavorite({ id, poster_path, title, vote_average, release_date });
  };

  const handleCardPress = () => {
    router.push(`/movie/${id}`);
  };

  return (
    <TouchableOpacity 
      onPress={handleCardPress} 
      className="w-[30%] relative"
      activeOpacity={0.7}
    >
    
      <Image
        source={{
          uri: poster_path
            ? `https://image.tmdb.org/t/p/w500${poster_path}`
            : "https://placehold.co/600x400/1a1a1a/FFFFFF.png",
        }}
        className="w-full h-52 rounded-lg"
        resizeMode="cover"
        fadeDuration={300}
        progressiveRenderingEnabled
      />

    
      <FavoriteButton 
        isFavorite={isFavorite(id)} 
        onPress={handleFavoritePress} 
      />

  
      <MovieInfo 
        title={title}
        vote_average={vote_average}
        release_date={release_date}
      />
    </TouchableOpacity>
  );
});


const FavoriteButton = memo(({ isFavorite, onPress }: { 
  isFavorite: boolean, 
  onPress: () => void 
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="absolute top-2 right-2 z-10"
    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
  >
    <Text className="text-white text-lg">
      {isFavorite ? "❤️" : "🤍"}
    </Text>
  </TouchableOpacity>
));

const MovieInfo = memo(({ 
  title, 
  vote_average, 
  release_date 
}: { 
  title: string, 
  vote_average: number, 
  release_date?: string 
}) => (
  <>
    <Text 
      className="text-sm font-bold text-white mt-2" 
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {title}
    </Text>

    <View className="flex-row items-center gap-x-1">
      <Image 
        source={require("@/assets/icons/star.png")} 
        className="w-4 h-4" 
      />
      <Text className="text-xs text-white font-bold">
        {Math.round(vote_average / 2)}
      </Text>
    </View>

    {release_date && (
      <Text className="text-xs text-light-300 font-medium mt-1">
        {release_date.split("-")[0]}
      </Text>
    )}
  </>
));

export default MovieCard;