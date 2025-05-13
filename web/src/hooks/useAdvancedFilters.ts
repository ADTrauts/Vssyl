import { useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';

interface FilterCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'notIn';
  value: any;
}

interface FilterGroup {
  conditions: FilterCondition[];
  operator: 'AND' | 'OR';
}

interface AdvancedFilter {
  id: string;
  name: string;
  description: string;
  filterGroups: FilterGroup[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export const useAdvancedFilters = () => {
  const [filters, setFilters] = useState<AdvancedFilter[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<AdvancedFilter | null>(null);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFilters = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/advanced-filters');
      if (!response.ok) throw new Error('Failed to fetch filters');
      const data = await response.json();
      setFilters(data);
    } catch (error) {
      logger.error('Error fetching filters:', error);
      setError('Failed to fetch filters');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createFilter = useCallback(async (filter: Omit<AdvancedFilter, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/advanced-filters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filter),
      });
      if (!response.ok) throw new Error('Failed to create filter');
      const data = await response.json();
      setFilters(prev => [...prev, data]);
      return data;
    } catch (error) {
      logger.error('Error creating filter:', error);
      setError('Failed to create filter');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateFilter = useCallback(async (filterId: string, updates: Partial<AdvancedFilter>) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/advanced-filters/${filterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update filter');
      const data = await response.json();
      setFilters(prev => prev.map(filter => filter.id === filterId ? data : filter));
      if (selectedFilter?.id === filterId) {
        setSelectedFilter(data);
      }
      return data;
    } catch (error) {
      logger.error('Error updating filter:', error);
      setError('Failed to update filter');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [selectedFilter]);

  const deleteFilter = useCallback(async (filterId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/advanced-filters/${filterId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete filter');
      setFilters(prev => prev.filter(filter => filter.id !== filterId));
      if (selectedFilter?.id === filterId) {
        setSelectedFilter(null);
        setFilteredData([]);
      }
    } catch (error) {
      logger.error('Error deleting filter:', error);
      setError('Failed to delete filter');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [selectedFilter]);

  const applyFilter = useCallback(async (filterId: string, data: any[]) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/advanced-filters/${filterId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });
      if (!response.ok) throw new Error('Failed to apply filter');
      const filteredData = await response.json();
      setFilteredData(filteredData);
      return filteredData;
    } catch (error) {
      logger.error('Error applying filter:', error);
      setError('Failed to apply filter');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectFilter = useCallback(async (filterId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/advanced-filters/${filterId}`);
      if (!response.ok) throw new Error('Failed to fetch filter');
      const data = await response.json();
      setSelectedFilter(data);
    } catch (error) {
      logger.error('Error selecting filter:', error);
      setError('Failed to select filter');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  return {
    filters,
    selectedFilter,
    filteredData,
    isLoading,
    error,
    createFilter,
    updateFilter,
    deleteFilter,
    applyFilter,
    selectFilter,
    fetchFilters
  };
}; 