import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import GenreFilter from "@/components/GenreFilter";
import MovieDisplayCard from "@/components/MovieCard";
import SearchBar from "@/components/SearchBar";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { fetchMovies } from "@/services/api";
import { updateSearchCount } from "@/services/appwrite";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  useEffect(() => {
    let active = true;

    const timeoutId = setTimeout(async () => {
      const hasSearch = searchQuery.trim().length > 0;
      const hasGenre = selectedGenreId !== null;

      if (!hasSearch && !hasGenre) {
        setMovies([]);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const results = await fetchMovies({
          query: searchQuery,
          genreId: selectedGenreId,
        });

        if (!active) return;

        setMovies(results);

        if (hasSearch && results.length > 0 && results[0]) {
          await updateSearchCount(searchQuery, results[0]);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err : new Error("Erro desconhecido"));
        setMovies([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 500);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [searchQuery, selectedGenreId]);

  const hasActiveFilter = searchQuery.trim().length > 0 || selectedGenreId !== null;

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <Image
        source={images.bg}
        className="absolute h-full w-full opacity-30"
        resizeMode="cover"
      />
      <View className="absolute inset-0 bg-primary/70" />

      <FlatList
        className="px-5"
        data={movies}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <MovieDisplayCard {...item} />}
        numColumns={3}
        columnWrapperStyle={{
          justifyContent: "flex-start",
          gap: 12,
          marginVertical: 12,
        }}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          <>
            <View className="mt-10 items-center">
              <Image
                source={icons.logo}
                className="h-20 w-56"
                resizeMode="contain"
              />
              <Text className="mt-1 text-sm text-light-200">
                Busque por título ou filtre pelo gênero que você quer assistir.
              </Text>
            </View>

            <View className="my-5">
              <SearchBar
                placeholder="Procure pelo seu filme"
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>

            <View className="mb-5">
              <View className="mb-3">
                <Text className="text-xs uppercase tracking-[2px] text-light-300">Gêneros</Text>
                <Text className="text-lg font-bold text-white">Filtrar filmes</Text>
              </View>
              <GenreFilter
                selectedGenreId={selectedGenreId}
                onSelectGenre={setSelectedGenreId}
              />
            </View>

            {loading && (
              <ActivityIndicator
                size="large"
                color="#D6C7FF"
                className="my-3"
              />
            )}

            {error && (
              <Text className="my-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-200">
                Erro: {error.message}
              </Text>
            )}

            {!loading && !error && hasActiveFilter && movies.length > 0 && (
              <View className="mb-2 mt-2 flex-row items-end justify-between">
                <View>
                  <Text className="text-xs uppercase tracking-[2px] text-light-300">Resultados</Text>
                  <Text className="text-xl font-bold text-white">
                    {searchQuery.trim() ? (
                      <>
                        Para <Text className="text-accent">{searchQuery}</Text>
                      </>
                    ) : (
                      "Por gênero"
                    )}
                  </Text>
                </View>
                <Text className="text-sm text-light-200">{movies.length} encontrados</Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View className="mt-16 rounded-3xl border border-white/10 bg-white/5 px-6 py-10">
              <Text className="text-center text-light-200">
                {hasActiveFilter
                  ? "Nenhum filme encontrado. Ajuste o termo ou troque o gênero."
                  : "Use o campo acima ou escolha um gênero para começar."}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

export default Search;
