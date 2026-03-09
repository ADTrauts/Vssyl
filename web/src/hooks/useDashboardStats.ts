'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { getConversations } from '../api/chat';
import { getTasks } from '../api/todo';
import { calendarAPI } from '../api/calendar';

export interface DashboardStats {
  unreadMessages: number;
  pendingTasks: number;
  upcomingEvents: number;
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
  });
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStats = useCallback(async () => {
    if (!session?.accessToken || !dashboardId) return;

    try {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const [chatResult, taskResult, eventResult] = await Promise.allSettled([
        getConversations(session.accessToken, dashboardId),
        getTasks(session.accessToken, { dashboardId }),
        calendarAPI.listEvents({
          start: now.toISOString(),
          end: endOfDay.toISOString(),
          contexts: [dashboardId],
        }),
      ]);

      let unreadMessages = 0;
      if (chatResult.status === 'fulfilled') {
        const conversations = Array.isArray(chatResult.value)
          ? chatResult.value
          : chatResult.value?.data || [];
        unreadMessages = conversations.reduce((sum: number, conv: Record<string, unknown>) => {
          const messages = (conv.messages as Array<Record<string, unknown>>) || [];
          const unread = messages.filter(
            (msg) =>
              msg.senderId !== session.user?.id &&
              !(msg.readReceipts as Array<Record<string, unknown>> | undefined)?.some(
                (r) => r.userId === session.user?.id
              )
          ).length;
          return sum + unread;
        }, 0);
      }

      let pendingTasks = 0;
      if (taskResult.status === 'fulfilled') {
        const tasks = taskResult.value || [];
        pendingTasks = tasks.filter(
          (t) => t.status === 'TODO' || t.status === 'IN_PROGRESS'
        ).length;
      }

      let upcomingEvents = 0;
      if (eventResult.status === 'fulfilled' && eventResult.value?.success) {
        upcomingEvents = eventResult.value.data?.length || 0;
      }

      setStats({ unreadMessages, pendingTasks, upcomingEvents });
    } catch {
      // Non-critical -- keep existing stats
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, dashboardId, session?.user?.id]);

  useEffect(() => {
    fetchStats();
    intervalRef.current = setInterval(fetchStats, refreshIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStats, refreshIntervalMs]);

  return { stats, isLoading, refresh: fetchStats };
}
