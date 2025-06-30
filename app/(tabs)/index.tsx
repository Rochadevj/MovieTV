import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Button, Modal } from "react-native-paper";

import MovieCard from "@/components/MovieCard";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { fetchMovies } from "@/services/api";

import SearchBar from "@/components/SearchBar";
import TrendingCard from "@/components/TrendingCard";




const TMDB_CONFIG = {
  BASE_URL: "https://api.themoviedb.org/3",
  headers: {
    Authorization: `Bearer ${process.env.EXPO_PUBLIC_MOVIE_API_KEY}`,
    "Content-Type": "application/json",
  },
};

interface Movie {
  id: number;
  poster_path: string;
  title: string;
  vote_average: number;
  release_date: string;
}

interface TrendingMovie {
  movie_id: number;
  title: string;
  poster_url: string;
}

type TabParamList = {
  index: undefined;
  search: undefined;
  save: undefined;
  profile: undefined;
};

const Index = () => {
  const router = useRouter();
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const listRef = useRef<FlatList>(null);
const renderMovie = ({ item }: { item: Movie }) => <MovieCard {...item} />;
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [trendingMovies, setTrendingMovies] = useState<TrendingMovie[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiResults, setAiResults] = useState<Movie[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSearchQuery, setAiSearchQuery] = useState("");

 
  useEffect(() => {
    const loadMovies = async () => {
      try {
        setLoadingMovies(true);
        const result = await fetchMovies({ page });
        setMovies((prev) => [...prev, ...result]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Erro desconhecido"));
      } finally {
        setLoadingMovies(false);
      }
    };
    loadMovies();
  }, [page]);

  const loadMoreMovies = () => {
    if (!loadingMore) {
      setLoadingMore(true);
      setPage((prev) => prev + 1);
      setTimeout(() => setLoadingMore(false), 500);
    }
  };

  const loadTrending = async () => {
    try {
      setTrendingLoading(true);
      const response = await fetch(
        `${TMDB_CONFIG.BASE_URL}/trending/movie/day?language=pt-BR`,
        { headers: TMDB_CONFIG.headers }
      );
      if (!response.ok) throw new Error(`Erro no trending: ${response.status}`);
      const data = await response.json();
      const formatted = data.results.map((movie: any) => ({
        movie_id: movie.id,
        title: movie.title,
        poster_url: movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : '',
      }));
      setTrendingMovies(formatted);
    } catch (err) {
      console.error("Erro ao carregar trending:", err);
      setError(err instanceof Error ? err : new Error("Erro desconhecido"));
    } finally {
      setTrendingLoading(false);
    }
  };

  useEffect(() => {
    loadTrending();
  }, []);


  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", () => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
    return unsubscribe;
  }, [navigation]);

  const searchMoviesByDescription = async (description: string) => {
    setAiLoading(true);
    setAiResults([]);

    const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
    if (!apiKey) {
      alert("Chave da API OpenRouter não configurada");
      setAiLoading(false);
      return;
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1-0528",
          max_tokens: 500,
          messages: [
            {
              role: "system",
              content: `Você é um especialista em cinema. A partir de uma descrição, retorne apenas nomes de filmes reais que combinem com a descrição. Use nomes em português.`,
            },
            {
              role: "user",
              content: `Baseado nesta descrição: "${description}", me diga de 1 a 3 filmes que se encaixem perfeitamente. Responda apenas os nomes, um por linha.`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errData = await response.text();
        throw new Error(`Erro na resposta da IA: ${errData}`);
      }

      const json = await response.json();
      const textResponse = json.choices?.[0]?.message?.content;

      if (!textResponse) throw new Error("Resposta da IA vazia");

      const movieTitles: string[] = textResponse
        .split("\n")
        .map((title: string) => title.trim())
        .filter((title: string) => title.length > 0);

      const results: any[] = [];

      for (const title of movieTitles) {
        const tmdbRes = await fetch(
          `${TMDB_CONFIG.BASE_URL}/search/movie?query=${encodeURIComponent(title)}&language=pt-BR`,
          { headers: TMDB_CONFIG.headers }
        );
        const data = await tmdbRes.json();
        if (data.results?.length) results.push(data.results[0]);
      }

      setAiResults(results);
    } catch (error) {
      console.error("Erro detalhado:", error);
      alert("Erro ao buscar filmes com IA");
    } finally {
      setAiLoading(false);
    }
  };
useEffect(() => {
  return () => {
    setAiResults([]);
    setMovies([]);
    setPage(1);
  };
}, []);

  return (
    
    <View className="flex-1 bg-primary">
      <Image
        source={images.bg}
        className="absolute w-full z-0"
        resizeMode="cover"
      />

      <FlatList
 
        ref={listRef}
        ListHeaderComponent={
          <>
            <View style={{ width: "100%", alignItems: "center", marginTop: 60 }}>
              <Image
                source={icons.logo}
                style={{ width: 200, height: 100 }}
                resizeMode="contain"
              />
            </View>

            <SearchBar
              onPress={() => router.push("/search")}
              placeholder="Procure pelo seu filme"
            />

            <TouchableOpacity
              onPress={() => setAiModalVisible(true)}
              style={{
                backgroundColor: "#00FFF7",
                padding: 10,
                borderRadius: 20,
                alignSelf: "center",
                marginTop: 10,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Image source={icons.search} style={{ width: 20, height: 20, marginRight: 5 }} />
              <Text style={{ color: "black", fontWeight: "bold" }}>Busca por IA</Text>
            </TouchableOpacity>

            {trendingLoading ? (
              <ActivityIndicator size="large" color="#00FFF7" className="mt-10 self-center" />
            ) : trendingMovies.length > 0 ? (
              <View className="mt-10">
                <Text className="text-lg text-white font-bold mb-3">Em alta</Text>
                <FlatList
                       initialNumToRender={9}
  maxToRenderPerBatch={9} 
  windowSize={5} 

       getItemLayout={(data, index) => ({
    length: 300,  
    offset: 300 * index,
    index,
  })}
                  horizontal
                  data={trendingMovies.slice(0, 9)}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 26 }}
                  keyExtractor={(item) => `trending-${item.movie_id}`}
                  ItemSeparatorComponent={() => <View className="w-4" />}
                  renderItem={({ item, index }) => (
                    <TrendingCard movie={item} index={index} />
                  )}
                />
              </View>
            ) : null}

            <Text className="text-lg text-white font-bold mt-10 mb-3">
              Todos os Filmes
            </Text>
          </>
        }
        data={movies}
        
          renderItem={renderMovie}
        keyExtractor={(item) => `movie-${item.id}`}
        numColumns={3}
        columnWrapperStyle={{
          justifyContent: "flex-start",
          gap: 20,
          paddingRight: 5,
          marginBottom: 10,
        }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
        onEndReachedThreshold={0.5}
        onEndReached={loadMoreMovies}
        ListFooterComponent={
          loadingMovies || loadingMore ? (
            <ActivityIndicator size="small" color="#00FFF7" className="my-4" />
          ) : null
        }
      />

      {/* Modal de Busca por IA */}
      <Modal
        visible={aiModalVisible}
        onDismiss={() => {
          setAiModalVisible(false);
          setAiSearchQuery("");
          setAiResults([]);
        }}
        contentContainerStyle={{
          backgroundColor: "white",
          padding: 20,
          margin: 20,
          borderRadius: 10,
          maxHeight: "80%",
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 15,
            color: "#1a1a1a",
          }}
        >
          Descreva o filme que quer assistir
        </Text>

        <TextInput
          placeholder="Ex: Um filme sobre hackers com cenas de ação em Tóquio"
          placeholderTextColor="#888"
          value={aiSearchQuery}
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 5,
            padding: 10,
            minHeight: 100,
            marginBottom: 15,
            textAlignVertical: "top",
          }}
          multiline
          onChangeText={setAiSearchQuery}
        />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Button
            mode="contained"
            onPress={() => searchMoviesByDescription(aiSearchQuery)}
            loading={aiLoading}
            disabled={aiLoading || !aiSearchQuery.trim()}
            style={{ flex: 1, backgroundColor: "#00FFF7" }}
            labelStyle={{ color: "#000" }}
          >
            Buscar
          </Button>

          <Button
            mode="outlined"
            onPress={() => {
              setAiModalVisible(false);
              setAiSearchQuery("");
            }}
            style={{ flex: 1 }}
          >
            Cancelar
          </Button>
        </View>

        {aiLoading ? (
          <View style={{ marginTop: 20 }}>
            <ActivityIndicator size="large" color="#00FFF7" />
            <Text style={{ textAlign: "center", marginTop: 10 }}>
              Consultando a IA...
            </Text>
          </View>
        ) : aiResults.length > 0 ? (
          <View style={{ marginTop: 15 }}>
            <Text
              style={{
                fontWeight: "bold",
                marginBottom: 10,
                color: "#1a1a1a",
              }}
            >
              Resultados encontrados:
            </Text>

            <FlatList
              data={aiResults}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 10,
                    padding: 10,
                    backgroundColor: "#f5f5f5",
                    borderRadius: 5,
                  }}
                  onPress={() => {
                    router.push(`/movie/${item.id}`);
                    setAiModalVisible(false);
                  }}
                >
                  <Image
                    source={{
                      uri: item.poster_path
                        ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
                        : images.bg,
                    }}
                    style={{ width: 50, height: 75, borderRadius: 5 }}
                  />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={{ fontWeight: "bold", color: "#1a1a1a" }}>{item.title}</Text>
                    <Text style={{ fontSize: 12, color: "#666" }}>
                      ⭐ {item.vote_average.toFixed(1)} | {item.release_date?.split("-")[0]}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 200 }}
            />
          </View>
        ) : aiSearchQuery && !aiLoading ? (
          <Text style={{ textAlign: "center", marginTop: 20, color: "#666" }}>
            Nenhum filme encontrado. Tente descrever de outra forma.
          </Text>
        ) : null}
      </Modal>
    </View>
  );
};

export default Index;
