'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminApiService } from '../../../lib/adminApiService';
import type {
  AIPipelineTrace,
  PipelineCatalog,
  PipelineQualityStats,
  PipelineRetentionSettings,
} from '../../../types/adminAiPipeline';

export interface PipelineHubData {
  stats: PipelineQualityStats | null;
  catalog: PipelineCatalog | null;
  traces: AIPipelineTrace[];
  retention: PipelineRetentionSettings | null;
}

export interface UsePipelineHubDataResult {
  data: PipelineHubData;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const EMPTY: PipelineHubData = {
  stats: null,
  catalog: null,
  traces: [],
  retention: null,
};

export function usePipelineHubData(pollIntervalMs = 60_000): UsePipelineHubDataResult {
  const [data, setData] = useState<PipelineHubData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    const [statsRes, catalogRes, tracesRes, retentionRes] = await Promise.all([
      adminApiService.getAiPipelineQualityStats({ days: 7 }),
      adminApiService.getAiPipelineCatalog(),
      adminApiService.getAiPipelineDiagnostics({ limit: 15 }),
      adminApiService.getAiPipelineRetention(),
    ]);

    const errors: string[] = [];
    if (statsRes.error) errors.push(statsRes.error);
    if (catalogRes.error) errors.push(catalogRes.error);
    if (tracesRes.error) errors.push(tracesRes.error);
    if (retentionRes.error) errors.push(retentionRes.error);

    setData({
      stats: statsRes.data ?? null,
      catalog: catalogRes.data ?? null,
      traces: tracesRes.data?.traces ?? [],
      retention: retentionRes.data ?? null,
    });

    if (errors.length > 0) {
      setError(errors[0]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    void refresh();
    const id = window.setInterval(() => {
      void refresh();
    }, pollIntervalMs);
    return () => window.clearInterval(id);
  }, [refresh, pollIntervalMs]);

  return { data, loading, error, refresh };
}
