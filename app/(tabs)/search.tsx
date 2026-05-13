import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import GenreFilter from "@/components/GenreFilter";
import MovieDisplayCard from "@/components/MovieCard";
import SearchBar from "@/components/SearchBar";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import {
  fetchMovies,
  fetchWatchProviderOptions,
  type FetchMovieFilters,
  type MovieSortBy,
  type WatchProviderOption,
} from "@/services/api";
import { updateSearchCount } from "@/services/appwrite";

const RECENT_SEARCHES_KEY = "@movietv_recent_searches";
const MAX_RECENT_SEARCHES = 8;
const CURRENT_YEAR = new Date().getFullYear();

const SORT_OPTIONS: { label: string; value: MovieSortBy }[] = [
  { label: "Populares", value: "popularity.desc" },
  { label: "Melhor nota", value: "vote_average.desc" },
  { label: "Lançamentos", value: "primary_release_date.desc" },
];

const RATING_OPTIONS = [
  { label: "6+", value: 6 },
  { label: "7+", value: 7 },
  { label: "8+", value: 8 },
  { label: "9+", value: 9 },
];

const providerLogoUrl = (path?: string | null) =>
  path ? `https://image.tmdb.org/t/p/w92${path}` : null;

const trackSearch = (query: string, movie: Movie) => {
  updateSearchCount(query, movie);
};

const normalizeRecentSearches = (query: string, searches: string[]) => {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) return searches;

  return [
    normalizedQuery,
    ...searches.filter(
      (item) => item.toLowerCase() !== normalizedQuery.toLowerCase()
    ),
  ].slice(0, MAX_RECENT_SEARCHES);
};

const getYearFilter = (value: string) => {
  if (!/^\d{4}$/.test(value)) return null;

  const year = Number(value);
  if (year < 1900 || year > CURRENT_YEAR + 2) return null;

  return year;
};

const mergeUniqueMovies = (currentMovies: Movie[], nextMovies: Movie[]) => {
  const currentIds = new Set(currentMovies.map((movie) => movie.id));
  const uniqueNextMovies = nextMovies.filter((movie) => !currentIds.has(movie.id));

  return [...currentMovies, ...uniqueNextMovies];
};

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreResults, setHasMoreResults] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [yearFilter, setYearFilter] = useState("");
  const [minRating, setMinRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<MovieSortBy>("popularity.desc");
  const [onlyStreaming, setOnlyStreaming] = useState(false);
  const [onlyWithTrailer, setOnlyWithTrailer] = useState(false);
  const [selectedProviderIds, setSelectedProviderIds] = useState<number[]>([]);
  const [watchProviders, setWatchProviders] = useState<WatchProviderOption[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState<string | null>(null);

  const selectedYear = useMemo(() => getYearFilter(yearFilter), [yearFilter]);
  const visibleWatchProviders = useMemo(
    () => watchProviders.slice(0, 20),
    [watchProviders]
  );

  const hasAdvancedFilter =
    selectedYear !== null ||
    minRating !== null ||
    sortBy !== "popularity.desc" ||
    onlyStreaming ||
    onlyWithTrailer ||
    selectedProviderIds.length > 0;

  const hasActiveFilter =
    searchQuery.trim().length > 0 ||
    selectedGenreId !== null ||
    hasAdvancedFilter;

  const advancedFilterCount = [
    selectedYear !== null,
    minRating !== null,
    sortBy !== "popularity.desc",
    onlyStreaming || selectedProviderIds.length > 0,
    onlyWithTrailer,
  ].filter(Boolean).length;

  const advancedFilters = useMemo<FetchMovieFilters>(
    () => ({
      year: selectedYear,
      minRating,
      sortBy,
      onlyStreaming: onlyStreaming || selectedProviderIds.length > 0,
      providerIds: selectedProviderIds,
      onlyWithTrailer,
    }),
    [
      minRating,
      onlyStreaming,
      onlyWithTrailer,
      selectedProviderIds,
      selectedYear,
      sortBy,
    ]
  );

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    const selectedProviderNames = watchProviders
      .filter((provider) => selectedProviderIds.includes(provider.provider_id))
      .map((provider) => provider.provider_name);

    if (selectedYear) labels.push(String(selectedYear));
    if (minRating) labels.push(`Nota ${minRating}+`);
    if (sortBy === "vote_average.desc") labels.push("Melhor nota");
    if (sortBy === "primary_release_date.desc") labels.push("Lançamentos");
    if (selectedProviderNames.length) {
      labels.push(selectedProviderNames.slice(0, 2).join(", "));
    } else if (onlyStreaming) {
      labels.push("Streaming");
    }
    if (onlyWithTrailer) labels.push("Com trailer");

    return labels;
  }, [
    minRating,
    onlyStreaming,
    onlyWithTrailer,
    selectedProviderIds,
    selectedYear,
    sortBy,
    watchProviders,
  ]);

  useEffect(() => {
    let active = true;

    const loadRecentSearches = async () => {
      try {
        const saved = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (!active || !saved) return;

        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecentSearches(
            parsed
              .filter((item) => typeof item === "string")
              .slice(0, MAX_RECENT_SEARCHES)
          );
        }
      } catch (err) {
        console.warn("Falha ao carregar histórico de busca:", err);
      }
    };

    loadRecentSearches();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadWatchProviders = async () => {
      try {
        setProvidersLoading(true);
        setProvidersError(null);
        const providers = await fetchWatchProviderOptions("BR");

        if (active) {
          setWatchProviders(providers);
        }
      } catch (err) {
        console.warn("Falha ao carregar plataformas:", err);
        if (active) {
          setProvidersError("Não foi possível carregar as plataformas agora.");
        }
      } finally {
        if (active) {
          setProvidersLoading(false);
        }
      }
    };

    loadWatchProviders();

    return () => {
      active = false;
    };
  }, []);

  const saveRecentSearch = (query: string) => {
    setRecentSearches((currentSearches) => {
      const nextSearches = normalizeRecentSearches(query, currentSearches);

      AsyncStorage.setItem(
        RECENT_SEARCHES_KEY,
        JSON.stringify(nextSearches)
      ).catch((err) => {
        console.warn("Falha ao salvar histórico de busca:", err);
      });

      return nextSearches;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    AsyncStorage.removeItem(RECENT_SEARCHES_KEY).catch((err) => {
      console.warn("Falha ao limpar histórico de busca:", err);
    });
  };

  const resetResults = () => {
    setPage(1);
    setMovies([]);
    setHasMoreResults(true);
  };

  const handleSearch = (text: string) => {
    resetResults();
    setSearchQuery(text);
  };

  const handleRecentSearchPress = (query: string) => {
    resetResults();
    setSearchQuery(query);
  };

  const handleGenreSelect = (genreId: number | null) => {
    resetResults();
    setSelectedGenreId(genreId);
  };

  const handleYearChange = (value: string) => {
    resetResults();
    setYearFilter(value.replace(/\D/g, "").slice(0, 4));
  };

  const handleRatingSelect = (rating: number | null) => {
    resetResults();
    setMinRating(rating);
  };

  const handleSortSelect = (sortOption: MovieSortBy) => {
    resetResults();
    setSortBy(sortOption);
  };

  const toggleProvider = (providerId: number) => {
    const alreadySelected = selectedProviderIds.includes(providerId);

    resetResults();
    setSelectedProviderIds((currentIds) =>
      alreadySelected
        ? currentIds.filter((id) => id !== providerId)
        : [...currentIds, providerId]
    );

    if (!alreadySelected) {
      setOnlyStreaming(true);
    }
  };

  const toggleStreamingFilter = () => {
    resetResults();

    if (onlyStreaming || selectedProviderIds.length > 0) {
      setOnlyStreaming(false);
      setSelectedProviderIds([]);
      return;
    }

    setOnlyStreaming(true);
  };

  const toggleTrailerFilter = () => {
    resetResults();
    setOnlyWithTrailer((current) => !current);
  };

  const clearAdvancedFilters = () => {
    resetResults();
    setYearFilter("");
    setMinRating(null);
    setSortBy("popularity.desc");
    setOnlyStreaming(false);
    setOnlyWithTrailer(false);
    setSelectedProviderIds([]);
  };

  const loadMoreMovies = () => {
    if (
      !hasActiveFilter ||
      loading ||
      loadingMore ||
      !hasMoreResults ||
      movies.length === 0
    ) {
      return;
    }

    setPage((currentPage) => currentPage + 1);
  };

  useEffect(() => {
    let active = true;

    const timeoutId = setTimeout(async () => {
      const normalizedQuery = searchQuery.trim();
      const isFirstPage = page === 1;

      if (!hasActiveFilter) {
        setMovies([]);
        setError(null);
        setLoading(false);
        setLoadingMore(false);
        setHasMoreResults(true);
        return;
      }

      try {
        setLoading(isFirstPage);
        setLoadingMore(!isFirstPage);
        setError(null);

        const results = await fetchMovies({
          query: normalizedQuery,
          page,
          genreId: selectedGenreId,
          filters: advancedFilters,
        });

        if (!active) return;

        setMovies((currentMovies) =>
          isFirstPage ? results : mergeUniqueMovies(currentMovies, results)
        );
        setHasMoreResults(results.length > 0);

        if (isFirstPage && normalizedQuery && results[0]) {
          trackSearch(normalizedQuery, results[0]);
          saveRecentSearch(normalizedQuery);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err : new Error("Erro desconhecido"));
        setMovies([]);
      } finally {
        if (active) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    }, 500);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [advancedFilters, hasActiveFilter, page, searchQuery, selectedGenreId]);

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <Image
        source={images.bg}
        className="absolute h-full w-full opacity-30"
        resizeMode="cover"
      />
      <View className="absolute inset-0 bg-primary/70" />

      <FlatList
        className="px-5"
        data={movies}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <MovieDisplayCard {...item} />}
        numColumns={3}
        columnWrapperStyle={{
          justifyContent: "flex-start",
          gap: 12,
          marginVertical: 12,
        }}
        contentContainerStyle={{ paddingBottom: 120 }}
        onEndReachedThreshold={0.45}
        onEndReached={loadMoreMovies}
        ListHeaderComponent={
          <>
            <View className="mt-8">
              <SearchHeader />
            </View>

            <View className="my-5">
              <SearchBar
                placeholder="Procure pelo seu filme"
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>

            <RecentSearches
              searches={recentSearches}
              onSelectSearch={handleRecentSearchPress}
              onClear={clearRecentSearches}
            />

            <View className="mb-5">
              <SectionTitle eyebrow="Gêneros" title="Filtrar filmes" />
              <View className="mt-3">
                <GenreFilter
                  selectedGenreId={selectedGenreId}
                  onSelectGenre={handleGenreSelect}
                />
              </View>
            </View>

            <AdvancedFilters
              expanded={filtersExpanded}
              yearFilter={yearFilter}
              selectedYear={selectedYear}
              minRating={minRating}
              sortBy={sortBy}
              onlyStreaming={onlyStreaming || selectedProviderIds.length > 0}
              onlyWithTrailer={onlyWithTrailer}
              providerOptions={visibleWatchProviders}
              providersLoading={providersLoading}
              providersError={providersError}
              selectedProviderIds={selectedProviderIds}
              activeCount={advancedFilterCount}
              activeLabels={activeFilterLabels}
              onToggleExpanded={() => setFiltersExpanded((current) => !current)}
              onChangeYear={handleYearChange}
              onSelectRating={handleRatingSelect}
              onSelectSort={handleSortSelect}
              onToggleStreaming={toggleStreamingFilter}
              onToggleTrailer={toggleTrailerFilter}
              onToggleProvider={toggleProvider}
              onClearFilters={clearAdvancedFilters}
            />

            {loading && (
              <ActivityIndicator
                size="large"
                color="#D6C7FF"
                className="my-3"
              />
            )}

            {error && (
              <Text className="my-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-200">
                Erro: {error.message}
              </Text>
            )}

            {!loading && !error && hasActiveFilter && movies.length > 0 && (
              <View className="mb-2 mt-2 flex-row items-end justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-xs uppercase tracking-[2px] text-light-300">
                    Resultados
                  </Text>
                  <Text className="text-xl font-bold text-white">
                    {searchQuery.trim() ? (
                      <>
                        Para <Text className="text-accent">{searchQuery}</Text>
                      </>
                    ) : selectedGenreId || hasAdvancedFilter ? (
                      "Filmes filtrados"
                    ) : (
                      "Catálogo"
                    )}
                  </Text>
                </View>
                <Text className="text-sm text-light-200">
                  {movies.length} encontrados
                </Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View className="mt-10 rounded-3xl border border-white/10 bg-white/5 px-6 py-8">
              <Text className="text-center text-light-200">
                {hasActiveFilter
                  ? "Nenhum filme encontrado. Ajuste o termo ou reduza os filtros."
                  : "Use o campo acima, escolha um gênero ou abra os filtros avançados."}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator size="small" color="#D6C7FF" className="my-5" />
          ) : hasActiveFilter && movies.length > 0 && !hasMoreResults ? (
            <Text className="my-5 text-center text-xs font-semibold text-light-300">
              Fim dos resultados encontrados.
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const SearchHeader = () => (
  <View>
    <View className="flex-row items-center justify-between">
      <View className="flex-1 flex-row items-center">
        <View className="h-12 w-12 items-center justify-center rounded-2xl border border-accent/30 bg-accent/15">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-accent">
            <Image
              source={icons.search}
              className="h-4 w-4"
              tintColor="#030014"
              resizeMode="contain"
            />
          </View>
        </View>

        <View className="ml-3 flex-1">
          <Text className="text-2xl font-black text-white" numberOfLines={1}>
            Buscar
          </Text>
          <Text className="text-xs font-semibold uppercase tracking-[1px] text-light-300">
            Catálogo MovieTV
          </Text>
        </View>
      </View>

      <View className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
        <Text className="text-xs font-bold text-light-100">BR</Text>
      </View>
    </View>

    <Text className="mt-5 text-3xl font-black text-white">
      Encontre filmes do seu jeito
    </Text>
    <Text className="mt-2 text-sm leading-5 text-light-200">
      Busque por título, filtre por gênero ou refine por streaming quando precisar.
    </Text>
  </View>
);

const SectionTitle = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
  <View>
    <Text className="text-xs uppercase tracking-[2px] text-light-300">
      {eyebrow}
    </Text>
    <Text className="text-lg font-bold text-white">{title}</Text>
  </View>
);

const RecentSearches = ({
  searches,
  onSelectSearch,
  onClear,
}: {
  searches: string[];
  onSelectSearch: (search: string) => void;
  onClear: () => void;
}) => {
  if (!searches.length) return null;

  return (
    <View className="mb-5">
      <View className="mb-3 flex-row items-end justify-between">
        <SectionTitle eyebrow="Histórico" title="Buscas recentes" />
        <TouchableOpacity
          onPress={onClear}
          activeOpacity={0.8}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-2"
        >
          <Text className="text-xs font-bold text-light-100">Limpar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingRight: 20 }}
      >
        {searches.map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => onSelectSearch(item)}
            activeOpacity={0.78}
            className="h-11 flex-row items-center rounded-full border border-white/10 bg-white/5 px-4"
          >
            <Image
              source={icons.search}
              className="mr-2 h-4 w-4"
              tintColor="#D6C7FF"
              resizeMode="contain"
            />
            <Text className="text-sm font-bold text-light-100">{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const AdvancedFilters = ({
  expanded,
  yearFilter,
  selectedYear,
  minRating,
  sortBy,
  onlyStreaming,
  onlyWithTrailer,
  providerOptions,
  providersLoading,
  providersError,
  selectedProviderIds,
  activeCount,
  activeLabels,
  onToggleExpanded,
  onChangeYear,
  onSelectRating,
  onSelectSort,
  onToggleStreaming,
  onToggleTrailer,
  onToggleProvider,
  onClearFilters,
}: {
  expanded: boolean;
  yearFilter: string;
  selectedYear: number | null;
  minRating: number | null;
  sortBy: MovieSortBy;
  onlyStreaming: boolean;
  onlyWithTrailer: boolean;
  providerOptions: WatchProviderOption[];
  providersLoading: boolean;
  providersError: string | null;
  selectedProviderIds: number[];
  activeCount: number;
  activeLabels: string[];
  onToggleExpanded: () => void;
  onChangeYear: (value: string) => void;
  onSelectRating: (value: number | null) => void;
  onSelectSort: (value: MovieSortBy) => void;
  onToggleStreaming: () => void;
  onToggleTrailer: () => void;
  onToggleProvider: (providerId: number) => void;
  onClearFilters: () => void;
}) => (
  <View className="mb-5 overflow-hidden rounded-[24px] border border-white/10 bg-dark-200/95">
    <TouchableOpacity
      onPress={onToggleExpanded}
      activeOpacity={0.84}
      className="p-4"
    >
      <View className="flex-row items-center">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-accent/15">
          <Feather name="sliders" size={19} color="#D6C7FF" />
        </View>

        <View className="ml-3 flex-1">
          <View className="flex-row items-center">
            <Text className="text-base font-black text-white">
              Filtros avançados
            </Text>
            {activeCount > 0 ? (
              <View className="ml-2 rounded-full bg-accent px-2 py-0.5">
                <Text className="text-[10px] font-black text-primary">
                  {activeCount}
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="mt-1 text-sm leading-5 text-light-200">
            Ano, nota, streaming, plataforma e trailer.
          </Text>
        </View>

        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={22}
          color="#A8B5DB"
        />
      </View>

      {activeLabels.length > 0 ? (
        <View className="mt-3 flex-row flex-wrap gap-2">
          {activeLabels.map((label) => (
            <View
              key={label}
              className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5"
            >
              <Text className="text-xs font-bold text-accent">{label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </TouchableOpacity>

    {expanded ? (
      <View className="border-t border-white/10 p-4 pt-5">
        <View>
          <Text className="mb-2 text-sm font-bold text-light-100">Ano</Text>
          <View
            className={`h-12 flex-row items-center rounded-2xl border px-4 ${
              yearFilter && selectedYear === null
                ? "border-red-400/50 bg-red-500/10"
                : "border-white/10 bg-primary"
            }`}
          >
            <TextInput
              value={yearFilter}
              onChangeText={onChangeYear}
              placeholder="Ex: 2024"
              placeholderTextColor="#A8B5DB"
              keyboardType="number-pad"
              maxLength={4}
              className="flex-1 text-base font-bold text-white"
            />
          </View>
          {yearFilter && selectedYear === null ? (
            <Text className="mt-2 text-xs font-semibold text-red-100">
              Use um ano entre 1900 e {CURRENT_YEAR + 2}.
            </Text>
          ) : null}
        </View>

        <FilterGroup title="Nota mínima">
          <FilterChip
            label="Qualquer"
            active={minRating === null}
            onPress={() => onSelectRating(null)}
          />
          {RATING_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              active={minRating === option.value}
              onPress={() => onSelectRating(option.value)}
            />
          ))}
        </FilterGroup>

        <FilterGroup title="Ordenar por">
          {SORT_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              active={sortBy === option.value}
              onPress={() => onSelectSort(option.value)}
            />
          ))}
        </FilterGroup>

        <FilterGroup title="Disponibilidade">
          <FilterChip
            label="Em streaming"
            active={onlyStreaming}
            onPress={onToggleStreaming}
          />
          <FilterChip
            label="Com trailer"
            active={onlyWithTrailer}
            onPress={onToggleTrailer}
          />
        </FilterGroup>

        <View className="mt-5">
          <Text className="mb-2 text-sm font-bold text-light-100">
            Plataformas
          </Text>

          {providersLoading ? (
            <View className="h-12 justify-center">
              <ActivityIndicator size="small" color="#D6C7FF" />
            </View>
          ) : providersError ? (
            <Text className="text-sm text-light-200">{providersError}</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingRight: 20 }}
            >
              {providerOptions.map((provider) => (
                <ProviderChip
                  key={provider.provider_id}
                  provider={provider}
                  active={selectedProviderIds.includes(provider.provider_id)}
                  onPress={() => onToggleProvider(provider.provider_id)}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {activeCount > 0 ? (
          <TouchableOpacity
            onPress={onClearFilters}
            activeOpacity={0.82}
            className="mt-5 h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5"
          >
            <Text className="font-bold text-light-100">Limpar filtros</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    ) : null}
  </View>
);

const FilterGroup = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <View className="mt-5">
    <Text className="mb-2 text-sm font-bold text-light-100">{title}</Text>
    <View className="flex-row flex-wrap gap-2">{children}</View>
  </View>
);

const FilterChip = ({
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
    activeOpacity={0.78}
    className={`h-10 justify-center rounded-full border px-4 ${
      active ? "border-accent bg-accent" : "border-white/10 bg-white/5"
    }`}
  >
    <Text
      className={`text-sm font-bold ${
        active ? "text-primary" : "text-light-100"
      }`}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const ProviderChip = ({
  provider,
  active,
  onPress,
}: {
  provider: WatchProviderOption;
  active: boolean;
  onPress: () => void;
}) => {
  const logo = providerLogoUrl(provider.logo_path);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.78}
      className={`min-h-24 w-28 items-center justify-center rounded-2xl border px-3 py-3 ${
        active ? "border-accent bg-accent/20" : "border-white/10 bg-white/5"
      }`}
    >
      <View className="h-10 w-10 overflow-hidden rounded-xl bg-white">
        {logo ? (
          <Image
            source={{ uri: logo }}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-accent">
            <Text className="text-xs font-black text-primary">
              {provider.provider_name.slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <Text
        className={`mt-2 text-center text-xs font-bold leading-4 ${
          active ? "text-white" : "text-light-100"
        }`}
        numberOfLines={2}
      >
        {provider.provider_name}
      </Text>
    </TouchableOpacity>
  );
};

export default Search;
