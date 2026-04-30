import { useFavorites } from "@/contexts/FavoriteContext";
import { useRouter } from "expo-router";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Save = () => {
  const { favorites } = useFavorites();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-primary px-5">
      <View className="mt-8 mb-6 rounded-[28px] border border-white/10 bg-white/5 px-5 py-5">
        <Text className="text-xs uppercase tracking-[2px] text-light-300">Biblioteca</Text>
        <Text className="mt-2 text-3xl font-black text-white">Filmes salvos</Text>
        <Text className="mt-2 text-sm text-light-200">
          Sua coleção pessoal, organizada com mais destaque e contraste.
        </Text>
      </View>

      {favorites.length === 0 ? (
        <View className="flex-1 items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/5 px-6">
          <Text className="text-center text-light-200 text-base">
            Nenhum filme salvo ainda.
          </Text>
          <Text className="mt-2 text-center text-sm text-light-300">
            Marque o ícone de salvar nos cartões para montar sua lista.
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          contentContainerStyle={{ gap: 16, paddingBottom: 120 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/movie/${item.id}`)}
              className="w-[48%] overflow-hidden rounded-3xl border border-white/10 bg-dark-200/80"
            >
              <Image
                source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
                className="w-full h-72"
                resizeMode="cover"
              />
              <View className="px-3 py-3">
                <Text className="text-white mt-2 font-semibold" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-light-300 text-sm">
                  {item.release_date.split("-")[0]}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default Save;
