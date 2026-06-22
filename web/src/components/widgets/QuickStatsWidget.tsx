'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  MessageCircle,
  Calendar,
  CheckSquare,
  HardDrive,
} from 'lucide-react';
import { Spinner } from 'shared/components';
import {
  fetchDashboardAnalyticsSummary,
  toQuickStatsDisplay,
  DEGRADED_DASHBOARD_SUMMARY,
} from '../../lib/dashboardAnalyticsFacade';

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
  unreadMessages: number | null;
  pendingTasks: number | null;
  todayEvents: number | null;
  storageUsedPercent: number | null;
  degraded: boolean;
}

const defaultConfig: QuickStatsWidgetConfig = {
  showMessages: true,
  showTasks: true,
  showEvents: true,
  showStorage: true,
  compactMode: false,
};

function formatStatValue(value: number | null, isPercent = false): string {
  if (value === null) {
    return '—';
  }
  return isPercent ? `${value}%` : String(value);
}

/**
 * Analytics-owned data (via dashboardAnalyticsFacade); Dashboard hosts widget chrome only (K3-04).
 */
export default function QuickStatsWidget({
  config,
  onConfigChange,
  dashboardId,
}: QuickStatsWidgetProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatData>({
    unreadMessages: null,
    pendingTasks: null,
    todayEvents: null,
    storageUsedPercent: null,
    degraded: true,
  });
  const [showSettings, setShowSettings] = useState(false);

  const safeConfig = config || defaultConfig;

  useEffect(() => {
    if (!session?.accessToken || !dashboardId) return;

    const load = async () => {
      try {
        setLoading(true);
        const summary = await fetchDashboardAnalyticsSummary(session.accessToken!, dashboardId);
        setStats(toQuickStatsDisplay(summary));
      } catch {
        setStats(toQuickStatsDisplay({ ...DEGRADED_DASHBOARD_SUMMARY, dashboardId }));
      } finally {
        setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 120_000);
    return () => clearInterval(interval);
  }, [session?.accessToken, dashboardId]);

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
      value: formatStatValue(stats.unreadMessages),
      color: 'text-blue-600 bg-blue-100',
      href: '/chat',
    },
    {
      key: 'tasks',
      show: safeConfig.showTasks,
      icon: CheckSquare,
      label: 'Tasks',
      value: formatStatValue(stats.pendingTasks),
      color: 'text-violet-600 bg-violet-100',
      href: '/todo',
    },
    {
      key: 'events',
      show: safeConfig.showEvents,
      icon: Calendar,
      label: 'Today',
      value: formatStatValue(stats.todayEvents),
      color: 'text-green-600 bg-green-100',
      href: '/calendar/month',
    },
    {
      key: 'storage',
      show: safeConfig.showStorage,
      icon: HardDrive,
      label: 'Storage',
      value: formatStatValue(stats.storageUsedPercent, true),
      color: 'text-amber-600 bg-amber-100',
      href: '/drive',
    },
  ];

  const visibleCards = statCards.filter((c) => c.show);

  return (
    <div className="space-y-3">
      {stats.degraded && (
        <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded px-2 py-1">
          Some metrics are temporarily unavailable.
        </p>
      )}
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

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          {showSettings ? 'Hide Settings' : 'Settings'}
        </button>
      </div>

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
