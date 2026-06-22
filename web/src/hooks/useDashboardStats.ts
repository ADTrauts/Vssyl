'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  fetchDashboardAnalyticsSummary,
  toDashboardHeaderStats,
  DEGRADED_DASHBOARD_SUMMARY,
} from '../lib/dashboardAnalyticsFacade';

export interface DashboardStats {
  unreadMessages: number;
  pendingTasks: number;
  upcomingEvents: number;
  degraded: boolean;
}

interface UseDashboardStatsOptions {
  dashboardId: string | null;
  refreshIntervalMs?: number;
}

export function useDashboardStats({
  dashboardId,
  refreshIntervalMs = 120_000,
}: UseDashboardStatsOptions) {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    unreadMessages: 0,
    pendingTasks: 0,
    upcomingEvents: 0,
    degraded: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStats = useCallback(async () => {
    if (!session?.accessToken || !dashboardId) return;

    try {
      const summary = await fetchDashboardAnalyticsSummary(session.accessToken, dashboardId);
      setStats(toDashboardHeaderStats(summary));
    } catch {
      const degraded = toDashboardHeaderStats({
        ...DEGRADED_DASHBOARD_SUMMARY,
        dashboardId,
      });
      setStats(degraded);
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, dashboardId]);

  useEffect(() => {
    fetchStats();
    intervalRef.current = setInterval(fetchStats, refreshIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStats, refreshIntervalMs]);

  return { stats, isLoading, refresh: fetchStats };
}
