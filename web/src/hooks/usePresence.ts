import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useAuth } from './useAuth';

interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  currentThreadId?: string;
}

export const usePresence = (threadId?: string) => {
  const { user } = useAuth();
  const { sendMessage, subscribeToThread } = useWebSocket();
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [userPresence, setUserPresence] = useState<UserPresence | null>(null);

  const updatePresence = useCallback((status: 'online' | 'away' | 'offline') => {
    if (!user) return;

    sendMessage({
      type: 'presence:update',
      data: {
        userId: user.id,
        status,
        threadId
      }
    });
  }, [user, threadId, sendMessage]);

  useEffect(() => {
    if (!user) return;

    // Initial presence update
    updatePresence('online');

    // Set up activity tracking
    let activityTimeout: NodeJS.Timeout;
    const handleActivity = () => {
      updatePresence('online');
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => {
        updatePresence('away');
      }, 5 * 60 * 1000); // 5 minutes of inactivity
    };

    // Track various user activities
    const activities = ['mousemove', 'keydown', 'click', 'scroll'];
    activities.forEach(activity => {
      window.addEventListener(activity, handleActivity);
    });

    // Cleanup on unmount
    return () => {
      activities.forEach(activity => {
        window.removeEventListener(activity, handleActivity);
      });
      clearTimeout(activityTimeout);
      updatePresence('offline');
    };
  }, [user, updatePresence]);

  useEffect(() => {
    if (!threadId) return;

    const handleThreadPresence = (message: any) => {
      if (message.type === 'thread:presence' && message.data.threadId === threadId) {
        setPresences(message.data.presences);
      }
    };

    const handlePresenceUpdate = (message: any) => {
      if (message.type === 'presence:update') {
        if (message.data.userId === user?.id) {
          setUserPresence(message.data);
        }
        setPresences(prev => {
          const index = prev.findIndex(p => p.userId === message.data.userId);
          if (index === -1) {
            return [...prev, message.data];
          }
          const newPresences = [...prev];
          newPresences[index] = message.data;
          return newPresences;
        });
      }
    };

    subscribeToThread(threadId, handleThreadPresence);
    subscribeToThread(threadId, handlePresenceUpdate);

    return () => {
      // Cleanup subscriptions
    };
  }, [threadId, user?.id, subscribeToThread]);

  return {
    presences,
    userPresence,
    updatePresence
  };
}; 