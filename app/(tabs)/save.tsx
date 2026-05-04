import { icons } from "@/constants/icons";
import { useFavorites } from "@/contexts/FavoriteContext";
import { useRouter } from "expo-router";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Save = () => {
  const { favorites } = useFavorites();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-primary px-5">
      <View className="mb-6 mt-8 rounded-[28px] border border-white/10 bg-white/5 px-5 py-5">
        <Text className="text-xs uppercase tracking-[2px] text-light-300">
          Biblioteca
        </Text>
        <Text className="mt-2 text-3xl font-black text-white">Filmes salvos</Text>
        <Text className="mt-2 text-sm text-light-200">
          Sua coleção pessoal, organizada com mais destaque e contraste.
        </Text>
      </View>

      {favorites.length === 0 ? (
        <View className="flex-1 items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/5 px-6">
          <View className="h-16 w-16 items-center justify-center rounded-3xl bg-accent/15">
            <Image
              source={icons.save}
              className="h-7 w-7"
              tintColor="#D6C7FF"
              resizeMode="contain"
            />
          </View>
          <Text className="mt-5 text-center text-xl font-black text-white">
            Nenhum filme salvo ainda
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-light-200">
            Marque o ícone de salvar nos cartões para montar sua lista.
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/")}
            activeOpacity={0.85}
            className="mt-6 h-14 flex-row items-center justify-center rounded-2xl bg-accent px-6"
          >
            <Image
              source={icons.search}
              className="mr-2 h-5 w-5"
              tintColor="#030014"
              resizeMode="contain"
            />
            <Text className="font-black text-primary">Explorar filmes</Text>
          </TouchableOpacity>
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
              activeOpacity={0.85}
            >
              <Image
                source={{
                  uri: item.poster_path
                    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                    : "https://placehold.co/500x750/0f0d23/D6C7FF.png",
                }}
                className="h-72 w-full"
                resizeMode="cover"
              />
              <View className="px-3 py-3">
                <Text className="mt-2 font-semibold text-white" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-sm text-light-300">
                  {item.release_date?.split("-")[0] ?? "N/A"}
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
