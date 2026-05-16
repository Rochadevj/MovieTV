import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { images } from "@/constants/images";
import { useFavorites } from "@/contexts/FavoriteContext";
import { fetchMovieRecommendations } from "@/services/api";
import type { Movie } from "@/types";
import { useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

type AvatarTheme = {
  id: string;
  label: string;
  icon: FeatherIconName;
  backgroundColor: string;
  foregroundColor: string;
  accentColor: string;
};

type SavedProfile = {
  displayName: string;
  avatarId: string;
};

const PROFILE_STORAGE_KEY = "@movietv_profile";
const DEFAULT_PROFILE_NAME = "Cine Explorer";

const AVATAR_THEMES: AvatarTheme[] = [
  {
    id: "premiere",
    label: "Premiere",
    icon: "film",
    backgroundColor: "#2D1B69",
    foregroundColor: "#F5F0FF",
    accentColor: "#AB8BFF",
  },
  {
    id: "critic",
    label: "Crítico",
    icon: "star",
    backgroundColor: "#172554",
    foregroundColor: "#DBEAFE",
    accentColor: "#60A5FA",
  },
  {
    id: "noir",
    label: "Noir",
    icon: "moon",
    backgroundColor: "#111827",
    foregroundColor: "#E5E7EB",
    accentColor: "#94A3B8",
  },
  {
    id: "festival",
    label: "Festival",
    icon: "award",
    backgroundColor: "#4A1D1F",
    foregroundColor: "#FFE4E6",
    accentColor: "#FB7185",
  },
  {
    id: "explorer",
    label: "Explorer",
    icon: "compass",
    backgroundColor: "#064E3B",
    foregroundColor: "#D1FAE5",
    accentColor: "#34D399",
  },
  {
    id: "marathon",
    label: "Maratona",
    icon: "zap",
    backgroundColor: "#451A03",
    foregroundColor: "#FFEDD5",
    accentColor: "#FB923C",
  },
  {
    id: "classic",
    label: "Clássico",
    icon: "camera",
    backgroundColor: "#3F3F46",
    foregroundColor: "#FAFAFA",
    accentColor: "#D4D4D8",
  },
  {
    id: "favorite",
    label: "Favorito",
    icon: "heart",
    backgroundColor: "#4C0519",
    foregroundColor: "#FFE4E6",
    accentColor: "#F472B6",
  },
];

const posterUrl = (path?: string | null, size = "w300") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

const getAvatarTheme = (avatarId: string) =>
  AVATAR_THEMES.find((theme) => theme.id === avatarId) ?? AVATAR_THEMES[0];

const getInitials = (name: string) => {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "CE";
};

const Profile = () => {
  const { favorites } = useFavorites();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(DEFAULT_PROFILE_NAME);
  const [selectedAvatarId, setSelectedAvatarId] = useState(AVATAR_THEMES[0].id);
  const [draftName, setDraftName] = useState(DEFAULT_PROFILE_NAME);
  const [draftAvatarId, setDraftAvatarId] = useState(AVATAR_THEMES[0].id);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const selectedAvatar = getAvatarTheme(selectedAvatarId);
  const draftAvatar = getAvatarTheme(draftAvatarId);

  const profileLevel = useMemo(() => {
    if (favorites.length >= 15) return "Curador cinéfilo";
    if (favorites.length >= 6) return "Explorador de cinema";
    return "Novo espectador";
  }, [favorites.length]);

  const averageRating = useMemo(() => {
    if (!favorites.length) return "0.0";
    const total = favorites.reduce((sum, movie) => sum + movie.vote_average, 0);
    return (total / favorites.length).toFixed(1);
  }, [favorites]);

  const recentFavorites = favorites.slice(-3).reverse();
  const recommendationSeed = favorites.at(-1) ?? null;

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const savedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (!active || !savedProfile) return;

        const parsed = JSON.parse(savedProfile) as Partial<SavedProfile>;
        const savedName =
          typeof parsed.displayName === "string" && parsed.displayName.trim()
            ? parsed.displayName.trim()
            : DEFAULT_PROFILE_NAME;
        const savedAvatarId =
          typeof parsed.avatarId === "string" ? parsed.avatarId : AVATAR_THEMES[0].id;

        setDisplayName(savedName);
        setDraftName(savedName);
        setSelectedAvatarId(getAvatarTheme(savedAvatarId).id);
        setDraftAvatarId(getAvatarTheme(savedAvatarId).id);
      } catch (error) {
        console.warn("Falha ao carregar perfil salvo:", error);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadRecommendations = async () => {
      if (!recommendationSeed) {
        setRecommendations([]);
        setRecommendationsLoading(false);
        return;
      }

      try {
        setRecommendationsLoading(true);
        const savedIds = new Set(favorites.map((movie) => movie.id));
        const results = await fetchMovieRecommendations(recommendationSeed.id);

        if (!active) return;

        setRecommendations(
          results
            .filter((movie) => !savedIds.has(movie.id))
            .filter((movie) => Boolean(movie.poster_path))
            .slice(0, 12)
        );
      } finally {
        if (active) {
          setRecommendationsLoading(false);
        }
      }
    };

    loadRecommendations();

    return () => {
      active = false;
    };
  }, [favorites, recommendationSeed]);

  const openProfileModal = () => {
    setDraftName(displayName);
    setDraftAvatarId(selectedAvatarId);
    setShowProfileModal(true);
  };

  const saveProfile = () => {
    const nextName = draftName.trim() || DEFAULT_PROFILE_NAME;
    const nextAvatarId = getAvatarTheme(draftAvatarId).id;

    setDisplayName(nextName);
    setSelectedAvatarId(nextAvatarId);
    setDraftName(nextName);
    setDraftAvatarId(nextAvatarId);
    setShowProfileModal(false);

    AsyncStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({ displayName: nextName, avatarId: nextAvatarId })
    ).catch((error) => {
      console.warn("Falha ao salvar perfil:", error);
    });
  };

  const openLibrary = () => {
    router.push("/save");
  };

  const openQualitySearch = () => {
    router.push({
      pathname: "/search",
      params: {
        minRating: "8",
        sortBy: "vote_average.desc",
        expandFilters: "1",
        preset: Date.now().toString(),
      },
    });
  };

  const openAiDiscovery = () => {
    router.push({
      pathname: "/",
      params: { openAi: Date.now().toString() },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <Image
        source={images.bg}
        className="absolute h-full w-full opacity-20"
        resizeMode="cover"
      />
      <View className="absolute inset-0 bg-primary/80" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="px-5 pt-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs uppercase tracking-[2px] text-light-300">
                Perfil
              </Text>
              <Text className="mt-1 text-3xl font-black text-white">
                Sua área
              </Text>
            </View>
            <View className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <Text className="text-xs font-semibold text-light-100">MovieTV</Text>
            </View>
          </View>

          <View className="mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-dark-200/95 p-5">
            <View className="absolute left-0 right-0 top-0 h-px bg-white/15" />
            <View className="flex-row items-center">
              <TouchableOpacity onPress={openProfileModal} activeOpacity={0.85}>
                <ProfileAvatar
                  name={displayName}
                  theme={selectedAvatar}
                  size="large"
                />
              </TouchableOpacity>

              <View className="ml-4 flex-1">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-2xl font-black text-white" numberOfLines={2}>
                      {displayName}
                    </Text>
                    <Text className="mt-1 text-sm font-semibold text-light-200">
                      {profileLevel}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={openProfileModal}
                    activeOpacity={0.85}
                    className="h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10"
                  >
                    <Feather name="edit-3" size={17} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={openProfileModal}
                  activeOpacity={0.85}
                  className="mt-4 self-start rounded-full border border-accent/30 bg-accent/15 px-4 py-2"
                >
                  <Text className="text-sm font-bold text-accent">
                    Personalizar perfil
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="mt-5 flex-row gap-3">
              <StatCard value={String(favorites.length)} label="Salvos" />
              <StatCard value={averageRating} label="Nota média" />
              <StatCard value={favorites.length ? "Ativo" : "Inicial"} label="Status" />
            </View>
          </View>

          <View className="mt-7">
            <SectionTitle eyebrow="Preferências" title="Atalhos rápidos" />
            <View className="mt-3 gap-3">
              <PreferenceRow
                icon="bookmark"
                title="Biblioteca"
                description="Abrir seus filmes salvos para assistir depois."
                onPress={openLibrary}
              />
              <PreferenceRow
                icon="star"
                title="Qualidade"
                description="Buscar filmes bem avaliados com filtros prontos."
                onPress={openQualitySearch}
              />
              <PreferenceRow
                icon="search"
                title="Descoberta"
                description="Abrir a busca por IA para encontrar filmes por clima."
                onPress={openAiDiscovery}
              />
            </View>
          </View>

          <View className="mt-7">
            <SectionTitle eyebrow="Recentes" title="Últimos salvos" />
            {recentFavorites.length ? (
              <View className="mt-3 flex-row gap-3">
                {recentFavorites.map((movie) => (
                  <TouchableOpacity
                    key={movie.id}
                    onPress={() => router.push(`/movie/${movie.id}`)}
                    activeOpacity={0.85}
                    className="w-[31%] overflow-hidden rounded-2xl border border-white/10 bg-dark-200"
                  >
                    <Image
                      source={{
                        uri:
                          posterUrl(movie.poster_path) ??
                          "https://placehold.co/300x450/0f0d23/D6C7FF.png",
                      }}
                      className="h-36 w-full"
                      resizeMode="cover"
                    />
                    <View className="px-2 py-2">
                      <Text className="text-xs font-bold text-white" numberOfLines={2}>
                        {movie.title}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View className="mt-3 rounded-2xl border border-dashed border-white/10 bg-white/5 px-5 py-6">
                <Text className="text-center text-sm text-light-200">
                  Seus filmes salvos vão aparecer aqui.
                </Text>
              </View>
            )}
          </View>

          <RecommendationSection
            seedTitle={recommendationSeed?.title}
            recommendations={recommendations}
            loading={recommendationsLoading}
            onOpenMovie={(movieId) => router.push(`/movie/${movieId}`)}
          />
        </View>
      </ScrollView>

      <ProfileEditorModal
        visible={showProfileModal}
        name={draftName}
        avatarId={draftAvatarId}
        previewTheme={draftAvatar}
        onChangeName={setDraftName}
        onSelectAvatar={setDraftAvatarId}
        onSave={saveProfile}
        onClose={() => setShowProfileModal(false)}
      />
    </SafeAreaView>
  );
};

const ProfileAvatar = ({
  name,
  theme,
  size = "medium",
  selected = false,
}: {
  name: string;
  theme: AvatarTheme;
  size?: "large" | "medium";
  selected?: boolean;
}) => {
  const isLarge = size === "large";

  return (
    <View
      className={`items-center justify-center overflow-hidden border ${
        isLarge ? "h-28 w-28 rounded-[30px]" : "h-20 w-20 rounded-3xl"
      } ${selected ? "border-accent" : "border-white/10"}`}
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <View
        className={`absolute right-2 top-2 items-center justify-center rounded-full ${
          isLarge ? "h-8 w-8" : "h-7 w-7"
        }`}
        style={{ backgroundColor: theme.accentColor }}
      >
        <Feather name={theme.icon} size={isLarge ? 16 : 14} color="#030014" />
      </View>
      <Text
        className={`${isLarge ? "text-3xl" : "text-2xl"} font-black`}
        style={{ color: theme.foregroundColor }}
      >
        {getInitials(name)}
      </Text>
      {isLarge ? (
        <Text
          className="mt-1 text-[10px] font-black uppercase tracking-[1px]"
          style={{ color: theme.foregroundColor }}
        >
          {theme.label}
        </Text>
      ) : null}
    </View>
  );
};

const SectionTitle = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
  <View>
    <Text className="text-xs uppercase tracking-[2px] text-light-300">{eyebrow}</Text>
    <Text className="mt-1 text-xl font-black text-white">{title}</Text>
  </View>
);

const StatCard = ({ value, label }: { value: string; label: string }) => (
  <View className="min-h-20 flex-1 justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
    <Text className="text-xl font-black text-white">{value}</Text>
    <Text className="mt-2 text-xs font-semibold text-light-300">{label}</Text>
  </View>
);

const PreferenceRow = ({
  icon,
  title,
  description,
  onPress,
}: {
  icon: FeatherIconName;
  title: string;
  description: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.84}
    className="flex-row items-center rounded-2xl border border-white/10 bg-white/5 p-4"
  >
    <View className="h-11 w-11 items-center justify-center rounded-2xl bg-accent/15">
      <Feather name={icon} size={20} color="#D6C7FF" />
    </View>
    <View className="ml-3 flex-1">
      <Text className="text-base font-bold text-white">{title}</Text>
      <Text className="mt-1 text-sm leading-5 text-light-200">{description}</Text>
    </View>
    <Feather name="chevron-right" size={21} color="#A8B5DB" />
  </TouchableOpacity>
);

const RecommendationSection = ({
  seedTitle,
  recommendations,
  loading,
  onOpenMovie,
}: {
  seedTitle?: string;
  recommendations: Movie[];
  loading: boolean;
  onOpenMovie: (movieId: number) => void;
}) => {
  if (!seedTitle) return null;

  return (
    <View className="mt-7">
      <SectionTitle eyebrow="Recomendações" title="Para você" />
      <Text className="mt-2 text-sm leading-5 text-light-200">
        Porque você salvou{" "}
        <Text className="font-bold text-accent">{seedTitle}</Text>
      </Text>

      {loading ? (
        <View className="mt-3 h-36 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <ActivityIndicator size="small" color="#D6C7FF" />
          <Text className="mt-2 text-sm font-semibold text-light-200">
            Buscando filmes parecidos...
          </Text>
        </View>
      ) : recommendations.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ gap: 12, paddingRight: 20 }}
        >
          {recommendations.map((movie) => (
            <RecommendationCard
              key={`recommendation-${movie.id}`}
              movie={movie}
              onPress={() => onOpenMovie(movie.id)}
            />
          ))}
        </ScrollView>
      ) : (
        <View className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-6">
          <Text className="text-center text-sm text-light-200">
            Ainda não encontramos recomendações para esse filme.
          </Text>
        </View>
      )}
    </View>
  );
};

const RecommendationCard = ({
  movie,
  onPress,
}: {
  movie: Movie;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    className="w-32 overflow-hidden rounded-2xl border border-white/10 bg-dark-200"
  >
    <Image
      source={{
        uri:
          posterUrl(movie.poster_path) ??
          "https://placehold.co/300x450/0f0d23/D6C7FF.png",
      }}
      className="h-48 w-full"
      resizeMode="cover"
    />
    <View className="min-h-20 px-3 py-3">
      <Text className="text-sm font-bold text-white" numberOfLines={2}>
        {movie.title}
      </Text>
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-xs font-semibold text-light-300">
          {movie.release_date?.split("-")[0] ?? "N/A"}
        </Text>
        <Text className="text-xs font-bold text-accent">
          {movie.vote_average.toFixed(1)}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

const ProfileEditorModal = ({
  visible,
  name,
  avatarId,
  previewTheme,
  onChangeName,
  onSelectAvatar,
  onSave,
  onClose,
}: {
  visible: boolean;
  name: string;
  avatarId: string;
  previewTheme: AvatarTheme;
  onChangeName: (value: string) => void;
  onSelectAvatar: (avatarId: string) => void;
  onSave: () => void;
  onClose: () => void;
}) => (
  <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
    <View className="flex-1 justify-end bg-black/75">
      <View className="max-h-[88%] rounded-t-[28px] border border-white/10 bg-primary px-5 pb-8 pt-5">
        <View className="mb-5 h-1.5 w-12 self-center rounded-full bg-white/20" />
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-xs uppercase tracking-[2px] text-light-300">
                Perfil
              </Text>
              <Text className="mt-1 text-2xl font-black text-white">
                Personalizar
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.85}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
            >
              <Feather name="x" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View className="mt-5 items-center">
            <ProfileAvatar name={name} theme={previewTheme} size="large" selected />
          </View>

          <View className="mt-6">
            <Text className="mb-2 text-sm font-bold text-light-100">Nome</Text>
            <TextInput
              value={name}
              onChangeText={onChangeName}
              placeholder="Seu nome no MovieTV"
              placeholderTextColor="#A8B5DB"
              maxLength={28}
              className="h-14 rounded-2xl border border-white/10 bg-dark-200 px-4 text-base font-bold text-white"
            />
          </View>

          <View className="mt-6">
            <Text className="mb-3 text-sm font-bold text-light-100">Avatar</Text>
            <View className="flex-row flex-wrap justify-between">
              {AVATAR_THEMES.map((theme) => {
                const active = theme.id === avatarId;

                return (
                  <TouchableOpacity
                    key={theme.id}
                    onPress={() => onSelectAvatar(theme.id)}
                    activeOpacity={0.84}
                    className={`mb-3 w-[48%] flex-row items-center rounded-2xl border p-3 ${
                      active
                        ? "border-accent bg-accent/15"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <ProfileAvatar name={name} theme={theme} selected={active} />
                    <View className="ml-3 flex-1">
                      <Text className="text-sm font-black text-white">
                        {theme.label}
                      </Text>
                      <Text className="mt-1 text-xs font-semibold text-light-300">
                        {active ? "Selecionado" : "Toque para usar"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="mt-3 flex-row gap-3">
            <TouchableOpacity
              onPress={onSave}
              activeOpacity={0.86}
              className="h-14 flex-1 items-center justify-center rounded-2xl bg-accent"
            >
              <Text className="font-black text-primary">Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.86}
              className="h-14 w-28 items-center justify-center rounded-2xl border border-white/10 bg-white/5"
            >
              <Text className="font-bold text-white">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  </Modal>
);

export default Profile;
