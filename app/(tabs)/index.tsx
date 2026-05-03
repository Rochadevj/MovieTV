import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import GenreFilter from "@/components/GenreFilter";
import MovieCard from "@/components/MovieCard";
import SearchBar from "@/components/SearchBar";
import TrendingCard from "@/components/TrendingCard";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { TMDB_CONFIG, fetchMovies } from "@/services/api";
import type { Movie } from "@/types";

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

const AI_EXAMPLES = [
  "Suspense psicológico com final surpreendente",
  "Comédia leve para assistir em família",
  "Terror sobrenatural com clima pesado",
];

const parseMovieTitles = (text: string) =>
  text
    .split("\n")
    .map((title) =>
      title
        .replace(/^\s*[-*\d.)]+\s*/, "")
        .replace(/^["']|["']$/g, "")
        .trim()
    )
    .filter(Boolean)
    .slice(0, 4);

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
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiHasSearched, setAiHasSearched] = useState(false);

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

  const resetAiSearch = () => {
    setAiSearchQuery("");
    setAiResults([]);
    setAiError(null);
    setAiHasSearched(false);
  };

  const openAiModal = () => {
    setAiModalVisible(true);
    setAiError(null);
  };

  const closeAiModal = () => {
    setAiModalVisible(false);
    resetAiSearch();
  };

  const handleAiQueryChange = (value: string) => {
    setAiSearchQuery(value);
    setAiError(null);
    setAiHasSearched(false);
  };

  const searchMoviesByDescription = async (description: string) => {
    const trimmedDescription = description.trim();

    if (trimmedDescription.length < 8) {
      setAiError("Descreva um pouco melhor o tipo de filme que você quer.");
      return;
    }

    setAiLoading(true);
    setAiResults([]);
    setAiError(null);
    setAiHasSearched(false);

    const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
    if (!apiKey) {
      setAiError("A chave EXPO_PUBLIC_OPENROUTER_API_KEY não está configurada.");
      setAiLoading(false);
      setAiHasSearched(true);
      return;
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://movietv.app",
          "X-Title": "MovieTV",
        },
        body: JSON.stringify({
          model: process.env.EXPO_PUBLIC_OPENROUTER_MODEL ?? "deepseek/deepseek-chat",
          max_tokens: 500,
          temperature: 0.4,
          messages: [
            {
              role: "system",
              content:
                "Você é um especialista em cinema. Retorne apenas nomes de filmes reais, um por linha, sem explicações, sem numeração e sem comentários.",
            },
            {
              role: "user",
              content: `Baseado nesta descrição: "${trimmedDescription}", indique de 1 a 4 filmes que combinem. Use títulos conhecidos no Brasil quando possível.`,
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

      const movieTitles = parseMovieTitles(textResponse);
      const results: Movie[] = [];
      const usedIds = new Set<number>();

      for (const title of movieTitles) {
        const tmdbResults = await fetchMovies({ query: title, page: 1 });
        const movie = tmdbResults[0];

        if (movie && !usedIds.has(movie.id)) {
          results.push(movie);
          usedIds.add(movie.id);
        }
      }

      setAiResults(results);
    } catch (err) {
      console.error("Erro detalhado:", err);
      setAiError("Não foi possível buscar com IA agora. Tente novamente em instantes.");
    } finally {
      setAiLoading(false);
      setAiHasSearched(true);
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
              <SearchBar
                onPress={() => router.push("/search")}
                placeholder="Buscar filme, ator ou gênero"
              />
            </View>

            <View className="mt-3 px-5">
              <AIFinderCard onPress={openAiModal} />
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
                        <Text className="text-xs font-black uppercase text-primary">
                          Destaque
                        </Text>
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
                        <Image
                          source={icons.play}
                          className="h-5 w-5"
                          tintColor="#030014"
                        />
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
                <ActivityIndicator
                  size="large"
                  color="#D6C7FF"
                  className="mt-6 self-center"
                />
              ) : trendingMovies.length > 0 ? (
                <FlatList
                  initialNumToRender={9}
                  maxToRenderPerBatch={9}
                  windowSize={5}
                  horizontal
                  data={trendingMovies.slice(0, 9)}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    gap: 14,
                    paddingHorizontal: 20,
                    paddingTop: 12,
                  }}
                  keyExtractor={(item) => `trending-${item.movie_id}`}
                  renderItem={({ item, index }) => (
                    <TrendingCard movie={item} index={index} />
                  )}
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

      <AISearchModal
        visible={aiModalVisible}
        query={aiSearchQuery}
        results={aiResults}
        loading={aiLoading}
        error={aiError}
        hasSearched={aiHasSearched}
        onClose={closeAiModal}
        onChangeQuery={handleAiQueryChange}
        onSearch={() => searchMoviesByDescription(aiSearchQuery)}
        onUseExample={(example) => {
          setAiSearchQuery(example);
          setAiError(null);
          setAiHasSearched(false);
        }}
        onOpenMovie={(movieId) => {
          closeAiModal();
          router.push(`/movie/${movieId}`);
        }}
      />
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

const AIFinderCard = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.86}
    className="rounded-2xl border border-accent/25 bg-dark-200/95 p-4"
  >
    <View className="flex-row items-center">
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-accent">
        <Image
          source={icons.search}
          className="h-5 w-5"
          tintColor="#030014"
          resizeMode="contain"
        />
      </View>

      <View className="ml-3 flex-1">
        <Text className="text-base font-black text-white">Encontrar com IA</Text>
        <Text className="mt-1 text-sm leading-5 text-light-200">
          Descreva uma ideia, clima ou gênero e receba sugestões.
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

const AISearchModal = ({
  visible,
  query,
  results,
  loading,
  error,
  hasSearched,
  onClose,
  onChangeQuery,
  onSearch,
  onUseExample,
  onOpenMovie,
}: {
  visible: boolean;
  query: string;
  results: Movie[];
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
  onClose: () => void;
  onChangeQuery: (value: string) => void;
  onSearch: () => void;
  onUseExample: (example: string) => void;
  onOpenMovie: (movieId: number) => void;
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
    statusBarTranslucent
  >
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 justify-end bg-black/70"
    >
      <Pressable className="flex-1" onPress={onClose} />

      <View className="max-h-[88%] rounded-t-[28px] border border-white/10 bg-dark-200 px-5 pb-6 pt-5">
        <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-white/20" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 10 }}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-xs uppercase tracking-[2px] text-light-300">
                Busca por IA
              </Text>
              <Text className="mt-1 text-2xl font-black text-white">
                Descreva o filme ideal
              </Text>
              <Text className="mt-2 text-sm leading-5 text-light-200">
                Escreva o clima, tema ou estilo. A IA sugere títulos e o app busca os filmes no catálogo.
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
            >
              <Text className="text-lg font-black text-white">×</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Ex: um suspense futurista com perseguições em Tóquio"
            placeholderTextColor="#A8B5DB"
            value={query}
            className="mt-5 min-h-28 rounded-2xl border border-white/10 bg-primary px-4 py-4 text-base text-white"
            multiline
            textAlignVertical="top"
            editable={!loading}
            onChangeText={onChangeQuery}
          />

          <View className="mt-3 flex-row flex-wrap gap-2">
            {AI_EXAMPLES.map((example) => (
              <TouchableOpacity
                key={example}
                onPress={() => onUseExample(example)}
                disabled={loading}
                activeOpacity={0.85}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2"
              >
                <Text className="text-xs font-semibold text-light-100">
                  {example}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {error ? (
            <View className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 p-3">
              <Text className="text-sm font-semibold text-red-100">{error}</Text>
            </View>
          ) : null}

          <View className="mt-5 flex-row gap-3">
            <TouchableOpacity
              onPress={onSearch}
              activeOpacity={0.86}
              disabled={loading || !query.trim()}
              className={`h-14 flex-1 items-center justify-center rounded-2xl ${
                loading || !query.trim() ? "bg-white/10" : "bg-accent"
              }`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#D6C7FF" />
              ) : (
                <Text
                  className={`font-black ${
                    query.trim() ? "text-primary" : "text-light-300"
                  }`}
                >
                  Buscar filmes
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.86}
              disabled={loading}
              className="h-14 w-28 items-center justify-center rounded-2xl border border-white/10 bg-white/5"
            >
              <Text className="font-bold text-white">Cancelar</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="mt-6 items-center rounded-2xl border border-white/10 bg-white/5 p-5">
              <ActivityIndicator size="large" color="#D6C7FF" />
              <Text className="mt-3 text-center text-sm font-semibold text-light-200">
                Consultando a IA e buscando no TMDB...
              </Text>
            </View>
          ) : results.length > 0 ? (
            <View className="mt-6">
              <Text className="mb-3 text-base font-black text-white">
                Resultados encontrados
              </Text>

              {results.map((item) => (
                <TouchableOpacity
                  key={`ai-result-${item.id}`}
                  className="mb-3 flex-row items-center rounded-2xl border border-white/10 bg-white/5 p-3"
                  activeOpacity={0.85}
                  onPress={() => onOpenMovie(item.id)}
                >
                  <Image
                    source={{
                      uri: item.poster_path
                        ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
                        : "https://placehold.co/400x600/0f0d23/D6C7FF.png",
                    }}
                    className="h-24 w-16 rounded-xl"
                    resizeMode="cover"
                  />

                  <View className="ml-3 flex-1">
                    <Text className="text-base font-black text-white" numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text className="mt-1 text-sm font-semibold text-light-200">
                      Nota {item.vote_average.toFixed(1)} • {item.release_date?.split("-")[0] ?? "N/A"}
                    </Text>
                    <Text className="mt-2 text-xs font-bold uppercase tracking-[1px] text-accent">
                      Abrir detalhes
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : hasSearched && !error ? (
            <View className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <Text className="text-base font-bold text-white">
                Nenhum filme encontrado.
              </Text>
              <Text className="mt-2 text-sm leading-5 text-light-200">
                Tente usar menos detalhes ou trocar o gênero da descrição.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

export default Index;
