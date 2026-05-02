import { icons } from "@/constants/icons";
import { useFavorites } from "@/contexts/FavoriteContext";
import {
  fetchMovieDetails,
  fetchTrailer,
  fetchWatchProviders,
  type WatchProvider,
  type WatchProviders,
} from "@/services/api";
import useFetch from "@/services/usefetch";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const imageUrl = (path?: string | null, size = "w780") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

const providerLogoUrl = (path?: string | null) =>
  path ? `https://image.tmdb.org/t/p/w92${path}` : null;

const formatRuntime = (runtime?: number | null) => {
  if (!runtime) return "N/A";
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  return hours ? `${hours}h ${minutes}min` : `${minutes}min`;
};

const formatMoney = (value?: number | null) => {
  if (!value) return "N/A";
  return Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (date?: string | null) => {
  if (!date) return "N/A";
  const parsedDate = new Date(`${date}T00:00:00`);
  return Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
};

const formatStatus = (status?: string | null) => {
  const statusMap: Record<string, string> = {
    Released: "Lançado",
    "Post Production": "Pós-produção",
    "In Production": "Em produção",
    Planned: "Planejado",
    Rumored: "Rumor",
    Canceled: "Cancelado",
  };

  return status ? statusMap[status] ?? status : "N/A";
};

const getProviderGroups = (providers: WatchProviders | null) =>
  [
    { title: "Streaming", items: providers?.flatrate ?? [] },
    { title: "Alugar", items: providers?.rent ?? [] },
    { title: "Comprar", items: providers?.buy ?? [] },
  ].filter((group) => group.items.length > 0);

const Details = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [trailerLoading, setTrailerLoading] = useState(false);
  const movieIdParam = Array.isArray(id) ? id[0] : id;
  const movieId = Number(movieIdParam);
  const canFetchMovie = typeof movieIdParam === "string" && movieIdParam.length > 0;

  const { data: movie, loading, error } = useFetch(
    () => fetchMovieDetails(movieIdParam ?? ""),
    canFetchMovie
  );

  const { data: providers, loading: providersLoading } = useFetch(
    () => fetchWatchProviders(movieId),
    Number.isFinite(movieId)
  );

  const favorite = movie ? isFavorite(movie.id) : false;
  const heroImage =
    imageUrl(movie?.backdrop_path, "w780") ?? imageUrl(movie?.poster_path, "w780");
  const posterImage = imageUrl(movie?.poster_path, "w500");
  const year = movie?.release_date?.split("-")[0] ?? "N/A";

  const handlePlayPress = async () => {
    try {
      setTrailerLoading(true);
      const trailerKey = await fetchTrailer(movieId);

      if (trailerKey) {
        router.push({
          pathname: "/trailer",
          params: { videoKey: trailerKey, title: movie?.title },
        });
      } else {
        alert("Trailer não disponível");
      }
    } catch (err) {
      console.error("Erro:", err);
      alert("Erro ao buscar trailer");
    } finally {
      setTrailerLoading(false);
    }
  };

  const handleFavoritePress = () => {
    if (!movie) return;
    toggleFavorite({
      id: movie.id,
      poster_path: movie.poster_path ?? "",
      title: movie.title,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="bg-primary flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#D6C7FF" />
      </SafeAreaView>
    );
  }

  if (error || !movie) {
    return (
      <SafeAreaView className="bg-primary flex-1 items-center justify-center px-6">
        <Text className="text-center text-xl font-bold text-white">
          Não foi possível carregar o filme.
        </Text>
        <Text className="mt-2 text-center text-sm text-light-200">
          Tente voltar e abrir o filme novamente.
        </Text>
        <TouchableOpacity
          onPress={router.back}
          className="mt-6 rounded-full bg-accent px-6 py-3"
        >
          <Text className="font-bold text-primary">Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-primary">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        <View className="relative">
          <ImageBackground
            source={{
              uri: heroImage ?? "https://placehold.co/900x600/030014/D6C7FF.png",
            }}
            className="h-[520px] justify-end"
            resizeMode="cover"
          >
            <View className="absolute inset-0 bg-black/35" />
            <View className="absolute bottom-0 left-0 right-0 h-64 bg-primary/90" />

            <SafeAreaView className="absolute left-0 right-0 top-0 px-5">
              <View className="mt-2 flex-row items-center justify-between">
                <IconButton icon={icons.arrow} rotate onPress={router.back} />
                <IconButton
                  icon={icons.save}
                  active={favorite}
                  onPress={handleFavoritePress}
                />
              </View>
            </SafeAreaView>

            <View className="px-5 pb-6">
              <View className="flex-row gap-4">
                <View className="h-44 w-28 overflow-hidden rounded-2xl border border-white/15 bg-dark-200">
                  <Image
                    source={{
                      uri:
                        posterImage ??
                        "https://placehold.co/500x750/0f0d23/D6C7FF.png",
                    }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                </View>

                <View className="flex-1 justify-end">
                  <Text className="text-xs uppercase tracking-[2px] text-light-300">
                    {year}
                  </Text>
                  <Text
                    className="mt-2 text-3xl font-black text-white"
                    numberOfLines={3}
                  >
                    {movie.title}
                  </Text>
                  {movie.tagline ? (
                    <Text
                      className="mt-2 text-sm italic text-light-200"
                      numberOfLines={2}
                    >
                      {movie.tagline}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View className="mt-5 flex-row flex-wrap gap-2">
                <MetaPill label={`${movie.vote_average.toFixed(1)}/10`} icon={icons.star} />
                <MetaPill label={formatRuntime(movie.runtime)} />
                <MetaPill label={formatStatus(movie.status)} />
              </View>

              <View className="mt-5 flex-row gap-3">
                <TouchableOpacity
                  onPress={handlePlayPress}
                  activeOpacity={0.85}
                  disabled={trailerLoading}
                  className="h-14 flex-1 flex-row items-center justify-center rounded-2xl bg-accent"
                >
                  {trailerLoading ? (
                    <ActivityIndicator size="small" color="#030014" />
                  ) : (
                    <>
                      <Image
                        source={icons.play}
                        className="mr-2 h-5 w-5"
                        tintColor="#030014"
                        resizeMode="contain"
                      />
                      <Text className="font-black text-primary">Assistir trailer</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleFavoritePress}
                  activeOpacity={0.85}
                  className={`h-14 w-14 items-center justify-center rounded-2xl border ${
                    favorite ? "border-accent bg-accent" : "border-white/10 bg-white/5"
                  }`}
                >
                  <Image
                    source={icons.save}
                    className="h-5 w-5"
                    tintColor={favorite ? "#030014" : "#FFFFFF"}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </ImageBackground>
        </View>

        <View className="px-5 pt-6">
          <SectionTitle eyebrow="Sinopse" title="Sobre o filme" />
          <Text className="mt-3 text-base leading-7 text-light-100">
            {movie.overview || "Sinopse não disponível."}
          </Text>

          <View className="mt-7">
            <SectionTitle eyebrow="Streaming" title="Onde assistir" />
            <WatchProvidersSection loading={providersLoading} providers={providers} />
          </View>

          <View className="mt-7">
            <SectionTitle eyebrow="Gêneros" title="Categorias" />
            <View className="mt-3 flex-row flex-wrap gap-2">
              {movie.genres?.length ? (
                movie.genres.map((genre) => (
                  <View
                    key={genre.id}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2"
                  >
                    <Text className="text-sm font-semibold text-light-100">
                      {genre.name}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-sm text-light-200">
                  Gêneros não informados.
                </Text>
              )}
            </View>
          </View>

          <View className="mt-7">
            <SectionTitle eyebrow="Dados" title="Informações" />
            <View className="mt-3 flex-row flex-wrap gap-3">
              <InfoCard label="Lançamento" value={formatDate(movie.release_date)} />
              <InfoCard label="Duração" value={formatRuntime(movie.runtime)} />
              <InfoCard label="Avaliação" value={`${movie.vote_average.toFixed(1)}/10`} />
              <InfoCard label="Votos" value={movie.vote_count.toLocaleString("pt-BR")} />
              <InfoCard label="Orçamento" value={formatMoney(movie.budget)} />
              <InfoCard label="Receita" value={formatMoney(movie.revenue)} />
            </View>
          </View>

          <View className="mt-7">
            <SectionTitle eyebrow="Estúdio" title="Produção" />
            <Text className="mt-3 text-base leading-6 text-light-100">
              {movie.production_companies?.length
                ? movie.production_companies
                    .map((company) => company.name)
                    .join(" • ")
                : "Produtoras não informadas."}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const IconButton = ({
  icon,
  onPress,
  active = false,
  rotate = false,
}: {
  icon: any;
  onPress: () => void;
  active?: boolean;
  rotate?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    className={`h-11 w-11 items-center justify-center rounded-full border ${
      active ? "border-accent bg-accent" : "border-white/10 bg-black/45"
    }`}
  >
    <Image
      source={icon}
      className={`h-5 w-5 ${rotate ? "rotate-180" : ""}`}
      tintColor={active ? "#030014" : "#FFFFFF"}
      resizeMode="contain"
    />
  </TouchableOpacity>
);

const MetaPill = ({ label, icon }: { label: string; icon?: any }) => (
  <View className="flex-row items-center rounded-full border border-white/10 bg-black/35 px-3 py-2">
    {icon ? (
      <Image source={icon} className="mr-1.5 h-4 w-4" resizeMode="contain" />
    ) : null}
    <Text className="text-sm font-bold text-white">{label}</Text>
  </View>
);

const SectionTitle = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
  <View>
    <Text className="text-xs uppercase tracking-[2px] text-light-300">
      {eyebrow}
    </Text>
    <Text className="mt-1 text-xl font-black text-white">{title}</Text>
  </View>
);

const WatchProvidersSection = ({
  loading,
  providers,
}: {
  loading: boolean;
  providers: WatchProviders | null;
}) => {
  const groups = getProviderGroups(providers);

  if (loading) {
    return (
      <View className="mt-3 min-h-24 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <ActivityIndicator size="small" color="#D6C7FF" />
        <Text className="mt-2 text-sm text-light-200">Buscando plataformas...</Text>
      </View>
    );
  }

  if (!groups.length) {
    return (
      <View className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <Text className="text-base font-bold text-white">
          Não encontramos plataformas no Brasil.
        </Text>
        <Text className="mt-2 text-sm leading-5 text-light-200">
          A disponibilidade muda por região e pode aparecer depois.
        </Text>
      </View>
    );
  }

  return (
    <View className="mt-3 gap-4">
      {groups.map((group) => (
        <View key={group.title}>
          <Text className="mb-2 text-sm font-bold text-light-100">
            {group.title}
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {group.items.map((provider) => (
              <ProviderBadge
                key={`${group.title}-${provider.provider_id}`}
                provider={provider}
              />
            ))}
          </View>
        </View>
      ))}

      {providers?.link ? (
        <TouchableOpacity
          onPress={() => Linking.openURL(providers.link!)}
          activeOpacity={0.85}
          className="h-12 items-center justify-center rounded-2xl border border-accent/40 bg-accent/15"
        >
          <Text className="font-bold text-accent">Ver disponibilidade</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const ProviderBadge = ({ provider }: { provider: WatchProvider }) => {
  const logo = providerLogoUrl(provider.logo_path);
  const initials = provider.provider_name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View className="min-h-28 w-[30%] items-center rounded-2xl border border-white/10 bg-white/5 p-3">
      <View className="h-12 w-12 overflow-hidden rounded-xl bg-white">
        {logo ? (
          <Image
            source={{ uri: logo }}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-accent">
            <Text className="text-sm font-black text-primary">{initials}</Text>
          </View>
        )}
      </View>
      <Text
        className="mt-2 text-center text-xs font-semibold leading-4 text-light-100"
        numberOfLines={2}
      >
        {provider.provider_name}
      </Text>
    </View>
  );
};

const InfoCard = ({ label, value }: { label: string; value: string }) => (
  <View className="min-h-24 w-[47.5%] justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
    <Text className="text-xs uppercase tracking-[1px] text-light-300">
      {label}
    </Text>
    <Text className="mt-3 text-base font-bold text-white" numberOfLines={2}>
      {value}
    </Text>
  </View>
);

export default Details;
