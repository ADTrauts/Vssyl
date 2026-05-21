'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminApiService } from '../../../../lib/adminApiService';
import type {
  PipelineCatalog,
  RegistryGraph,
  RegistryValidationResult,
} from '../../../../types/adminAiPipeline';

export type RegistryFilter = 'all' | 'enabled' | 'archived' | 'system' | 'custom';

export function usePipelineRegistry() {
  const [catalog, setCatalog] = useState<PipelineCatalog | null>(null);
  const [graph, setGraph] = useState<RegistryGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [filter, setFilter] = useState<RegistryFilter>('all');
  const [search, setSearch] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    const [catRes, graphRes] = await Promise.all([
      adminApiService.getAiPipelineCatalog({ includeArchived }),
      adminApiService.getAiPipelineRegistryGraph(),
    ]);
    if (catRes.error || !catRes.data) {
      setError(catRes.error ?? 'Failed to load catalog');
      setCatalog(null);
    } else {
      setCatalog(catRes.data);
      setError(null);
    }
    if (graphRes.data) setGraph(graphRes.data);
    setLoading(false);
  }, [includeArchived]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const validate = useCallback(
    async (input: {
      entityType: 'intent' | 'context_source' | 'tool' | 'grounding_rule';
      action: 'create' | 'update' | 'archive' | 'duplicate';
      entityId: string;
      payload?: Record<string, unknown>;
    }): Promise<RegistryValidationResult | null> => {
      const res = await adminApiService.validateAiPipelineRegistry(input);
      if (res.error || !res.data) return null;
      return res.data;
    },
    []
  );

  const matchesFilter = useCallback(
    (row: { id?: string; toolId?: string; isSystem: boolean; archived: boolean; enabled: boolean }) => {
      const id = row.id ?? row.toolId ?? '';
      if (search.trim() && !id.toLowerCase().includes(search.trim().toLowerCase())) {
        return false;
      }
      switch (filter) {
        case 'enabled':
          return row.enabled && !row.archived;
        case 'archived':
          return row.archived;
        case 'system':
          return row.isSystem && !row.archived;
        case 'custom':
          return !row.isSystem && !row.archived;
        default:
          return !row.archived || includeArchived;
      }
    },
    [filter, search, includeArchived]
  );

  return {
    catalog,
    graph,
    loading,
    error,
    reload,
    validate,
    includeArchived,
    setIncludeArchived,
    filter,
    setFilter,
    search,
    setSearch,
    matchesFilter,
  };
}
