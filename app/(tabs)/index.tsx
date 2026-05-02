import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Modal } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import GenreFilter from "@/components/GenreFilter";
import MovieCard from "@/components/MovieCard";
import SearchBar from "@/components/SearchBar";
import TrendingCard from "@/components/TrendingCard";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { TMDB_CONFIG, fetchMovies } from "@/services/api";

type Movie = {
  id: number;
  poster_path: string;
  title: string;
  vote_average: number;
  release_date: string;
};

type TrendingMovie = {
  movie_id: number;
  title: string;
  poster_url: string;
};

type TabParamList = {
  index: undefined;
  search: undefined;
  save: undefined;
  profile: undefined;
};

const Index = () => {
  const router = useRouter();
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const listRef = useRef<FlatList<Movie>>(null);

  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);
  const [trendingMovies, setTrendingMovies] = useState<TrendingMovie[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiResults, setAiResults] = useState<Movie[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSearchQuery, setAiSearchQuery] = useState("");

  const featuredMovie = trendingMovies[0];
  const renderMovie = ({ item }: { item: Movie }) => <MovieCard {...item} />;

  useEffect(() => {
    const loadMovies = async () => {
      try {
        setLoadingMovies(true);
        const result = await fetchMovies({ page, genreId: selectedGenreId });
        setMovies((prev) => (page === 1 ? result : [...prev, ...result]));
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Erro desconhecido"));
      } finally {
        setLoadingMovies(false);
        setLoadingMore(false);
      }
    };

    loadMovies();
  }, [page, selectedGenreId]);

  useEffect(() => {
    const loadTrending = async () => {
      try {
        setTrendingLoading(true);
        const response = await fetch(
          `${TMDB_CONFIG.BASE_URL}/trending/movie/day?language=pt-BR`,
          {
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${TMDB_CONFIG.API_KEY}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Erro nas tendências: ${response.status}`);
        }

        const data = await response.json();
        const formatted = data.results.map((movie: any) => ({
          movie_id: movie.id,
          title: movie.title,
          poster_url: movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : "",
        }));

        setTrendingMovies(formatted);
      } catch (err) {
        console.error("Erro ao carregar tendências:", err);
      } finally {
        setTrendingLoading(false);
      }
    };

    loadTrending();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", () => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    });

    return unsubscribe;
  }, [navigation]);

  const loadMoreMovies = () => {
    if (loadingMovies || loadingMore) return;
    setLoadingMore(true);
    setPage((prev) => prev + 1);
  };

  const handleGenreSelect = (genreId: number | null) => {
    setSelectedGenreId(genreId);
    setMovies([]);
    setError(null);
    setPage(1);
  };

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
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1-0528",
          max_tokens: 500,
          messages: [
            {
              role: "system",
              content:
                "Você é um especialista em cinema. A partir de uma descrição, retorne apenas nomes de filmes reais que combinem com a descrição. Use nomes em português.",
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

      const results: Movie[] = [];

      for (const title of movieTitles) {
        const tmdbRes = await fetch(
          `${TMDB_CONFIG.BASE_URL}/search/movie?query=${encodeURIComponent(title)}&language=pt-BR`,
          {
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${TMDB_CONFIG.API_KEY}`,
            },
          }
        );
        const data = await tmdbRes.json();
        if (data.results?.length) results.push(data.results[0]);
      }

      setAiResults(results);
    } catch (err) {
      console.error("Erro detalhado:", err);
      alert("Erro ao buscar filmes com IA");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary" edges={["top"]}>
      <Image
        source={images.bg}
        className="absolute h-full w-full opacity-25"
        resizeMode="cover"
      />
      <View className="absolute inset-0 bg-primary/80" />

      <FlatList
        ref={listRef}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View className="px-5 pt-4">
              <BrandHeader />

              <Text className="mt-5 text-3xl font-black text-white">
                Encontre o próximo filme sem perder tempo
              </Text>
              <Text className="mt-2 text-sm leading-5 text-light-200">
                Explore tendências, filtre por gênero e use a IA para descobrir filmes pelo clima que você quer assistir.
              </Text>
            </View>

            <View className="mt-5 px-5">
              <SearchBar onPress={() => router.push("/search")} placeholder="Buscar filme, ator ou gênero" />
            </View>

            <View className="mt-3 px-5">
              <TouchableOpacity
                onPress={() => setAiModalVisible(true)}
                activeOpacity={0.85}
                className="h-12 flex-row items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300"
              >
                <Image source={icons.search} className="mr-2 h-5 w-5" tintColor="#030014" />
                <Text className="text-sm font-black text-primary">Busca por IA</Text>
              </TouchableOpacity>
            </View>

            {featuredMovie ? (
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => router.push(`/movie/${featuredMovie.movie_id}`)}
                className="mx-5 mt-6 overflow-hidden rounded-2xl border border-white/10 bg-dark-200"
              >
                <ImageBackground
                  source={{ uri: featuredMovie.poster_url }}
                  className="h-64 justify-end"
                  resizeMode="cover"
                >
                  <View className="absolute inset-0 bg-black/35" />
                  <View className="absolute bottom-0 left-0 right-0 h-32 bg-primary/80" />

                  <View className="p-4">
                    <View className="mb-3 flex-row items-center justify-between">
                      <View className="rounded-full bg-white/90 px-3 py-1">
                        <Text className="text-xs font-black uppercase text-primary">Destaque</Text>
                      </View>
                      <Text className="rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white">
                        Em alta hoje
                      </Text>
                    </View>

                    <Text className="text-2xl font-black text-white" numberOfLines={2}>
                      {featuredMovie.title}
                    </Text>
                    <View className="mt-4 flex-row items-center justify-between">
                      <Text className="text-sm font-semibold text-light-100">
                        Abrir detalhes
                      </Text>
                      <View className="h-10 w-10 items-center justify-center rounded-full bg-accent">
                        <Image source={icons.play} className="h-5 w-5" tintColor="#030014" />
                      </View>
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ) : null}

            {error ? (
              <View className="mx-5 mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                <Text className="text-sm font-semibold text-red-100">{error.message}</Text>
              </View>
            ) : null}

            <View className="mt-8">
              <SectionHeader
                eyebrow="Tendência"
                title="Em alta agora"
                action={trendingMovies.length ? "Top 9" : undefined}
              />
              {trendingLoading ? (
                <ActivityIndicator size="large" color="#D6C7FF" className="mt-6 self-center" />
              ) : trendingMovies.length > 0 ? (
                <FlatList
                  initialNumToRender={9}
                  maxToRenderPerBatch={9}
                  windowSize={5}
                  horizontal
                  data={trendingMovies.slice(0, 9)}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 14, paddingHorizontal: 20, paddingTop: 12 }}
                  keyExtractor={(item) => `trending-${item.movie_id}`}
                  renderItem={({ item, index }) => <TrendingCard movie={item} index={index} />}
                />
              ) : null}
            </View>

            <View className="mt-8">
              <SectionHeader
                eyebrow="Gêneros"
                title="Escolha um clima"
                action={selectedGenreId ? "Filtrado" : undefined}
              />
              <View className="mt-3 pl-5">
                <GenreFilter
                  selectedGenreId={selectedGenreId}
                  onSelectGenre={handleGenreSelect}
                />
              </View>
            </View>

            <View className="mt-8">
              <SectionHeader
                eyebrow="Catálogo"
                title={selectedGenreId ? "Filmes filtrados" : "Todos os filmes"}
                action={`${movies.length} exibidos`}
              />
            </View>
          </>
        }
        data={movies}
        renderItem={renderMovie}
        keyExtractor={(item) => `movie-${item.id}`}
        numColumns={3}
        columnWrapperStyle={{
          justifyContent: "flex-start",
          gap: 12,
          paddingHorizontal: 20,
          marginBottom: 14,
        }}
        contentContainerStyle={{ paddingBottom: 120 }}
        onEndReachedThreshold={0.5}
        onEndReached={loadMoreMovies}
        ListFooterComponent={
          loadingMovies || loadingMore ? (
            <ActivityIndicator size="small" color="#D6C7FF" className="my-5" />
          ) : null
        }
      />

      <Modal
        visible={aiModalVisible}
        onDismiss={() => {
          setAiModalVisible(false);
          setAiSearchQuery("");
          setAiResults([]);
        }}
        contentContainerStyle={{
          backgroundColor: "#0F0D23",
          padding: 20,
          margin: 18,
          borderRadius: 20,
          maxHeight: "82%",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <Text className="text-xs uppercase tracking-[2px] text-light-300">Busca por IA</Text>
        <Text className="mt-2 text-2xl font-bold text-white">Descreva o clima do filme</Text>
        <Text className="mt-2 text-sm text-light-200">
          Exemplo: um suspense futurista com perseguições em Tóquio.
        </Text>

        <TextInput
          placeholder="Ex: Um filme sobre hackers com cenas de ação em Tóquio"
          placeholderTextColor="#A8B5DB"
          value={aiSearchQuery}
          className="mt-4 min-h-28 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-white"
          multiline
          textAlignVertical="top"
          onChangeText={setAiSearchQuery}
        />

        <View className="mt-4 flex-row gap-3">
          <Button
            mode="contained"
            onPress={() => searchMoviesByDescription(aiSearchQuery)}
            loading={aiLoading}
            disabled={aiLoading || !aiSearchQuery.trim()}
            style={{ flex: 1, backgroundColor: "#AB8BFF" }}
            labelStyle={{ color: "#030014", fontWeight: "700" }}
          >
            Buscar
          </Button>

          <Button
            mode="outlined"
            onPress={() => {
              setAiModalVisible(false);
              setAiSearchQuery("");
            }}
            style={{ flex: 1, borderColor: "rgba(255,255,255,0.18)" }}
            textColor="#fff"
          >
            Cancelar
          </Button>
        </View>

        {aiLoading ? (
          <View style={{ marginTop: 20 }}>
            <ActivityIndicator size="large" color="#D6C7FF" />
            <Text style={{ textAlign: "center", marginTop: 10, color: "#A8B5DB" }}>
              Consultando a IA...
            </Text>
          </View>
        ) : aiResults.length > 0 ? (
          <View style={{ marginTop: 15 }}>
            <Text className="mb-3 font-bold text-white">Resultados encontrados</Text>

            <FlatList
              data={aiResults}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="mb-3 flex-row items-center rounded-2xl border border-white/10 bg-white/5 p-3"
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
                    style={{ width: 56, height: 82, borderRadius: 12 }}
                  />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={{ fontWeight: "bold", color: "#fff" }}>{item.title}</Text>
                    <Text style={{ fontSize: 12, color: "#A8B5DB", marginTop: 4 }}>
                      Nota {item.vote_average.toFixed(1)} | {item.release_date?.split("-")[0]}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 200 }}
            />
          </View>
        ) : aiSearchQuery && !aiLoading ? (
          <Text style={{ textAlign: "center", marginTop: 20, color: "#A8B5DB" }}>
            Nenhum filme encontrado. Tente descrever de outra forma.
          </Text>
        ) : null}
      </Modal>
    </SafeAreaView>
  );
};

const SectionHeader = ({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: string;
}) => (
  <View className="flex-row items-end justify-between px-5">
    <View className="flex-1 pr-4">
      <Text className="text-xs uppercase tracking-[2px] text-light-300">{eyebrow}</Text>
      <Text className="mt-1 text-xl font-black text-white">{title}</Text>
    </View>
    {action ? (
      <Text className="text-xs font-semibold text-light-200">{action}</Text>
    ) : null}
  </View>
);

const BrandHeader = () => (
  <View className="flex-row items-center justify-between">
    <View className="flex-1 flex-row items-center">
      <View className="h-12 w-12 items-center justify-center rounded-2xl border border-accent/30 bg-accent/15">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-accent">
          <Image
            source={icons.play}
            className="ml-0.5 h-4 w-4"
            tintColor="#030014"
            resizeMode="contain"
          />
        </View>
      </View>

      <View className="ml-3 flex-1">
        <Text className="text-2xl font-black text-white" numberOfLines={1}>
          MovieTV
        </Text>
        <Text className="text-xs font-semibold uppercase tracking-[1px] text-light-300">
          Cinema inteligente
        </Text>
      </View>
    </View>

    <View className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
      <Text className="text-xs font-bold text-light-100">BR</Text>
    </View>
  </View>
);

export default Index;
