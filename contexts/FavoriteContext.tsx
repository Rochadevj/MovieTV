// contexts/FavoriteContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Movie = {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
};

type FavoriteContextType = {
  favorites: Movie[];
  toggleFavorite: (movie: Movie) => void;
  isFavorite: (movieId: number) => boolean;
};

const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);

export const FavoriteProvider = ({ children }: { children: React.ReactNode }) => {
  const [favorites, setFavorites] = useState<Movie[]>([]);


  useEffect(() => {
    const loadFavorites = async () => {
      const saved = await AsyncStorage.getItem('@favorites');
      if (saved) setFavorites(JSON.parse(saved));
    };
    loadFavorites();
  }, []);

 
  useEffect(() => {
    AsyncStorage.setItem('@favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (movie: Movie) => {
    setFavorites(prev => 
      prev.some(m => m.id === movie.id) 
        ? prev.filter(m => m.id !== movie.id) 
        : [...prev, movie]
    );
  };

  const isFavorite = (movieId: number) => {
    return favorites.some(movie => movie.id === movieId);
  };

  return (
    <FavoriteContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoriteContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoriteContext);
  if (!context) throw new Error('useFavorites must be used within FavoriteProvider');
  return context;
};