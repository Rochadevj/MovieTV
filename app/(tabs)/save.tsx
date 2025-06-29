import { useFavorites } from "@/contexts/FavoriteContext";
import { useRouter } from "expo-router";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Save = () => {
  const { favorites } = useFavorites();
  const router = useRouter();

  return (
    <SafeAreaView className="bg-primary flex-1 px-5">
      {/* Cabeçalho */}
      <View className="items-center mt-10 mb-6">
        <Text className="text-white text-2xl font-extrabold tracking-wide">
          🎬 Filmes Salvos
        </Text>
        <View className="w-16 h-1 bg-cyan-400 mt-2 rounded-full" />
      </View>

      {/* Lista */}
      {favorites.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-400 text-base">
            Nenhum filme salvo ainda.
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={{ gap: 20, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => router.push(`/movie/${item.id}`)} // Mesma rota da pesquisa
              className="w-[48%]"
            >
              <Image
                source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
                className="w-full h-64 rounded-lg"
                resizeMode="cover"
              />
              <Text className="text-white mt-2 font-semibold" numberOfLines={1}>
                {item.title}
              </Text>
              <Text className="text-gray-400 text-sm">
                {item.release_date.split('-')[0]}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default Save;