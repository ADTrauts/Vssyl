import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useAuth } from './useAuth';
import { logger } from '../utils/logger';

interface Notification {
  id: string;
  type: 'mention' | 'reply' | 'assignment' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  metadata: {
    threadId?: string;
    messageId?: string;
    assignedById?: string;
    dueDate?: Date;
  };
  isRead: boolean;
  createdAt: Date;
}

interface UnreadCount {
  total: number;
  byPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { sendMessage, subscribeToUser } = useWebSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<UnreadCount>({
    total: 0,
    byPriority: {
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (options: {
    limit?: number;
    unreadOnly?: boolean;
    priority?: Notification['priority'];
  } = {}) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (options.limit) queryParams.set('limit', options.limit.toString());
      if (options.unreadOnly) queryParams.set('unreadOnly', 'true');
      if (options.priority) queryParams.set('priority', options.priority);

      const response = await fetch(`/api/notifications?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/notifications/unread-count');
      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }
      const data = await response.json();
      setUnreadCount(data);
    } catch (error) {
      logger.error('Error fetching unread count:', error);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      await fetchUnreadCount();
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  }, [user, fetchUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      await fetchUnreadCount();
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
    }
  }, [user, fetchUnreadCount]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      await fetchUnreadCount();
    } catch (error) {
      logger.error('Error deleting notification:', error);
    }
  }, [user, fetchUnreadCount]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();

      const handleNotificationUpdate = (message: any) => {
        if (message.type === 'notification:new') {
          setNotifications(prev => [message.data, ...prev]);
          fetchUnreadCount();
        } else if (message.type === 'notification:update') {
          setNotifications(prev => prev.map(n => 
            n.id === message.data.id ? message.data : n
          ));
          fetchUnreadCount();
        } else if (message.type === 'notification:delete') {
          setNotifications(prev => prev.filter(n => n.id !== message.data.id));
          fetchUnreadCount();
        } else if (message.type === 'notifications:update') {
          fetchNotifications();
          fetchUnreadCount();
        }
      };

      subscribeToUser(user.id, handleNotificationUpdate);

      return () => {
        // Cleanup subscriptions
      };
    }
  }, [user, fetchNotifications, fetchUnreadCount, subscribeToUser]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshUnreadCount: fetchUnreadCount
  };
}; 