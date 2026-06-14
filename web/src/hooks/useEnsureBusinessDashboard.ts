'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ensureBusinessDashboard } from '../lib/ensureBusinessDashboard';

export interface UseEnsureBusinessDashboardResult {
  businessDashboardId: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Ensures a business-scoped dashboard exists and returns its id.
 * Used by DashboardLayoutWrapper — canonical bootstrap path (Wave 1B).
 */
export function useEnsureBusinessDashboard(
  businessId: string | null | undefined,
  businessName?: string
): UseEnsureBusinessDashboardResult {
  const { data: session, status } = useSession();
  const [businessDashboardId, setBusinessDashboardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (!session?.accessToken || !businessId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const record = await ensureBusinessDashboard(
          session.accessToken as string,
          businessId,
          businessName
        );
        if (!cancelled) {
          setBusinessDashboardId(record.id);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to initialize business dashboard';
          setError(message);
          setBusinessDashboardId(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, session?.accessToken, businessId, businessName]);

  return { businessDashboardId, loading, error };
}
