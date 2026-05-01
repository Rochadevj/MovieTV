import { avatars } from "@/constants/avatars";
import { useEffect, useState } from "react";
import { FlatList, Image, ImageSourcePropType, Modal, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const getRandomUsername = () => {
  const names = ["MovieLover", "CineFanatic", "PopcornKing", "FilmBuff", "SceneStealer"];
  return names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 1000);
};

const getRandomLevel = () => {
  const levels = ["Iniciante", "Intermediário", "Master Cinéfilo"];
  return levels[Math.floor(Math.random() * levels.length)];
};

const Profile = () => {
  const [username, setUsername] = useState("");
  const [level, setLevel] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(avatars.avatar1);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setUsername(getRandomUsername());
    setLevel(getRandomLevel());
  }, []);

  const handleAvatarPress = () => {
    setShowModal(true);
  };

  const handleAvatarSelect = (avatar: ImageSourcePropType) => {
    setSelectedAvatar(avatar);
    setShowModal(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-primary px-5">
      <View className="mt-8 rounded-[30px] border border-white/10 bg-white/5 px-5 py-6">
        <Text className="text-xs uppercase tracking-[2px] text-light-300">Perfil</Text>
        <Text className="mt-2 text-3xl font-black text-white">Seu espaço de cinema</Text>
        <Text className="mt-2 text-sm text-light-200">
          Personalize o avatar, acompanhe o ritmo e deixe o app com cara de catálogo premium.
        </Text>
      </View>

      <View className="flex-1 items-center justify-between py-8">
        <View className="items-center gap-4">
          <TouchableOpacity onPress={handleAvatarPress} className="rounded-full p-1 border border-cyan-300/30 bg-dark-200/80">
            <Image
              source={selectedAvatar}
              className="w-28 h-28 rounded-full"
              style={{ borderWidth: 2, borderColor: "#D6C7FF" }}
            />
          </TouchableOpacity>

          <Text className="text-white text-2xl font-bold">{username}</Text>
          <Text className="rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-accent font-semibold">{level}</Text>

          <View className="w-full rounded-[28px] border border-white/10 bg-white/5 p-5">
            <Text className="mb-4 text-center text-light-200">Estatísticas do usuário</Text>
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-white text-lg font-bold">42</Text>
                <Text className="text-light-300 text-sm">Filmes salvos</Text>
              </View>

              <View className="items-center flex-1">
                <Text className="text-white text-lg font-bold">Ação</Text>
                <Text className="text-light-300 text-sm">Gênero favorito</Text>
              </View>

              <View className="items-center flex-1">
                <Text className="text-white text-lg font-bold">132h</Text>
                <Text className="text-light-300 text-sm">Tempo assistindo</Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity className="mt-4 w-full rounded-full bg-accent px-6 py-4">
          <Text className="text-center text-secondary font-bold text-base">Editar perfil</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de seleção de avatar */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View className="flex-1 justify-center items-center bg-black/75 px-6">
          <View className="w-full rounded-[28px] border border-white/10 bg-primary p-5">
            <Text className="text-lg font-bold mb-4 text-center text-white">Escolha seu avatar</Text>
            <FlatList
              data={Object.values(avatars)}
              numColumns={2}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleAvatarSelect(item)} className="m-2">
                  <Image source={item} className="w-20 h-20 rounded-full border border-white/10" />
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setShowModal(false)} className="mt-4 rounded-full bg-white/10 px-4 py-3">
              <Text className="text-white text-center font-semibold">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;
