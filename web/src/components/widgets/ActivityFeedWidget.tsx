'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { chatSocket } from '../../lib/chatSocket';
import {
  Activity,
  MessageCircle,
  Folder,
  Calendar,
  CheckSquare,
  Upload,
  UserPlus,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { Spinner } from 'shared/components';
import { formatRelativeTime } from '../../utils/format';

interface ActivityFeedWidgetProps {
  id: string;
  config?: ActivityFeedWidgetConfig;
  onConfigChange?: (config: ActivityFeedWidgetConfig) => void;
  dashboardId: string;
  dashboardType: 'personal' | 'business' | 'educational' | 'household';
  dashboardName: string;
}

interface ActivityFeedWidgetConfig {
  maxItems: number;
  moduleFilters: string[];
}

interface ActivityItem {
  id: string;
  type: string;
  action: string;
  description: string;
  module: string;
  createdAt: string;
  user?: { name?: string; email?: string };
  metadata?: Record<string, unknown>;
}

const defaultConfig: ActivityFeedWidgetConfig = {
  maxItems: 8,
  moduleFilters: [],
};

const MODULE_ICONS: Record<string, React.ElementType> = {
  chat: MessageCircle,
  drive: Folder,
  calendar: Calendar,
  todo: CheckSquare,
  hr: UserPlus,
  default: Activity,
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  upload: Upload,
  create: FileText,
  message: MessageCircle,
  complete: CheckSquare,
};

const MODULE_COLORS: Record<string, string> = {
  chat: 'text-blue-600 bg-blue-100',
  drive: 'text-amber-600 bg-amber-100',
  calendar: 'text-green-600 bg-green-100',
  todo: 'text-violet-600 bg-violet-100',
  hr: 'text-teal-600 bg-teal-100',
  default: 'text-gray-600 bg-gray-100',
};

export default function ActivityFeedWidget({
  id,
  config,
  onConfigChange,
  dashboardId,
  dashboardType,
  dashboardName,
}: ActivityFeedWidgetProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialDoneRef = useRef(false);

  const safeConfig = config || defaultConfig;

  const fetchActivity = useCallback(
    async (opts?: { isInitial?: boolean }) => {
      const token = session?.accessToken;
      if (!token || !dashboardId) return;

      const isInitial = opts?.isInitial ?? !initialDoneRef.current;
      try {
        if (isInitial) {
          setLoading(true);
        }
        const res = await fetch(
          `/api/activity-feed?dashboardId=${dashboardId}&limit=${safeConfig.maxItems}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setActivities(data.activities || data.data || []);
        } else {
          setActivities([]);
        }
      } catch {
        setActivities([]);
      } finally {
        initialDoneRef.current = true;
        setLoading(false);
      }
    },
    [session?.accessToken, dashboardId, safeConfig.maxItems]
  );

  useEffect(() => {
    if (!session?.accessToken || !dashboardId) return;

    initialDoneRef.current = false;

    void fetchActivity({ isInitial: true });
    const interval = setInterval(() => {
      void fetchActivity({ isInitial: false });
    }, 120_000);

    const scheduleRefresh = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void fetchActivity({ isInitial: false });
      }, 400);
    };

    const handler = () => scheduleRefresh();
    void chatSocket.connect(session.accessToken).then(() => {
      chatSocket.on('activity_feed_refresh', handler);
    });

    return () => {
      clearInterval(interval);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      chatSocket.off('activity_feed_refresh', handler);
    };
  }, [session?.accessToken, dashboardId, fetchActivity]);

  const filteredActivities = safeConfig.moduleFilters.length > 0
    ? activities.filter((a) => safeConfig.moduleFilters.includes(a.module))
    : activities;

  const getIcon = (activity: ActivityItem) => {
    return ACTION_ICONS[activity.action] || MODULE_ICONS[activity.module] || MODULE_ICONS.default;
  };

  const getColor = (activity: ActivityItem) => {
    return MODULE_COLORS[activity.module] || MODULE_COLORS.default;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size={24} />
        <span className="ml-2 text-gray-600 dark:text-gray-400 text-sm">Loading activity...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Activity list */}
      {filteredActivities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Activity className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredActivities.slice(0, safeConfig.maxItems).map((activity) => {
            const Icon = getIcon(activity);
            const [iconColor, iconBg] = getColor(activity).split(' ');

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                  <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-gray-100">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{activity.module}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {formatRelativeTime(new Date(activity.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Settings toggle */}
      <div className="flex justify-end border-t border-gray-100 pt-2">
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
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span>Max items:</span>
            <select
              value={safeConfig.maxItems}
              onChange={(e) => onConfigChange({ ...safeConfig, maxItems: parseInt(e.target.value) })}
              className="text-sm border rounded px-2 py-1"
            >
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Module filters coming soon
          </div>
        </div>
      )}
    </div>
  );
}
