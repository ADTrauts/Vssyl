'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminApiService } from '../../../lib/adminApiService';
import type { PipelineCatalog } from '../../../types/adminAiPipeline';

export function usePipelineCatalog() {
  const [catalog, setCatalog] = useState<PipelineCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const res = await adminApiService.getAiPipelineCatalog();
    if (res.error || !res.data) {
      setError(res.error ?? 'Failed to load catalog');
      setCatalog(null);
    } else {
      setCatalog(res.data);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { catalog, loading, error, reload };
}
