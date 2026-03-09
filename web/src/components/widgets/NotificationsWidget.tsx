'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Bell,
  MessageCircle,
  Folder,
  Calendar,
  CheckSquare,
  Users,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Spinner, Badge } from 'shared/components';
import { formatRelativeTime } from '../../utils/format';

interface NotificationsWidgetProps {
  id: string;
  config?: NotificationsWidgetConfig;
  onConfigChange?: (config: NotificationsWidgetConfig) => void;
  dashboardId: string;
  dashboardType: 'personal' | 'business' | 'educational' | 'household';
  dashboardName: string;
}

interface NotificationsWidgetConfig {
  maxItems: number;
  showRead: boolean;
  categories: string[];
}

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

const defaultConfig: NotificationsWidgetConfig = {
  maxItems: 5,
  showRead: false,
  categories: ['chat', 'drive', 'calendar', 'todo', 'hr'],
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  chat: MessageCircle,
  drive: Folder,
  calendar: Calendar,
  todo: CheckSquare,
  hr: Users,
  default: Bell,
};

const CATEGORY_COLORS: Record<string, string> = {
  chat: 'text-blue-600 bg-blue-100',
  drive: 'text-amber-600 bg-amber-100',
  calendar: 'text-green-600 bg-green-100',
  todo: 'text-violet-600 bg-violet-100',
  hr: 'text-teal-600 bg-teal-100',
  default: 'text-gray-600 bg-gray-100',
};

export default function NotificationsWidget({
  id,
  config,
  onConfigChange,
  dashboardId,
  dashboardType,
  dashboardName,
}: NotificationsWidgetProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  const safeConfig = config || defaultConfig;

  useEffect(() => {
    if (!session?.accessToken) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          const items = data.notifications || data.data || [];
          setNotifications(items);
        }
      } catch {
        // Keep empty on error
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [session?.accessToken]);

  const filteredNotifications = notifications
    .filter((n) => {
      if (!safeConfig.showRead && n.read) return false;
      const category = n.type.split('_')[0];
      if (safeConfig.categories.length > 0 && !safeConfig.categories.includes(category)) {
        return false;
      }
      return true;
    })
    .slice(0, safeConfig.maxItems);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (notificationId: string) => {
    if (!session?.accessToken) return;
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch {
      // Ignore errors
    }
  };

  const getIcon = (type: string) => {
    const category = type.split('_')[0];
    return CATEGORY_ICONS[category] || CATEGORY_ICONS.default;
  };

  const getColor = (type: string) => {
    const category = type.split('_')[0];
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size={24} />
        <span className="ml-2 text-gray-600 text-sm">Loading notifications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with count */}
      {unreadCount > 0 && (
        <div className="flex items-center gap-2">
          <Badge size="sm" color="red">{unreadCount} unread</Badge>
        </div>
      )}

      {/* Notifications list */}
      {filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Bell className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-600">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => {
            const Icon = getIcon(notification.type);
            const [iconColor, iconBg] = getColor(notification.type).split(' ');
            return (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-2.5 rounded-lg border transition-colors ${
                  notification.read
                    ? 'border-gray-100 bg-gray-50/50'
                    : 'border-blue-200 bg-blue-50/30'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notification.read ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-gray-600 truncate">{notification.body}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatRelativeTime(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex-shrink-0"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* View all link */}
      <a
        href="/notifications"
        className="flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-700 py-1"
      >
        View all notifications
        <ExternalLink className="w-3 h-3" />
      </a>

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
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={safeConfig.showRead}
              onChange={(e) => onConfigChange({ ...safeConfig, showRead: e.target.checked })}
              className="rounded"
            />
            Show read notifications
          </label>
        </div>
      )}
    </div>
  );
}
