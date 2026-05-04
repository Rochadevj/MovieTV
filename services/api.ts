export const TMDB_CONFIG = {
  BASE_URL: "https://api.themoviedb.org/3",
  API_KEY: process.env.EXPO_PUBLIC_MOVIE_API_KEY,
};

export type MovieGenre = {
  id: number;
  name: string;
};

export type WatchProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
};

export type WatchProviders = {
  link?: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
};

export type MovieCastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
};

export type MovieCrewMember = {
  id: number;
  name: string;
  job: string;
  department: string;
};

export type MovieCredits = {
  cast: MovieCastMember[];
  crew: MovieCrewMember[];
};

type MovieVideo = {
  key?: string;
  site?: string;
  type?: string;
  official?: boolean;
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

export const fetchMovieCredits = async (
  movieId: number
): Promise<MovieCredits | null> => {
  try {
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/movie/${movieId}/credits?language=pt-BR`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao buscar elenco: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      cast: data.cast ?? [],
      crew: data.crew ?? [],
    };
  } catch (error) {
    console.error("Erro ao buscar elenco:", error);
    return null;
  }
};

export const fetchMovieCertification = async (
  movieId: number,
  country = "BR"
): Promise<string | null> => {
  try {
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/movie/${movieId}/release_dates`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao buscar classificação: ${response.statusText}`);
    }

    const data = await response.json();
    const results = data.results ?? [];
    const countryRelease = results.find(
      (item: any) => item.iso_3166_1 === country
    );
    const fallbackRelease = results.find((item: any) => item.iso_3166_1 === "US");
    const releaseDates =
      countryRelease?.release_dates ?? fallbackRelease?.release_dates ?? [];
    const certification = releaseDates.find(
      (release: any) => release.certification?.trim()
    )?.certification;

    return certification || null;
  } catch (error) {
    console.error("Erro ao buscar classificação:", error);
    return null;
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
    const videos: MovieVideo[] = data.results ?? [];
    const trailer =
      videos.find(
        (video) =>
          video.site === "YouTube" &&
          video.type === "Trailer" &&
          video.official
      ) ??
      videos.find(
        (video) => video.site === "YouTube" && video.type === "Trailer"
      );

    return trailer?.key || null;
  } catch (error) {
    console.error("Erro ao buscar trailer:", error);
    return null;
  }
};

export const fetchWatchProviders = async (
  movieId: number,
  country = "BR"
): Promise<WatchProviders | null> => {
  try {
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/movie/${movieId}/watch/providers`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao buscar plataformas: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results?.[country] ?? null;
  } catch (error) {
    console.error("Erro ao buscar plataformas:", error);
    return null;
  }
};
