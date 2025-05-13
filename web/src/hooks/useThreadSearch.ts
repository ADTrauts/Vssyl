import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { useAuth } from './useAuth';
import { logger } from '../utils/logger';
import debounce from 'lodash/debounce';

interface SearchFilters {
  query?: string;
  authorId?: string;
  tags?: string[];
  status?: 'active' | 'archived' | 'locked';
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: 'relevance' | 'newest' | 'oldest' | 'mostActive';
}

interface SearchResult {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  tags: string[];
  status: string;
  messageCount: number;
  lastActivity: Date;
  relevance?: number;
}

interface SearchSuggestions {
  threads: { id: string; title: string }[];
  tags: string[];
  authors: { id: string; name: string }[];
}

export const useThreadSearch = () => {
  const { user } = useAuth();
  const { sendMessage, subscribeToThread } = useWebSocket();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestions>({
    threads: [],
    tags: [],
    authors: []
  });
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({});
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const searchThreads = useCallback(async (newFilters: SearchFilters) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (newFilters.query) queryParams.set('query', newFilters.query);
      if (newFilters.authorId) queryParams.set('authorId', newFilters.authorId);
      if (newFilters.tags?.length) queryParams.set('tags', newFilters.tags.join(','));
      if (newFilters.status) queryParams.set('status', newFilters.status);
      if (newFilters.dateRange) {
        queryParams.set('startDate', newFilters.dateRange.start.toISOString());
        queryParams.set('endDate', newFilters.dateRange.end.toISOString());
      }
      if (newFilters.sortBy) queryParams.set('sortBy', newFilters.sortBy);

      const response = await fetch(`/api/search/threads?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to search threads');
      }
      const data = await response.json();
      setResults(data);

      // Log the search
      if (newFilters.query) {
        await fetch('/api/search/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: newFilters.query })
        });
      }
    } catch (error) {
      logger.error('Error searching threads:', error);
      setError('Failed to search threads');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const getSuggestions = useCallback(async (query: string) => {
    if (!user || !query) {
      setSuggestions({ threads: [], tags: [], authors: [] });
      return;
    }

    try {
      const response = await fetch(`/api/search/suggestions?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      logger.error('Error getting suggestions:', error);
    }
  }, [user]);

  const getPopularSearches = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/search/popular');
      if (!response.ok) {
        throw new Error('Failed to get popular searches');
      }
      const data = await response.json();
      setPopularSearches(data);
    } catch (error) {
      logger.error('Error getting popular searches:', error);
    }
  }, [user]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((newFilters: SearchFilters) => {
      searchThreads(newFilters);
    }, 300),
    [searchThreads]
  );

  // Debounced suggestions
  const debouncedSuggestions = useCallback(
    debounce((query: string) => {
      getSuggestions(query);
    }, 200),
    [getSuggestions]
  );

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    debouncedSearch(updatedFilters);

    if (newFilters.query) {
      debouncedSuggestions(newFilters.query);
    }
  }, [filters, debouncedSearch, debouncedSuggestions]);

  useEffect(() => {
    if (user) {
      getPopularSearches();

      const handleSearchUpdate = (message: any) => {
        if (message.type === 'search:update') {
          setResults(prev => prev.map(result => 
            result.id === message.data.id ? { ...result, ...message.data } : result
          ));
        }
      };

      // Subscribe to search updates for all threads in results
      results.forEach(result => {
        subscribeToThread(result.id, handleSearchUpdate);
      });

      return () => {
        // Cleanup subscriptions
      };
    }
  }, [user, results, getPopularSearches, subscribeToThread]);

  return {
    results,
    suggestions,
    popularSearches,
    isLoading,
    error,
    filters,
    updateFilters,
    refreshPopularSearches: getPopularSearches
  };
}; 