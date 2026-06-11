import { Feather } from "@expo/vector-icons";
import { images } from "@/constants/images";
import {
  fetchGenres,
  fetchMovieRecommendations,
  fetchMovies,
  fetchMoviesByGenreIds,
  type MovieGenre,
} from "@/services/api";
import type { Movie } from "@/types";
import { useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FeatherIconName = ComponentProps<typeof Feather>["name"];
type PersonKey = "personA" | "personB";
type MatchMovie = Movie & {
  genre_ids?: number[];
  overview?: string | null;
};

type PersonTaste = {
  name: string;
  query: string;
  selectedMovie: MatchMovie | null;
  genres: number[];
  results: MatchMovie[];
  searching: boolean;
};

type ScoredMovie = MatchMovie & {
  score: number;
  reasons: string[];
};

const initialPeople: Record<PersonKey, PersonTaste> = {
  personA: {
    name: "Pessoa 1",
    query: "",
    selectedMovie: null,
    genres: [],
    results: [],
    searching: false,
  },
  personB: {
    name: "Pessoa 2",
    query: "",
    selectedMovie: null,
    genres: [],
    results: [],
    searching: false,
  },
};

const posterUrl = (path?: string | null, size = "w300") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

const getMovieYear = (releaseDate?: string) =>
  releaseDate?.split("-")[0] || "N/A";

const uniqueNumbers = (values: number[]) => Array.from(new Set(values));

const getSharedGenreIds = (first: number[], second: number[]) =>
  first.filter((genreId) => second.includes(genreId));

const getGenreNames = (genreIds: number[], genres: MovieGenre[]) =>
  genreIds
    .map((genreId) => genres.find((genre) => genre.id === genreId)?.name)
    .filter(Boolean) as string[];

const getCompatibilityPercent = (score: number, maxScore: number) => {
  if (maxScore <= 0) return 74;

  return Math.max(74, Math.min(98, Math.round(72 + (score / maxScore) * 26)));
};

const MatchScreen = () => {
  const router = useRouter();
  const [people, setPeople] = useState<Record<PersonKey, PersonTaste>>(initialPeople);
  const [genres, setGenres] = useState<MovieGenre[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [matchResults, setMatchResults] = useState<ScoredMovie[]>([]);
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  const personA = people.personA;
  const personB = people.personB;
  const canMatch =
    (personA.selectedMovie || personA.genres.length > 0) &&
    (personB.selectedMovie || personB.genres.length > 0);
  const topScore = matchResults[0]?.score ?? 0;

  const selectedSummary = useMemo(() => {
    const sharedGenres = getSharedGenreIds(personA.genres, personB.genres);
    const sharedGenreNames = getGenreNames(sharedGenres, genres);

    if (sharedGenreNames.length) {
      return `Vocês combinaram em ${sharedGenreNames.slice(0, 2).join(", ")}`;
    }

    if (personA.selectedMovie && personB.selectedMovie) {
      return "Cruzei os dois filmes e procurei pontos de encontro.";
    }

    return "Escolham filme ou gênero dos dois lados para gerar o match.";
  }, [genres, personA.genres, personA.selectedMovie, personB.genres, personB.selectedMovie]);

  const updatePerson = useCallback((key: PersonKey, updates: Partial<PersonTaste>) => {
    setPeople((current) => ({
      ...current,
      [key]: {
        ...current[key],
        ...updates,
      },
    }));
  }, []);

  const searchMoviesForPerson = useCallback(
    async (key: PersonKey, query: string, selectedTitle?: string) => {
      const normalizedQuery = query.trim();

      if (normalizedQuery.length < 2 || normalizedQuery === selectedTitle) {
        updatePerson(key, { results: [], searching: false });
        return;
      }

      try {
        updatePerson(key, { searching: true });
        const results = await fetchMovies({ query: normalizedQuery, page: 1 });
        updatePerson(key, {
          results: results
            .filter((movie) => Boolean(movie.poster_path))
            .slice(0, 6) as MatchMovie[],
        });
      } catch (error) {
        console.warn("Erro ao buscar filmes para match:", error);
        updatePerson(key, { results: [] });
      } finally {
        updatePerson(key, { searching: false });
      }
    },
    [updatePerson]
  );

  useEffect(() => {
    let active = true;

    const loadGenres = async () => {
      try {
        setGenresLoading(true);
        const result = await fetchGenres();

        if (active) {
          setGenres(result);
        }
      } catch (error) {
        console.warn("Erro ao carregar gêneros do match:", error);
      } finally {
        if (active) {
          setGenresLoading(false);
        }
      }
    };

    loadGenres();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchMoviesForPerson("personA", personA.query, personA.selectedMovie?.title);
    }, 450);

    return () => clearTimeout(timeoutId);
  }, [personA.query, personA.selectedMovie?.title, searchMoviesForPerson]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchMoviesForPerson("personB", personB.query, personB.selectedMovie?.title);
    }, 450);

    return () => clearTimeout(timeoutId);
  }, [personB.query, personB.selectedMovie?.title, searchMoviesForPerson]);

  const selectMovie = (key: PersonKey, movie: MatchMovie) => {
    updatePerson(key, {
      selectedMovie: movie,
      query: movie.title,
      results: [],
    });
    setMatchResults([]);
    setMatchError(null);
  };

  const removeMovie = (key: PersonKey) => {
    updatePerson(key, {
      selectedMovie: null,
      query: "",
      results: [],
    });
    setMatchResults([]);
  };

  const toggleGenre = (key: PersonKey, genreId: number) => {
    const selectedGenres = people[key].genres;
    const nextGenres = selectedGenres.includes(genreId)
      ? selectedGenres.filter((id) => id !== genreId)
      : [...selectedGenres, genreId].slice(0, 4);

    updatePerson(key, { genres: nextGenres });
    setMatchResults([]);
    setMatchError(null);
  };

  const clearMatch = () => {
    setPeople(initialPeople);
    setMatchResults([]);
    setMatchError(null);
  };

  const addCandidate = (
    store: Map<number, ScoredMovie>,
    movie: MatchMovie,
    score: number,
    reason: string
  ) => {
    if (!movie.poster_path) return;
    if (movie.id === personA.selectedMovie?.id || movie.id === personB.selectedMovie?.id) {
      return;
    }

    const current = store.get(movie.id);

    if (current) {
      current.score += score;
      if (!current.reasons.includes(reason)) {
        current.reasons.push(reason);
      }
      return;
    }

    store.set(movie.id, {
      ...movie,
      score,
      reasons: [reason],
    });
  };

  const runMatch = async () => {
    if (!canMatch) {
      setMatchError("Escolha pelo menos um filme ou gênero para cada pessoa.");
      return;
    }

    try {
      setMatching(true);
      setMatchError(null);

      const candidates = new Map<number, ScoredMovie>();
      const personAGenreSignals = uniqueNumbers([
        ...personA.genres,
        ...(personA.selectedMovie?.genre_ids ?? []),
      ]);
      const personBGenreSignals = uniqueNumbers([
        ...personB.genres,
        ...(personB.selectedMovie?.genre_ids ?? []),
      ]);
      const sharedGenres = getSharedGenreIds(personAGenreSignals, personBGenreSignals);
      const allSelectedGenres = uniqueNumbers([
        ...personAGenreSignals,
        ...personBGenreSignals,
      ]);

      if (personA.selectedMovie) {
        const recommendations = await fetchMovieRecommendations(personA.selectedMovie.id);
        recommendations.slice(0, 12).forEach((movie) => {
          addCandidate(
            candidates,
            movie as MatchMovie,
            28,
            `tem conexão com ${personA.selectedMovie?.title}`
          );
        });
      }

      if (personB.selectedMovie) {
        const recommendations = await fetchMovieRecommendations(personB.selectedMovie.id);
        recommendations.slice(0, 12).forEach((movie) => {
          addCandidate(
            candidates,
            movie as MatchMovie,
            28,
            `também conversa com ${personB.selectedMovie?.title}`
          );
        });
      }

      if (sharedGenres.length) {
        const genreMovies = await fetchMoviesByGenreIds({
          genreIds: sharedGenres.slice(0, 3),
          minRating: 6.4,
        });
        genreMovies.slice(0, 16).forEach((movie) => {
          addCandidate(
            candidates,
            movie as MatchMovie,
            38,
            "usa o gênero que vocês dois escolheram"
          );
        });
      } else if (allSelectedGenres.length) {
        const genreBuckets = await Promise.all(
          allSelectedGenres.slice(0, 6).map((genreId) =>
            fetchMoviesByGenreIds({ genreIds: [genreId], minRating: 6.6 })
          )
        );

        genreBuckets.flat().slice(0, 36).forEach((movie) => {
          addCandidate(
            candidates,
            movie as MatchMovie,
            16,
            "equilibra os gêneros escolhidos"
          );
        });
      }

      const scoredResults = Array.from(candidates.values())
        .map((movie) => {
          const genreIds = movie.genre_ids ?? [];
          const matchesPersonA = personAGenreSignals.some((genreId) =>
            genreIds.includes(genreId)
          );
          const matchesPersonB = personBGenreSignals.some((genreId) =>
            genreIds.includes(genreId)
          );
          const sharedGenreHits = sharedGenres.filter((genreId) =>
            genreIds.includes(genreId)
          ).length;

          let bonus = movie.vote_average * 2.8;
          const reasons = [...movie.reasons];

          if (matchesPersonA && matchesPersonB) {
            bonus += 28;
            reasons.unshift("passa pelos gostos dos dois");
          } else if (matchesPersonA || matchesPersonB) {
            bonus += 10;
          }

          if (sharedGenreHits) {
            bonus += sharedGenreHits * 12;
          }

          if ((movie.vote_average ?? 0) >= 7.5) {
            reasons.push("tem boa avaliação");
          }

          return {
            ...movie,
            score: movie.score + bonus,
            reasons: uniqueReasons(reasons).slice(0, 3),
          };
        })
        .sort((first, second) => second.score - first.score)
        .slice(0, 12);

      setMatchResults(scoredResults);

      if (!scoredResults.length) {
        setMatchError("Não encontrei uma combinação forte. Tente trocar um filme ou gênero.");
      }
    } catch (error) {
      console.warn("Erro ao gerar match:", error);
      setMatchError("Não foi possível gerar o match agora. Tente novamente.");
    } finally {
      setMatching(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary" edges={["top"]}>
      <Image
        source={images.bg}
        className="absolute h-full w-full opacity-20"
        resizeMode="cover"
      />
      <View className="absolute inset-0 bg-primary/80" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-5 pt-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={router.back}
              activeOpacity={0.85}
              className="h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5"
            >
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View className="rounded-full border border-accent/30 bg-accent/15 px-3 py-1.5">
              <Text className="text-xs font-black uppercase text-accent">
                Match Night
              </Text>
            </View>
          </View>

          <View className="mt-6 overflow-hidden rounded-[30px] border border-white/10 bg-dark-200/95 p-5">
            <View className="flex-row items-center">
              <View className="h-14 w-14 items-center justify-center rounded-3xl bg-accent">
                <Feather name="heart" size={25} color="#030014" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-3xl font-black text-white">
                  Match de filmes
                </Text>
                <Text className="mt-2 text-sm leading-5 text-light-200">
                  Cada pessoa escolhe um filme ou gênero. O MovieTV encontra um meio-termo para assistir juntos.
                </Text>
              </View>
            </View>

            <View className="mt-5 border-t border-white/10 pt-4">
              <Text className="text-xs uppercase tracking-[2px] text-light-300">
                Leitura do match
              </Text>
              <Text className="mt-2 text-base font-bold text-white">
                {selectedSummary}
              </Text>
            </View>
          </View>

          <PersonTasteCard
            color="#AB8BFF"
            icon="user"
            person={personA}
            genres={genres}
            genresLoading={genresLoading}
            onChangeQuery={(query) => updatePerson("personA", { query })}
            onSelectMovie={(movie) => selectMovie("personA", movie)}
            onRemoveMovie={() => removeMovie("personA")}
            onToggleGenre={(genreId) => toggleGenre("personA", genreId)}
          />

          <PersonTasteCard
            color="#34D399"
            icon="user-plus"
            person={personB}
            genres={genres}
            genresLoading={genresLoading}
            onChangeQuery={(query) => updatePerson("personB", { query })}
            onSelectMovie={(movie) => selectMovie("personB", movie)}
            onRemoveMovie={() => removeMovie("personB")}
            onToggleGenre={(genreId) => toggleGenre("personB", genreId)}
          />

          {matchError ? (
            <View className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 p-4">
              <Text className="text-sm font-bold text-red-100">{matchError}</Text>
            </View>
          ) : null}

          <View className="mt-5 flex-row gap-3">
            <TouchableOpacity
              onPress={runMatch}
              activeOpacity={0.86}
              disabled={matching}
              className={`h-14 flex-1 flex-row items-center justify-center rounded-2xl ${
                matching ? "bg-white/10" : "bg-accent"
              }`}
            >
              {matching ? (
                <ActivityIndicator size="small" color="#D6C7FF" />
              ) : (
                <>
                  <Feather name="zap" size={18} color="#030014" />
                  <Text className="ml-2 font-black text-primary">
                    Gerar match
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={clearMatch}
              activeOpacity={0.86}
              className="h-14 w-28 items-center justify-center rounded-2xl border border-white/10 bg-white/5"
            >
              <Text className="font-bold text-white">Limpar</Text>
            </TouchableOpacity>
          </View>

          <MatchResults
            results={matchResults}
            maxScore={topScore}
            onOpenMovie={(movieId) => router.push(`/movie/${movieId}`)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const uniqueReasons = (reasons: string[]) =>
  reasons.filter((reason, index) => reasons.indexOf(reason) === index);

const PersonTasteCard = ({
  color,
  icon,
  person,
  genres,
  genresLoading,
  onChangeQuery,
  onSelectMovie,
  onRemoveMovie,
  onToggleGenre,
}: {
  color: string;
  icon: FeatherIconName;
  person: PersonTaste;
  genres: MovieGenre[];
  genresLoading: boolean;
  onChangeQuery: (query: string) => void;
  onSelectMovie: (movie: MatchMovie) => void;
  onRemoveMovie: () => void;
  onToggleGenre: (genreId: number) => void;
}) => (
  <View className="mt-5 rounded-[28px] border border-white/10 bg-dark-200/95 p-4">
    <View className="flex-row items-center">
      <View
        className="h-11 w-11 items-center justify-center rounded-2xl"
        style={{ backgroundColor: color }}
      >
        <Feather name={icon} size={20} color="#030014" />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-lg font-black text-white">{person.name}</Text>
        <Text className="mt-1 text-xs font-semibold text-light-300">
          Escolha filme, gênero ou os dois
        </Text>
      </View>
    </View>

    <View className="mt-4">
      <Text className="mb-2 text-sm font-bold text-light-100">Filme referência</Text>
      <View className="h-14 flex-row items-center rounded-2xl border border-white/10 bg-primary px-3">
        <Feather name="search" size={18} color="#A8B5DB" />
        <TextInput
          value={person.query}
          onChangeText={onChangeQuery}
          placeholder="Ex: Interestelar, La La Land, Batman..."
          placeholderTextColor="#A8B5DB"
          className="ml-2 flex-1 text-base font-semibold text-white"
          returnKeyType="search"
        />
        {person.searching ? (
          <ActivityIndicator size="small" color="#D6C7FF" />
        ) : null}
      </View>
    </View>

    {person.selectedMovie ? (
      <SelectedMovie
        movie={person.selectedMovie}
        color={color}
        onRemove={onRemoveMovie}
      />
    ) : person.results.length ? (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-3"
        contentContainerStyle={{ gap: 10, paddingRight: 20 }}
      >
        {person.results.map((movie) => (
          <MovieSearchChip
            key={`${person.name}-${movie.id}`}
            movie={movie}
            onPress={() => onSelectMovie(movie)}
          />
        ))}
      </ScrollView>
    ) : null}

    <View className="mt-5">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-sm font-bold text-light-100">Gêneros</Text>
        <Text className="text-xs font-semibold text-light-300">
          {person.genres.length}/4
        </Text>
      </View>

      {genresLoading ? (
        <View className="h-11 justify-center">
          <ActivityIndicator size="small" color="#D6C7FF" />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingRight: 20 }}
        >
          {genres.map((genre) => (
            <GenreMatchChip
              key={`${person.name}-${genre.id}`}
              label={genre.name}
              active={person.genres.includes(genre.id)}
              color={color}
              onPress={() => onToggleGenre(genre.id)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  </View>
);

const SelectedMovie = ({
  movie,
  color,
  onRemove,
}: {
  movie: MatchMovie;
  color: string;
  onRemove: () => void;
}) => (
  <View className="mt-3 flex-row items-center rounded-2xl border border-white/10 bg-white/5 p-3">
    <Image
      source={{
        uri:
          posterUrl(movie.poster_path, "w200") ??
          "https://placehold.co/200x300/0f0d23/D6C7FF.png",
      }}
      className="h-20 w-14 rounded-xl"
      resizeMode="cover"
    />
    <View className="ml-3 flex-1">
      <Text className="text-base font-black text-white" numberOfLines={2}>
        {movie.title}
      </Text>
      <Text className="mt-1 text-xs font-semibold text-light-300">
        {getMovieYear(movie.release_date)} • Nota {movie.vote_average.toFixed(1)}
      </Text>
      <View
        className="mt-2 self-start rounded-full px-3 py-1"
        style={{ backgroundColor: `${color}26` }}
      >
        <Text className="text-xs font-black" style={{ color }}>
          Selecionado
        </Text>
      </View>
    </View>
    <TouchableOpacity
      onPress={onRemove}
      activeOpacity={0.85}
      className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
    >
      <Feather name="x" size={17} color="#FFFFFF" />
    </TouchableOpacity>
  </View>
);

const MovieSearchChip = ({
  movie,
  onPress,
}: {
  movie: MatchMovie;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.84}
    className="w-28 overflow-hidden rounded-2xl border border-white/10 bg-white/5"
  >
    <Image
      source={{
        uri:
          posterUrl(movie.poster_path, "w200") ??
          "https://placehold.co/200x300/0f0d23/D6C7FF.png",
      }}
      className="h-36 w-full"
      resizeMode="cover"
    />
    <View className="p-2">
      <Text className="text-xs font-bold leading-4 text-white" numberOfLines={2}>
        {movie.title}
      </Text>
    </View>
  </TouchableOpacity>
);

const GenreMatchChip = ({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.78}
    className="h-11 justify-center rounded-full border px-4"
    style={{
      backgroundColor: active ? color : "rgba(255,255,255,0.05)",
      borderColor: active ? color : "rgba(255,255,255,0.1)",
    }}
  >
    <Text
      className="text-sm font-bold"
      style={{ color: active ? "#030014" : "#D6C7FF" }}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const MatchResults = ({
  results,
  maxScore,
  onOpenMovie,
}: {
  results: ScoredMovie[];
  maxScore: number;
  onOpenMovie: (movieId: number) => void;
}) => {
  if (!results.length) {
    return (
      <View className="mt-7 rounded-[28px] border border-dashed border-white/10 bg-white/5 px-5 py-8">
        <View className="h-14 w-14 items-center justify-center self-center rounded-3xl bg-accent/15">
          <Feather name="users" size={24} color="#D6C7FF" />
        </View>
        <Text className="mt-4 text-center text-lg font-black text-white">
          O match aparece aqui
        </Text>
        <Text className="mt-2 text-center text-sm leading-5 text-light-200">
          Depois das escolhas, o app mostra opções que equilibram os dois gostos.
        </Text>
      </View>
    );
  }

  const bestMatch = results[0];
  const otherMatches = results.slice(1);

  return (
    <View className="mt-7">
      <View className="mb-3 flex-row items-end justify-between">
        <View>
          <Text className="text-xs uppercase tracking-[2px] text-light-300">
            Resultado
          </Text>
          <Text className="mt-1 text-xl font-black text-white">
            Melhor match
          </Text>
        </View>
        <Text className="text-xs font-bold text-light-200">
          {results.length} opções
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => onOpenMovie(bestMatch.id)}
        activeOpacity={0.88}
        className="overflow-hidden rounded-[28px] border border-accent/25 bg-dark-200"
      >
        <Image
          source={{
            uri:
              posterUrl(bestMatch.poster_path, "w500") ??
              "https://placehold.co/500x750/0f0d23/D6C7FF.png",
          }}
          className="h-80 w-full"
          resizeMode="cover"
        />
        <View className="absolute inset-x-0 bottom-0 bg-primary/90 p-5">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="rounded-full bg-accent px-3 py-1.5">
              <Text className="text-xs font-black text-primary">
                {getCompatibilityPercent(bestMatch.score, maxScore)}% match
              </Text>
            </View>
            <Text className="text-xs font-bold text-light-200">
              Nota {bestMatch.vote_average.toFixed(1)}
            </Text>
          </View>
          <Text className="text-2xl font-black text-white" numberOfLines={2}>
            {bestMatch.title}
          </Text>
          <Text className="mt-2 text-sm leading-5 text-light-200" numberOfLines={2}>
            {bestMatch.reasons.join(" • ")}
          </Text>
        </View>
      </TouchableOpacity>

      {otherMatches.length ? (
        <View className="mt-6">
          <Text className="mb-3 text-lg font-black text-white">
            Outras combinações
          </Text>
          <View className="flex-row flex-wrap justify-between">
            {otherMatches.map((movie) => (
              <CompactMatchCard
                key={`match-${movie.id}`}
                movie={movie}
                percent={getCompatibilityPercent(movie.score, maxScore)}
                onPress={() => onOpenMovie(movie.id)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
};

const CompactMatchCard = ({
  movie,
  percent,
  onPress,
}: {
  movie: ScoredMovie;
  percent: number;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    className="mb-4 w-[48%] overflow-hidden rounded-3xl border border-white/10 bg-dark-200"
  >
    <Image
      source={{
        uri:
          posterUrl(movie.poster_path, "w300") ??
          "https://placehold.co/300x450/0f0d23/D6C7FF.png",
      }}
      className="h-64 w-full"
      resizeMode="cover"
    />
    <View className="p-3">
      <View className="mb-2 self-start rounded-full bg-accent/15 px-2.5 py-1">
        <Text className="text-[10px] font-black text-accent">{percent}% match</Text>
      </View>
      <Text className="text-sm font-black text-white" numberOfLines={2}>
        {movie.title}
      </Text>
      <Text className="mt-2 text-xs leading-4 text-light-200" numberOfLines={2}>
        {movie.reasons[0] ?? "combina os gostos escolhidos"}
      </Text>
    </View>
  </TouchableOpacity>
);

export default MatchScreen;
