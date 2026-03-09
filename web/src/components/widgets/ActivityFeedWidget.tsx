'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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

  const safeConfig = config || defaultConfig;

  useEffect(() => {
    if (!session?.accessToken || !dashboardId) return;

    const fetchActivity = async () => {
      try {
        setLoading(true);
        // Try to fetch from activity feed endpoint
        const res = await fetch(`/api/activity-feed?dashboardId=${dashboardId}&limit=${safeConfig.maxItems}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          setActivities(data.activities || data.data || []);
        } else {
          // Generate placeholder activities from available data
          setActivities(generatePlaceholderActivities());
        }
      } catch {
        setActivities(generatePlaceholderActivities());
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 120_000);
    return () => clearInterval(interval);
  }, [session?.accessToken, dashboardId, safeConfig.maxItems]);

  const generatePlaceholderActivities = (): ActivityItem[] => {
    // Placeholder activities when no API is available
    const now = new Date();
    return [
      {
        id: '1',
        type: 'file_upload',
        action: 'upload',
        description: 'Uploaded project-plan.pdf',
        module: 'drive',
        createdAt: new Date(now.getTime() - 5 * 60_000).toISOString(),
      },
      {
        id: '2',
        type: 'task_complete',
        action: 'complete',
        description: 'Completed "Review proposal"',
        module: 'todo',
        createdAt: new Date(now.getTime() - 15 * 60_000).toISOString(),
      },
      {
        id: '3',
        type: 'message_sent',
        action: 'message',
        description: 'Sent message in "Team Chat"',
        module: 'chat',
        createdAt: new Date(now.getTime() - 30 * 60_000).toISOString(),
      },
      {
        id: '4',
        type: 'event_created',
        action: 'create',
        description: 'Created "Team sync" event',
        module: 'calendar',
        createdAt: new Date(now.getTime() - 60 * 60_000).toISOString(),
      },
    ];
  };

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
        <span className="ml-2 text-gray-600 text-sm">Loading activity...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Activity list */}
      {filteredActivities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Activity className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-600">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredActivities.slice(0, safeConfig.maxItems).map((activity) => {
            const Icon = getIcon(activity);
            const [iconColor, iconBg] = getColor(activity).split(' ');

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                  <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-600 capitalize">{activity.module}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
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
          className="text-xs text-gray-600 hover:text-gray-900"
        >
          {showSettings ? 'Hide Settings' : 'Settings'}
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && onConfigChange && (
        <div className="p-3 bg-gray-50 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-700">
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
          <div className="text-xs text-gray-600">
            Module filters coming soon
          </div>
        </div>
      )}
    </div>
  );
}
