import { fetchGenres, type MovieGenre } from "@/services/api";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

type GenreFilterProps = {
  selectedGenreId: number | null;
  onSelectGenre: (genreId: number | null) => void;
};

const GenreFilter = ({ selectedGenreId, onSelectGenre }: GenreFilterProps) => {
  const [genres, setGenres] = useState<MovieGenre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const result = await fetchGenres();
        setGenres(result);
      } catch (error) {
        console.error("Erro ao carregar gêneros:", error);
      } finally {
        setLoading(false);
      }
    };

    loadGenres();
  }, []);

  if (loading) {
    return (
      <View className="h-11 justify-center">
        <ActivityIndicator size="small" color="#D6C7FF" />
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingRight: 20 }}
    >
      <GenreChip
        label="Todos"
        active={selectedGenreId === null}
        onPress={() => onSelectGenre(null)}
      />

      {genres.map((genre) => (
        <GenreChip
          key={genre.id}
          label={genre.name}
          active={selectedGenreId === genre.id}
          onPress={() => onSelectGenre(genre.id)}
        />
      ))}
    </ScrollView>
  );
};

const GenreChip = ({
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
    activeOpacity={0.75}
    className={`h-10 justify-center rounded-full border px-4 ${
      active
        ? "border-accent bg-accent"
        : "border-white/10 bg-dark-200/90"
    }`}
  >
    <Text
      className={`text-sm font-semibold ${
        active ? "text-primary" : "text-light-100"
      }`}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export default GenreFilter;
