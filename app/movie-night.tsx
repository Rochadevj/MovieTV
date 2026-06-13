import { Feather } from "@expo/vector-icons";
import { images } from "@/constants/images";
import {
  fetchMovieNightPicks,
  type MovieNightPick,
} from "@/services/api";
import { useRouter } from "expo-router";
import type { ComponentProps, ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FeatherIconName = ComponentProps<typeof Feather>["name"];
type DurationId = "short" | "standard" | "any";
type MoodId = "leve" | "tenso" | "romantico" | "inteligente" | "familia" | "terror";
type ProviderId = "all" | "netflix" | "prime" | "disney" | "max" | "apple" | "globoplay";

type DurationOption = {
  id: DurationId;
  label: string;
  value: number | null;
};

type MoodOption = {
  id: MoodId;
  label: string;
  icon: FeatherIconName;
  genreIds: number[];
};

type ProviderOption = {
  id: ProviderId;
  label: string;
  providerIds: number[];
};

const DURATION_OPTIONS: DurationOption[] = [
  { id: "short", label: "Até 90 min", value: 90 },
  { id: "standard", label: "Até 2h", value: 120 },
  { id: "any", label: "Tanto faz", value: null },
];

const MOOD_OPTIONS: MoodOption[] = [
  { id: "leve", label: "Leve", icon: "smile", genreIds: [35, 16, 12] },
  { id: "tenso", label: "Tenso", icon: "activity", genreIds: [53, 80, 9648] },
  { id: "romantico", label: "Romântico", icon: "heart", genreIds: [10749, 18] },
  { id: "inteligente", label: "Inteligente", icon: "cpu", genreIds: [878, 9648, 99] },
  { id: "familia", label: "Família", icon: "users", genreIds: [10751, 16, 12] },
  { id: "terror", label: "Terror", icon: "moon", genreIds: [27, 53] },
];

const STREAMING_OPTIONS: ProviderOption[] = [
  { id: "all", label: "Todos", providerIds: [] },
  { id: "netflix", label: "Netflix", providerIds: [8] },
  { id: "prime", label: "Prime", providerIds: [119] },
  { id: "disney", label: "Disney+", providerIds: [337] },
  { id: "max", label: "Max", providerIds: [384, 1899] },
  { id: "apple", label: "Apple TV+", providerIds: [350] },
  { id: "globoplay", label: "Globoplay", providerIds: [307] },
];

const RATING_OPTIONS = [6.5, 7, 7.5, 8];

const posterUrl = (path?: string | null, size = "w300") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

const getYear = (releaseDate?: string) => releaseDate?.split("-")[0] ?? "N/A";

const formatRuntime = (runtime?: number | null) => {
  if (!runtime) return "Duração livre";

  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;

  if (!hours) return `${minutes} min`;
  if (!minutes) return `${hours}h`;

  return `${hours}h ${minutes}min`;
};

const MovieNightScreen = () => {
  const router = useRouter();
  const [durationId, setDurationId] = useState<DurationId>("standard");
  const [moodId, setMoodId] = useState<MoodId>("leve");
  const [providerId, setProviderId] = useState<ProviderId>("all");
  const [minRating, setMinRating] = useState(7);
  const [results, setResults] = useState<MovieNightPick[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const selectedDuration = useMemo(
    () => DURATION_OPTIONS.find((option) => option.id === durationId) ?? DURATION_OPTIONS[1],
    [durationId]
  );
  const selectedMood = useMemo(
    () => MOOD_OPTIONS.find((option) => option.id === moodId) ?? MOOD_OPTIONS[0],
    [moodId]
  );
  const selectedProvider = useMemo(
    () =>
      STREAMING_OPTIONS.find((option) => option.id === providerId) ??
      STREAMING_OPTIONS[0],
    [providerId]
  );

  const generateMovieNight = async () => {
    try {
      setLoading(true);
      setError(null);
      setHasGenerated(true);
      setResults([]);

      const picks = await fetchMovieNightPicks({
        maxRuntime: selectedDuration.value,
        moodGenreIds: selectedMood.genreIds,
        moodLabel: selectedMood.label,
        minRating,
        providerIds: selectedProvider.providerIds,
      });

      setResults(picks);

      if (!picks.length) {
        setError("Não encontrei 3 opções fortes. Tente outro streaming ou reduza a nota.");
      }
    } catch (err) {
      console.warn("Erro ao gerar noite de filme:", err);
      setError("Não foi possível montar a noite agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary" edges={["top"]}>
      <Image
        source={images.bg}
        className="absolute h-full w-full opacity-15"
        resizeMode="cover"
      />
      <View className="absolute inset-0 bg-primary/85" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 42 }}
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

            <View className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <Text className="text-xs font-black uppercase text-light-100">
                Noite de Filme
              </Text>
            </View>
          </View>

          <View className="mt-7">
            <Text className="text-3xl font-black text-white">
              3 filmes para hoje
            </Text>
            <Text className="mt-2 text-sm leading-5 text-light-200">
              Tempo, clima, streaming e nota. O MovieTV fecha a escolha.
            </Text>
          </View>

          <View className="mt-6 rounded-[28px] border border-white/10 bg-dark-200/95 p-5">
            <ControlSection label="Tempo disponível">
              <View className="flex-row gap-2">
                {DURATION_OPTIONS.map((option) => (
                  <PillButton
                    key={option.id}
                    label={option.label}
                    active={durationId === option.id}
                    onPress={() => setDurationId(option.id)}
                  />
                ))}
              </View>
            </ControlSection>

            <ControlSection label="Clima">
              <View className="flex-row flex-wrap gap-2">
                {MOOD_OPTIONS.map((option) => (
                  <MoodButton
                    key={option.id}
                    label={option.label}
                    icon={option.icon}
                    active={moodId === option.id}
                    onPress={() => setMoodId(option.id)}
                  />
                ))}
              </View>
            </ControlSection>

            <ControlSection label="Streaming">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingRight: 18 }}
              >
                {STREAMING_OPTIONS.map((option) => (
                  <PillButton
                    key={option.id}
                    label={option.label}
                    active={providerId === option.id}
                    onPress={() => setProviderId(option.id)}
                  />
                ))}
              </ScrollView>
            </ControlSection>

            <ControlSection label="Nota mínima" last>
              <View className="flex-row gap-2">
                {RATING_OPTIONS.map((rating) => (
                  <PillButton
                    key={rating}
                    label={`${rating.toFixed(1)}+`}
                    active={minRating === rating}
                    onPress={() => setMinRating(rating)}
                  />
                ))}
              </View>
            </ControlSection>

            <TouchableOpacity
              onPress={generateMovieNight}
              activeOpacity={0.86}
              disabled={loading}
              className={`mt-5 h-14 flex-row items-center justify-center rounded-2xl ${
                loading ? "bg-white/10" : "bg-accent"
              }`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#D6C7FF" />
              ) : (
                <>
                  <Feather name="check" size={18} color="#030014" />
                  <Text className="ml-2 font-black text-primary">
                    Encontrar 3 filmes
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {error ? (
            <View className="mt-5 rounded-2xl border border-red-500/25 bg-red-500/10 p-4">
              <Text className="text-sm font-bold text-red-100">{error}</Text>
            </View>
          ) : null}

          <MovieNightResults
            loading={loading}
            hasGenerated={hasGenerated}
            results={results}
            onOpenMovie={(movieId) => router.push(`/movie/${movieId}`)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const ControlSection = ({
  label,
  children,
  last = false,
}: {
  label: string;
  children: ReactNode;
  last?: boolean;
}) => (
  <View className={`${last ? "" : "border-b border-white/10 pb-5"} mt-5`}>
    <Text className="mb-3 text-xs font-black uppercase tracking-[2px] text-light-300">
      {label}
    </Text>
    {children}
  </View>
);

const PillButton = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    className={`h-11 items-center justify-center rounded-full border px-4 ${
      active ? "border-accent bg-accent" : "border-white/10 bg-white/5"
    }`}
  >
    <Text
      className={`text-sm font-black ${active ? "text-primary" : "text-light-100"}`}
      numberOfLines={1}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const MoodButton = ({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: FeatherIconName;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.82}
    className={`h-12 min-w-[31%] flex-1 flex-row items-center justify-center rounded-2xl border px-3 ${
      active ? "border-accent bg-accent" : "border-white/10 bg-white/5"
    }`}
  >
    <Feather name={icon} size={16} color={active ? "#030014" : "#D6C7FF"} />
    <Text
      className={`ml-2 text-sm font-black ${active ? "text-primary" : "text-light-100"}`}
      numberOfLines={1}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const MovieNightResults = ({
  loading,
  hasGenerated,
  results,
  onOpenMovie,
}: {
  loading: boolean;
  hasGenerated: boolean;
  results: MovieNightPick[];
  onOpenMovie: (movieId: number) => void;
}) => {
  if (loading) {
    return (
      <View className="mt-7 h-28 items-center justify-center rounded-[28px] border border-white/10 bg-white/5">
        <ActivityIndicator size="small" color="#D6C7FF" />
      </View>
    );
  }

  if (!results.length) {
    return (
      <View className="mt-7 rounded-[28px] border border-dashed border-white/10 bg-white/5 px-5 py-8">
        <View className="h-14 w-14 items-center justify-center self-center rounded-3xl bg-accent/15">
          <Feather name={hasGenerated ? "refresh-cw" : "film"} size={23} color="#D6C7FF" />
        </View>
        <Text className="mt-4 text-center text-lg font-black text-white">
          {hasGenerated ? "Tente outra combinação" : "Pronto para decidir"}
        </Text>
      </View>
    );
  }

  return (
    <View className="mt-8">
      <View className="mb-3 flex-row items-end justify-between">
        <View>
          <Text className="text-xs uppercase tracking-[2px] text-light-300">
            Resultado
          </Text>
          <Text className="mt-1 text-xl font-black text-white">
            Escolha uma das 3
          </Text>
        </View>
        <Text className="text-xs font-bold text-light-200">Final</Text>
      </View>

      {results.map((movie, index) => (
        <MovieNightCard
          key={`movie-night-${movie.id}`}
          movie={movie}
          rank={index + 1}
          onPress={() => onOpenMovie(movie.id)}
        />
      ))}
    </View>
  );
};

const MovieNightCard = ({
  movie,
  rank,
  onPress,
}: {
  movie: MovieNightPick;
  rank: number;
  onPress: () => void;
}) => {
  const providerNames = movie.providers
    .slice(0, 2)
    .map((provider) => provider.provider_name)
    .join(" · ");

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      className="mb-3 flex-row overflow-hidden rounded-[24px] border border-white/10 bg-dark-200/95 p-3"
    >
      <Image
        source={{
          uri:
            posterUrl(movie.poster_path, "w200") ??
            "https://placehold.co/200x300/0f0d23/D6C7FF.png",
        }}
        className="h-36 w-24 rounded-2xl"
        resizeMode="cover"
      />

      <View className="ml-4 flex-1 py-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-black text-accent">
            OPÇÃO {String(rank).padStart(2, "0")}
          </Text>
          <View className="flex-row items-center">
            <Feather name="star" size={13} color="#D6C7FF" />
            <Text className="ml-1 text-xs font-black text-light-100">
              {movie.vote_average.toFixed(1)}
            </Text>
          </View>
        </View>

        <Text className="mt-2 text-lg font-black text-white" numberOfLines={2}>
          {movie.title}
        </Text>
        <Text className="mt-1 text-xs font-semibold text-light-300">
          {getYear(movie.release_date)} · {formatRuntime(movie.runtime)}
        </Text>
        <Text className="mt-3 text-sm leading-5 text-light-200" numberOfLines={2}>
          {movie.nightReason}
        </Text>
        {providerNames ? (
          <Text className="mt-2 text-xs font-bold text-light-100" numberOfLines={1}>
            {providerNames}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

export default MovieNightScreen;
