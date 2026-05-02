import { avatars } from "@/constants/avatars";
import { icons } from "@/constants/icons";
import { useFavorites } from "@/contexts/FavoriteContext";
import { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  ImageSourcePropType,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const USERNAME = "Cine Explorer";

const avatarOptions = Object.values(avatars);

const Profile = () => {
  const { favorites } = useFavorites();
  const [selectedAvatar, setSelectedAvatar] = useState<ImageSourcePropType>(avatars.avatar1);
  const [showModal, setShowModal] = useState(false);

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

  const handleAvatarSelect = (avatar: ImageSourcePropType) => {
    setSelectedAvatar(avatar);
    setShowModal(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-5 pt-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs uppercase tracking-[2px] text-light-300">Perfil</Text>
              <Text className="mt-1 text-3xl font-black text-white">Sua área</Text>
            </View>
            <View className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <Text className="text-xs font-semibold text-light-100">MovieTV</Text>
            </View>
          </View>

          <View className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-dark-200/95">
            <View className="absolute left-0 right-0 top-0 h-24 bg-accent/20" />
            <View className="px-5 pb-5 pt-7">
              <View className="flex-row items-end justify-between">
                <TouchableOpacity
                  onPress={() => setShowModal(true)}
                  activeOpacity={0.85}
                  className="rounded-full border-2 border-accent bg-primary p-1"
                >
                  <Image
                    source={selectedAvatar}
                    className="h-28 w-28 rounded-full bg-dark-100"
                    resizeMode="cover"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowModal(true)}
                  activeOpacity={0.85}
                  className="rounded-full border border-white/10 bg-white/10 px-4 py-2"
                >
                  <Text className="text-sm font-bold text-white">Trocar avatar</Text>
                </TouchableOpacity>
              </View>

              <Text className="mt-4 text-2xl font-black text-white">{USERNAME}</Text>
              <Text className="mt-1 text-sm text-light-200">
                {profileLevel}
              </Text>

              <View className="mt-4 flex-row flex-wrap gap-2">
                <Badge label={`${favorites.length} salvos`} />
                <Badge label={`Média ${averageRating}`} />
                <Badge label="Catálogo pessoal" />
              </View>
            </View>
          </View>

          <View className="mt-6">
            <SectionTitle eyebrow="Visão geral" title="Seu painel" />
            <View className="mt-3 flex-row gap-3">
              <StatCard value={String(favorites.length)} label="Filmes salvos" />
              <StatCard value={averageRating} label="Nota média" />
              <StatCard value={favorites.length ? "Ativo" : "Inicial"} label="Status" />
            </View>
          </View>

          <View className="mt-7">
            <SectionTitle eyebrow="Preferências" title="Atalhos rápidos" />
            <View className="mt-3 gap-3">
              <PreferenceRow
                icon={icons.save}
                title="Biblioteca"
                description="Acompanhe os filmes que você salvou para assistir depois."
              />
              <PreferenceRow
                icon={icons.star}
                title="Qualidade"
                description="Use suas notas e favoritos para encontrar melhores recomendações."
              />
              <PreferenceRow
                icon={icons.search}
                title="Descoberta"
                description="Explore gêneros e busca por IA para chegar mais rápido ao filme ideal."
              />
            </View>
          </View>

          <View className="mt-7">
            <SectionTitle eyebrow="Recentes" title="Últimos salvos" />
            {recentFavorites.length ? (
              <View className="mt-3 flex-row gap-3">
                {recentFavorites.map((movie) => (
                  <View key={movie.id} className="w-[31%] overflow-hidden rounded-2xl border border-white/10 bg-dark-200">
                    <Image
                      source={{
                        uri: movie.poster_path
                          ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                          : "https://placehold.co/300x450/0f0d23/D6C7FF.png",
                      }}
                      className="h-36 w-full"
                      resizeMode="cover"
                    />
                    <View className="px-2 py-2">
                      <Text className="text-xs font-bold text-white" numberOfLines={2}>
                        {movie.title}
                      </Text>
                    </View>
                  </View>
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
        </View>
      </ScrollView>

      <AvatarModal
        visible={showModal}
        selectedAvatar={selectedAvatar}
        onSelectAvatar={handleAvatarSelect}
        onClose={() => setShowModal(false)}
      />
    </SafeAreaView>
  );
};

const Badge = ({ label }: { label: string }) => (
  <View className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5">
    <Text className="text-xs font-bold text-accent">{label}</Text>
  </View>
);

const SectionTitle = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
  <View>
    <Text className="text-xs uppercase tracking-[2px] text-light-300">{eyebrow}</Text>
    <Text className="mt-1 text-xl font-black text-white">{title}</Text>
  </View>
);

const StatCard = ({ value, label }: { value: string; label: string }) => (
  <View className="min-h-24 flex-1 justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
    <Text className="text-2xl font-black text-white">{value}</Text>
    <Text className="text-xs font-semibold text-light-300">{label}</Text>
  </View>
);

const PreferenceRow = ({
  icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) => (
  <View className="flex-row items-center rounded-2xl border border-white/10 bg-white/5 p-4">
    <View className="h-11 w-11 items-center justify-center rounded-2xl bg-accent/15">
      <Image source={icon} className="h-5 w-5" tintColor="#D6C7FF" resizeMode="contain" />
    </View>
    <View className="ml-3 flex-1">
      <Text className="text-base font-bold text-white">{title}</Text>
      <Text className="mt-1 text-sm leading-5 text-light-200">{description}</Text>
    </View>
  </View>
);

const AvatarModal = ({
  visible,
  selectedAvatar,
  onSelectAvatar,
  onClose,
}: {
  visible: boolean;
  selectedAvatar: ImageSourcePropType;
  onSelectAvatar: (avatar: ImageSourcePropType) => void;
  onClose: () => void;
}) => (
  <Modal visible={visible} animationType="fade" transparent>
    <View className="flex-1 justify-end bg-black/75">
      <View className="rounded-t-[28px] border border-white/10 bg-primary px-5 pb-8 pt-5">
        <View className="mb-5 flex-row items-center justify-between">
          <View>
            <Text className="text-xs uppercase tracking-[2px] text-light-300">Avatar</Text>
            <Text className="mt-1 text-xl font-black text-white">Escolha seu visual</Text>
          </View>
          <TouchableOpacity onPress={onClose} className="rounded-full bg-white/10 px-4 py-2">
            <Text className="font-bold text-white">Fechar</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={avatarOptions}
          numColumns={4}
          keyExtractor={(_, index) => `avatar-${index}`}
          scrollEnabled={false}
          columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 14 }}
          renderItem={({ item }) => {
            const active = item === selectedAvatar;
            return (
              <TouchableOpacity
                onPress={() => onSelectAvatar(item)}
                activeOpacity={0.8}
                className={`rounded-2xl border p-2 ${
                  active ? "border-accent bg-accent/15" : "border-white/10 bg-white/5"
                }`}
              >
                <Image source={item} className="h-14 w-14 rounded-xl" resizeMode="cover" />
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  </Modal>
);

export default Profile;
