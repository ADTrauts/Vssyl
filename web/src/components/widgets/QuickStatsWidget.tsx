'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  MessageCircle,
  Calendar,
  CheckSquare,
  HardDrive,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import { Spinner } from 'shared/components';
import { getConversations } from '../../api/chat';
import { getTasks } from '../../api/todo';
import { calendarAPI } from '../../api/calendar';

interface QuickStatsWidgetProps {
  id: string;
  config?: QuickStatsWidgetConfig;
  onConfigChange?: (config: QuickStatsWidgetConfig) => void;
  dashboardId: string;
  dashboardType: 'personal' | 'business' | 'educational' | 'household';
  dashboardName: string;
}

interface QuickStatsWidgetConfig {
  showMessages: boolean;
  showTasks: boolean;
  showEvents: boolean;
  showStorage: boolean;
  compactMode: boolean;
}

interface StatData {
  unreadMessages: number;
  pendingTasks: number;
  todayEvents: number;
  storageUsedPercent: number;
}

const defaultConfig: QuickStatsWidgetConfig = {
  showMessages: true,
  showTasks: true,
  showEvents: true,
  showStorage: true,
  compactMode: false,
};

export default function QuickStatsWidget({
  id,
  config,
  onConfigChange,
  dashboardId,
  dashboardType,
  dashboardName,
}: QuickStatsWidgetProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatData>({
    unreadMessages: 0,
    pendingTasks: 0,
    todayEvents: 0,
    storageUsedPercent: 0,
  });
  const [showSettings, setShowSettings] = useState(false);

  const safeConfig = config || defaultConfig;

  useEffect(() => {
    if (!session?.accessToken || !dashboardId) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const now = new Date();
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const [chatResult, taskResult, eventResult] = await Promise.allSettled([
          getConversations(session.accessToken!, dashboardId),
          getTasks(session.accessToken!, { dashboardId }),
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

        let todayEvents = 0;
        if (eventResult.status === 'fulfilled' && eventResult.value?.success) {
          todayEvents = eventResult.value.data?.length || 0;
        }

        setStats({
          unreadMessages,
          pendingTasks,
          todayEvents,
          storageUsedPercent: 23, // Placeholder - would need storage API
        });
      } catch {
        // Keep existing stats on error
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 120_000);
    return () => clearInterval(interval);
  }, [session?.accessToken, dashboardId, session?.user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size={24} />
        <span className="ml-2 text-gray-600 dark:text-gray-400 text-sm">Loading stats...</span>
      </div>
    );
  }

  const statCards = [
    {
      key: 'messages',
      show: safeConfig.showMessages,
      icon: MessageCircle,
      label: 'Unread',
      value: stats.unreadMessages,
      color: 'text-blue-600 bg-blue-100',
      href: '/chat',
    },
    {
      key: 'tasks',
      show: safeConfig.showTasks,
      icon: CheckSquare,
      label: 'Tasks',
      value: stats.pendingTasks,
      color: 'text-violet-600 bg-violet-100',
      href: '/todo',
    },
    {
      key: 'events',
      show: safeConfig.showEvents,
      icon: Calendar,
      label: 'Today',
      value: stats.todayEvents,
      color: 'text-green-600 bg-green-100',
      href: '/calendar/month',
    },
    {
      key: 'storage',
      show: safeConfig.showStorage,
      icon: HardDrive,
      label: 'Storage',
      value: `${stats.storageUsedPercent}%`,
      color: 'text-amber-600 bg-amber-100',
      href: '/drive',
      isPercent: true,
    },
  ];

  const visibleCards = statCards.filter((c) => c.show);

  return (
    <div className="space-y-3">
      <div className={`grid gap-3 ${safeConfig.compactMode ? 'grid-cols-4' : 'grid-cols-2'}`}>
        {visibleCards.map((card) => {
          const Icon = card.icon;
          const [iconColor, iconBg] = card.color.split(' ');
          return (
            <a
              key={card.key}
              href={card.href}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-blue-300 hover:bg-blue-50/30 transition-colors group"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              {!safeConfig.compactMode && (
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{card.value}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{card.label}</div>
                </div>
              )}
              {safeConfig.compactMode && (
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{card.value}</div>
              )}
            </a>
          );
        })}
      </div>

      {/* Settings toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          {showSettings ? 'Hide Settings' : 'Settings'}
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && onConfigChange && (
        <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={safeConfig.showMessages}
              onChange={(e) => onConfigChange({ ...safeConfig, showMessages: e.target.checked })}
              className="rounded"
            />
            Show messages
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={safeConfig.showTasks}
              onChange={(e) => onConfigChange({ ...safeConfig, showTasks: e.target.checked })}
              className="rounded"
            />
            Show tasks
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={safeConfig.showEvents}
              onChange={(e) => onConfigChange({ ...safeConfig, showEvents: e.target.checked })}
              className="rounded"
            />
            Show events
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={safeConfig.showStorage}
              onChange={(e) => onConfigChange({ ...safeConfig, showStorage: e.target.checked })}
              className="rounded"
            />
            Show storage
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={safeConfig.compactMode}
              onChange={(e) => onConfigChange({ ...safeConfig, compactMode: e.target.checked })}
              className="rounded"
            />
            Compact mode
          </label>
        </div>
      )}
    </div>
  );
}
