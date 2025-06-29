import { avatars } from "@/constants/avatars";
import { useEffect, useState } from "react";
import { FlatList, Image, Modal, Text, TouchableOpacity, View } from "react-native";
import { Avatars } from "react-native-appwrite";
import { SafeAreaView } from "react-native-safe-area-context";

const getRandomUsername = () => {
  const names = ["MovieLover", "CineFanatic", "PopcornKing", "FilmBuff", "SceneStealer"];
  return names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 1000);
};

const getRandomLevel = () => {
  const levels = ["🎬 Iniciante", "🍿 Intermediário", "🏆 Master Cinéfilo"];
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

  const handleAvatarSelect = (avatar: Avatars) => {
  setSelectedAvatar(avatar);
  setShowModal(false);
};


  return (
    <SafeAreaView className="bg-primary flex-1 px-10">
      <View className="flex justify-center items-center flex-1 gap-5">
        <TouchableOpacity onPress={handleAvatarPress}>
          <Image
            source={selectedAvatar}
            className="w-24 h-24 rounded-full"
            style={{ borderWidth: 2, borderColor: "#00BFFF" }}
          />
        </TouchableOpacity>

        <Text className="text-white text-xl font-bold">{username}</Text>
        <Text className="text-cyan-400 font-semibold">{level}</Text>

        <View className="bg-white/10 rounded-xl p-5 w-full">
          <Text className="text-gray-300 mb-2 text-center">Estatísticas do usuário</Text>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-white text-lg font-bold">42</Text>
              <Text className="text-gray-400 text-sm">Filmes salvos</Text>
            </View>

            <View className="items-center">
              <Text className="text-white text-lg font-bold">Ação</Text>
              <Text className="text-gray-400 text-sm">Gênero favorito</Text>
            </View>

            <View className="items-center">
              <Text className="text-white text-lg font-bold">132h</Text>
              <Text className="text-gray-400 text-sm">Tempo assistindo</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity className="mt-4 bg-cyan-600 px-6 py-3 rounded-xl">
          <Text className="text-white font-bold text-base">Editar Perfil</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de seleção de avatar */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View className="flex-1 justify-center items-center bg-black/70 px-6">
          <View className="bg-white rounded-xl p-4">
            <Text className="text-lg font-bold mb-4 text-center">Escolha seu avatar</Text>
            <FlatList
              data={Object.values(avatars)}
              numColumns={2}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleAvatarSelect(item)} className="m-2">
                  <Image source={item} className="w-20 h-20 rounded-full" />
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setShowModal(false)} className="mt-4 bg-cyan-600 px-4 py-2 rounded">
              <Text className="text-white text-center">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;
