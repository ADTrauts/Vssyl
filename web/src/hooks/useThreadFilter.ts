import { useState, useCallback, useEffect } from 'react';
import { Thread, ThreadFilter, ThreadSearchResult } from '@/types/thread';
import { useThreadOrganization } from '@/contexts/thread-organization-context';

export const useThreadFilter = () => {
  const { activeFilter, setActiveFilter, searchThreads } = useThreadOrganization();
  const [filteredThreads, setFilteredThreads] = useState<Thread[]>([]);
  const [searchResults, setSearchResults] = useState<ThreadSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  const applyFilter = useCallback(async (threads: Thread[], filter: ThreadFilter) => {
    setIsFiltering(true);
    try {
      let result = [...threads];

      // Apply type filter
      if (filter.type?.length) {
        result = result.filter(thread => filter.type?.includes(thread.type));
      }

      // Apply status filter
      if (filter.status?.length) {
        result = result.filter(thread => filter.status?.includes(thread.status));
      }

      // Apply participants filter
      if (filter.participants?.length) {
        result = result.filter(thread => 
          filter.participants?.some(participant => 
            thread.participants.includes(participant)
          )
        );
      }

      // Apply tags filter
      if (filter.tags?.length) {
        result = result.filter(thread => 
          filter.tags?.some(tag => 
            thread.metadata?.tags?.includes(tag)
          )
        );
      }

      // Apply date range filter
      if (filter.dateRange) {
        result = result.filter(thread => {
          const threadDate = new Date(thread.updatedAt);
          return threadDate >= filter.dateRange!.start && 
                 threadDate <= filter.dateRange!.end;
        });
      }

      // Apply sorting
      if (filter.sortBy) {
        result.sort((a, b) => {
          const aValue = filter.sortBy === 'lastActivity' 
            ? new Date(a.updatedAt).getTime()
            : new Date(a[filter.sortBy]).getTime();
          const bValue = filter.sortBy === 'lastActivity'
            ? new Date(b.updatedAt).getTime()
            : new Date(b[filter.sortBy]).getTime();
          
          return filter.sortOrder === 'asc' 
            ? aValue - bValue 
            : bValue - aValue;
        });
      }

      setFilteredThreads(result);
    } catch (error) {
      console.error('Error applying filter:', error);
    } finally {
      setIsFiltering(false);
    }
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchThreads(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching threads:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchThreads]);

  const updateFilter = useCallback((updates: Partial<ThreadFilter>) => {
    setActiveFilter(prev => ({ ...prev, ...updates }));
  }, [setActiveFilter]);

  const clearFilters = useCallback(() => {
    setActiveFilter({});
  }, [setActiveFilter]);

  return {
    activeFilter,
    filteredThreads,
    searchResults,
    isSearching,
    isFiltering,
    applyFilter,
    handleSearch,
    updateFilter,
    clearFilters,
  };
}; 