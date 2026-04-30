import { Image, Pressable, TextInput, View } from "react-native";

import { icons } from "@/constants/icons";

interface Props {
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
}

const SearchBar = ({ placeholder, value, onChangeText, onPress }: Props) => {
  const content = (
    <View className="h-12 flex-row items-center rounded-2xl border border-white/10 bg-dark-200/95 px-3 shadow-md shadow-black/15">
      <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-accent/20">
        <Image
          source={icons.search}
          className="h-5 w-5"
          resizeMode="contain"
          tintColor="#D6C7FF"
        />
      </View>
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        className="flex-1 text-base text-white"
        placeholderTextColor="#A8B5DB"
        editable={!onPress || Boolean(onChangeText)}
        pointerEvents={onPress && !onChangeText ? "none" : "auto"}
      />
    </View>
  );

  if (onPress && !onChangeText) {
    return (
      <Pressable onPress={onPress} android_ripple={{ color: "rgba(255,255,255,0.08)" }}>
        {content}
      </Pressable>
    );
  }

  return (
    content
  );
};

export default SearchBar;
