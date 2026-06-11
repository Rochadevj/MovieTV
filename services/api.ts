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

export type WatchProviderOption = WatchProvider;

export type WatchProviders = {
  link?: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
};

export type MovieSortBy =
  | "popularity.desc"
  | "vote_average.desc"
  | "primary_release_date.desc";

export type FetchMovieFilters = {
  year?: number | null;
  minRating?: number | null;
  sortBy?: MovieSortBy;
  onlyStreaming?: boolean;
  providerIds?: number[];
  onlyWithTrailer?: boolean;
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
  filters,
}: {
  query?: string;
  page?: number;
  genreId?: number | null;
  filters?: FetchMovieFilters;
}): Promise<Movie[]> => {
  const normalizedQuery = query.trim();
  const year = filters?.year;
  const minRating = filters?.minRating;
  const providerIds = filters?.providerIds ?? [];
  const hasProviderFilter = providerIds.length > 0;
  const needsStreamingFilter = Boolean(filters?.onlyStreaming || hasProviderFilter);

  const params = new URLSearchParams({
    language: "pt-BR",
    page: String(page),
  });

  let endpoint = `${TMDB_CONFIG.BASE_URL}/discover/movie`;

  if (normalizedQuery) {
    params.set("query", normalizedQuery);

    if (year) {
      params.set("primary_release_year", String(year));
    }

    endpoint = `${TMDB_CONFIG.BASE_URL}/search/movie`;
  } else {
    params.set("sort_by", filters?.sortBy ?? "popularity.desc");

    if (year) {
      params.set("primary_release_year", String(year));
    }

    if (minRating) {
      params.set("vote_average.gte", String(minRating));
      params.set("vote_count.gte", "50");
    }

    if (genreId) {
      params.set("with_genres", String(genreId));
    }

    if (needsStreamingFilter) {
      params.set("watch_region", "BR");
      params.set("with_watch_monetization_types", "flatrate");
    }

    if (hasProviderFilter) {
      params.set("with_watch_providers", providerIds.join("|"));
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
  let results: Movie[] = data.results ?? [];

  if (normalizedQuery) {
    results = results.filter((movie) => {
      const matchesGenre = genreId ? movie.genre_ids?.includes(genreId) : true;
      const matchesYear = year
        ? movie.release_date?.startsWith(String(year))
        : true;
      const matchesRating = minRating
        ? movie.vote_average >= minRating
        : true;

      return matchesGenre && matchesYear && matchesRating;
    });
  }

  if (normalizedQuery && needsStreamingFilter) {
    results = await filterMoviesByStreamingAvailability(results, providerIds);
  }

  if (filters?.onlyWithTrailer) {
    results = await filterMoviesWithTrailer(results);
  }

  return results;
};

export const fetchMoviesByGenreIds = async ({
  genreIds,
  page = 1,
  minRating = 6.5,
  sortBy = "popularity.desc",
}: {
  genreIds: number[];
  page?: number;
  minRating?: number;
  sortBy?: MovieSortBy;
}): Promise<Movie[]> => {
  const params = new URLSearchParams({
    language: "pt-BR",
    page: String(page),
    sort_by: sortBy,
    "vote_average.gte": String(minRating),
    "vote_count.gte": "80",
  });

  if (genreIds.length) {
    params.set("with_genres", genreIds.join(","));
  }

  const response = await fetch(
    `${TMDB_CONFIG.BASE_URL}/discover/movie?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Erro ao buscar filmes por gêneros: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results ?? [];
};

const filterMoviesByStreamingAvailability = async (
  movies: Movie[],
  providerIds: number[]
) => {
  const checks = await Promise.all(
    movies.map(async (movie) => {
      const providers = await fetchWatchProviders(movie.id);
      const flatrateProviders = providers?.flatrate ?? [];
      const availableInStreaming = flatrateProviders.length > 0;
      const matchesProvider =
        providerIds.length === 0 ||
        flatrateProviders.some((provider) =>
          providerIds.includes(provider.provider_id)
        );

      return availableInStreaming && matchesProvider;
    })
  );

  return movies.filter((_, index) => checks[index]);
};

const filterMoviesWithTrailer = async (movies: Movie[]) => {
  const checks = await Promise.all(
    movies.map(async (movie) => Boolean(await fetchTrailer(movie.id)))
  );

  return movies.filter((_, index) => checks[index]);
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

export const fetchWatchProviderOptions = async (
  country = "BR"
): Promise<WatchProviderOption[]> => {
  const response = await fetch(
    `${TMDB_CONFIG.BASE_URL}/watch/providers/movie?language=pt-BR&watch_region=${country}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Erro ao buscar plataformas: ${response.statusText}`);
  }

  const data = await response.json();
  return (data.results ?? []).sort(
    (a: WatchProviderOption, b: WatchProviderOption) =>
      a.display_priority - b.display_priority
  );
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

export const fetchMovieRecommendations = async (
  movieId: number,
  page = 1
): Promise<Movie[]> => {
  try {
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/movie/${movieId}/recommendations?language=pt-BR&page=${page}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao buscar recomendações: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results ?? [];
  } catch (error) {
    console.error("Erro ao buscar recomendações:", error);
    return [];
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
