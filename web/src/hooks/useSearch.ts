import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useDebounce } from './useDebounce';

interface SearchResult {
  id: string;
  type: 'thread' | 'file' | 'folder';
  title: string;
  content: string;
  relevance: number;
  metadata: {
    author?: string;
    lastActivity: string;
    tags?: string[];
    size?: number;
    messageCount?: number;
    participantCount?: number;
  };
}

interface SearchResultGroup {
  type: 'thread' | 'file' | 'folder';
  title: string;
  results: SearchResult[];
  count: number;
}

interface SearchFilter {
  type?: 'thread' | 'file' | 'folder';
  dateRange?: [Date | null, Date | null];
  tags?: string[];
  author?: string;
  minSize?: number;
  maxSize?: number;
  relevanceThreshold?: number;
  sortBy?: 'relevance' | 'date' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface SearchHistoryEntry {
  id: string;
  query: string;
  timestamp: string;
  filters: SearchFilter;
  results: SearchResult[];
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilter;
  createdAt: string;
  updatedAt: string;
}

interface SearchAnalytics {
  totalSearches: number;
  averageResults: number;
  noResultsRate: number;
  popularSearches: Array<{
    query: string;
    count: number;
  }>;
}

export function useSearch() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilter>({
    page: 1,
    limit: 20,
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [groups, setGroups] = useState<SearchResultGroup[]>([]);
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [analytics, setAnalytics] = useState<SearchAnalytics>({
    totalSearches: 0,
    averageResults: 0,
    noResultsRate: 0,
    popularSearches: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  const search = useCallback(async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      const response = await api.post('/search', {
        query: debouncedQuery,
        filters: {
          ...filters,
          page,
          limit: filters.limit,
        },
      });

      const newResults = response.data.results;
      const newGroups = response.data.groups;
      const totalResults = response.data.total;

      if (append) {
        setResults((prev) => [...prev, ...newResults]);
      } else {
        setResults(newResults);
        setGroups(newGroups);
      }

      setHasMore(newResults.length === filters.limit && results.length + newResults.length < totalResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [debouncedQuery, filters]);

  const loadMore = useCallback(() => {
    if (!isLoading && !isLoadingMore && hasMore) {
      const nextPage = (filters.page || 1) + 1;
      setFilters((prev) => ({ ...prev, page: nextPage }));
      search(nextPage, true);
    }
  }, [isLoading, isLoadingMore, hasMore, filters.page, search]);

  useEffect(() => {
    if (debouncedQuery) {
      search(1, false);
    } else {
      setResults([]);
      setHasMore(false);
    }
  }, [debouncedQuery, filters, search]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [historyResponse, savedResponse, analyticsResponse] = await Promise.all([
          api.get('/search/history'),
          api.get('/search/saved'),
          api.get('/search/analytics'),
        ]);

        setHistory(historyResponse.data);
        setSavedSearches(savedResponse.data);
        setAnalytics(analyticsResponse.data);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };

    loadInitialData();
  }, []);

  const saveSearch = async (name: string) => {
    try {
      const response = await api.post('/search/saved', {
        name,
        query: debouncedQuery,
        filters,
      });
      setSavedSearches((prev) => [...prev, response.data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save search');
    }
  };

  const deleteSavedSearch = async (id: string) => {
    try {
      await api.delete(`/search/saved/${id}`);
      setSavedSearches((prev) => prev.filter((search) => search.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete saved search');
    }
  };

  const clearHistory = async () => {
    try {
      await api.delete('/search/history');
      setHistory([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear history');
    }
  };

  const deleteHistoryEntry = async (id: string) => {
    try {
      await api.delete(`/search/history/${id}`);
      setHistory((prev) => prev.filter((entry) => entry.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete history entry');
    }
  };

  const updateHistoryEntry = async (id: string, data: Partial<SearchHistoryEntry>) => {
    try {
      const response = await api.put(`/search/history/${id}`, data);
      setHistory((prev) =>
        prev.map((entry) => (entry.id === id ? response.data : entry))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update history entry');
    }
  };

  return {
    query,
    setQuery,
    filters,
    setFilters,
    results,
    groups,
    history,
    savedSearches,
    analytics,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    saveSearch,
    deleteSavedSearch,
    clearHistory,
    deleteHistoryEntry,
    updateHistoryEntry,
    loadMore,
  };
} 