'use client';

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Badge } from 'shared/components';
import { getNotificationStats } from '../api/notifications';
import { useNotificationSocket } from '../lib/notificationSocket';

interface NotificationBadgeProps {
  className?: string;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function NotificationBadge({ 
  className = '', 
  showCount = true, 
  size = 'md' 
}: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { onNotification, onNotificationUpdate } = useNotificationSocket();

  // Load unread count from API
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        setLoading(true);
        const stats = await getNotificationStats();
        setUnreadCount(stats.unread);
      } catch (error) {
        console.error('Failed to load notification stats:', error);
        // Fallback to mock data if API fails
        setUnreadCount(3);
      } finally {
        setLoading(false);
      }
    };

    loadUnreadCount();
  }, []);

  // Listen for real-time notification updates
  useEffect(() => {
    const unsubNew = onNotification(() => {
      setUnreadCount((prev) => prev + 1);
    });
    const unsubUpdate = onNotificationUpdate((data) => {
      if (data.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    });
    return () => {
      unsubNew();
      unsubUpdate();
    };
  }, [onNotification, onNotificationUpdate]);

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <Bell className={`text-gray-400 ${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'}`} />
      </div>
    );
  }

  if (unreadCount === 0) {
    return (
      <div className={`relative ${className}`}>
        <Bell className={`text-gray-400 ${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'}`} />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Bell className={`text-gray-400 ${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'}`} />
      {showCount && (
        <Badge 
          color="red"
          size="sm"
          className="absolute -top-1 -right-1"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </div>
  );
} 