import { Movie } from '@/types';
import { useState } from 'react';
import { FlatList, Image, Text, TouchableOpacity } from 'react-native';
import { ActivityIndicator, Button, Modal, TextInput } from 'react-native-paper';

interface AISearchModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSearch: (query: string) => Promise<Movie[]>;
}

const AISearchModal = ({ visible, onDismiss, onSearch }: AISearchModalProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const movies = await onSearch(query);
      setResults(movies);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: 'white', padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 15, fontWeight: 'bold' }}>Descreva o filme que quer assistir</Text>
      
      <TextInput
        label="Ex: Um filme sobre hackers com cenas de ação em Tóquio"
        value={query}
        onChangeText={setQuery}
        mode="outlined"
        multiline
      />
      
      <Button 
        mode="contained" 
        onPress={handleSearch}
        style={{ marginTop: 15 }}
        loading={loading}
        disabled={loading}
      >
        Buscar com IA
      </Button>

      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15 }}>
            <Image 
              source={{ uri: `https://image.tmdb.org/t/p/w200${item.poster_path}` }} 
              style={{ width: 60, height: 90, borderRadius: 5 }} 
            />
            <Text style={{ marginLeft: 10, flex: 1 }}>{item.title}</Text>
          </TouchableOpacity>
        )}
        style={{ marginTop: 20, maxHeight: 300 }}
      />
    </Modal>
  );
};

export default AISearchModal;