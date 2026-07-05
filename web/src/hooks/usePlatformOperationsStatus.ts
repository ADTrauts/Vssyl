'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminApiService } from '../lib/adminApiService';
import type { PlatformOperationsStatus } from '../lib/adminPlatformOperations';

const POLL_MS = 60_000;

export function usePlatformOperationsStatus(options?: { poll?: boolean }) {
  const [data, setData] = useState<PlatformOperationsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminApiService.getPlatformOperationsStatus();
    if (res.error) {
      setError(res.error);
      setData(null);
    } else if (res.data) {
      setData(res.data as PlatformOperationsStatus);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (options?.poll === false) return;
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh, options?.poll]);

  return { data, loading, error, refresh };
}
