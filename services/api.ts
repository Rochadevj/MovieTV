export const TMDB_CONFIG = {
  BASE_URL: "https://api.themoviedb.org/3",
  API_KEY: process.env.EXPO_PUBLIC_MOVIE_API_KEY,
};

export type MovieGenre = {
  id: number;
  name: string;
};

const getHeaders = () => {
  if (!TMDB_CONFIG.API_KEY) {
    throw new Error(
      "EXPO_PUBLIC_MOVIE_API_KEY não configurada. Verifique seu arquivo .env"
    );
  }

  return {
    accept: "application/json",
    Authorization: `Bearer ${TMDB_CONFIG.API_KEY}`,
  };
};

export const fetchMovies = async ({
  query = "",
  page = 1,
  genreId,
}: {
  query?: string;
  page?: number;
  genreId?: number | null;
}): Promise<Movie[]> => {
  const params = new URLSearchParams({
    language: "pt-BR",
    page: String(page),
  });

  let endpoint = `${TMDB_CONFIG.BASE_URL}/discover/movie`;

  if (query.trim()) {
    params.set("query", query.trim());
    endpoint = `${TMDB_CONFIG.BASE_URL}/search/movie`;
  } else {
    params.set("sort_by", "popularity.desc");

    if (genreId) {
      params.set("with_genres", String(genreId));
    }
  }

  const response = await fetch(`${endpoint}?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar filmes: ${response.statusText}`);
  }

  const data = await response.json();
  const results = data.results ?? [];

  if (query.trim() && genreId) {
    return results.filter((movie: Movie) => movie.genre_ids?.includes(genreId));
  }

  return results;
};

export const fetchGenres = async (): Promise<MovieGenre[]> => {
  const response = await fetch(
    `${TMDB_CONFIG.BASE_URL}/genre/movie/list?language=pt-BR`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Erro ao buscar gêneros: ${response.statusText}`);
  }

  const data = await response.json();
  return data.genres ?? [];
};

export const fetchMovieDetails = async (
  movieId: string
): Promise<MovieDetails> => {
  try {
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/movie/${movieId}?language=pt-BR`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao buscar detalhes do filme: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao buscar detalhes do filme:", error);
    throw error;
  }
};

export const fetchTrailer = async (movieId: number): Promise<string | null> => {
  try {
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/movie/${movieId}/videos`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao buscar trailer: ${response.statusText}`);
    }

    const data = await response.json();

    const trailer = data.results.find(
      (video: any) => video.site === "YouTube" && video.type === "Trailer"
    );

    return trailer?.key || null;
  } catch (error) {
    console.error("Erro ao buscar trailer:", error);
    return null;
  }
};
