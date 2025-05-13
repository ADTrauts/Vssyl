'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  ThreadActivity,
  ActivityUser,
  ThreadPresence,
  ActivityFilter,
  ActivityStats,
  ActivityType,
  ActivityStatus,
  RealtimeActivity
} from '@/types/activity';

interface ActivityContextType {
  // Activity Management
  activities: ThreadActivity[];
  addActivity: (activity: Omit<ThreadActivity, 'id' | 'timestamp'>) => Promise<void>;
  updateActivity: (activityId: string, updates: Partial<ThreadActivity>) => Promise<void>;
  deleteActivity: (activityId: string) => Promise<void>;
  
  // Presence Management
  presence: Record<string, ThreadPresence>;
  updatePresence: (threadId: string, user: ActivityUser) => void;
  removePresence: (threadId: string, userId: string) => void;
  
  // Activity Filtering
  filterActivities: (filter: ActivityFilter) => ThreadActivity[];
  
  // Stats
  stats: ActivityStats | null;
  refreshStats: () => Promise<void>;
  
  // Realtime Activities
  realtimeActivities: RealtimeActivity[];
  startActivity: (threadId: string, type: ActivityType) => void;
  endActivity: (threadId: string, type: ActivityType) => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};

interface ActivityProviderProps {
  children: React.ReactNode;
}

export const ActivityProvider: React.FC<ActivityProviderProps> = ({ children }) => {
  const [activities, setActivities] = useState<ThreadActivity[]>([]);
  const [presence, setPresence] = useState<Record<string, ThreadPresence>>({});
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [realtimeActivities, setRealtimeActivities] = useState<RealtimeActivity[]>([]);

  const addActivity = useCallback(async (activity: Omit<ThreadActivity, 'id' | 'timestamp'>) => {
    const newActivity: ThreadActivity = {
      ...activity,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setActivities(prev => [...prev, newActivity]);
    // TODO: Implement API call to persist activity
  }, []);

  const updateActivity = useCallback(async (activityId: string, updates: Partial<ThreadActivity>) => {
    setActivities(prev =>
      prev.map(activity =>
        activity.id === activityId ? { ...activity, ...updates } : activity
      )
    );
    // TODO: Implement API call to update activity
  }, []);

  const deleteActivity = useCallback(async (activityId: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== activityId));
    // TODO: Implement API call to delete activity
  }, []);

  const updatePresence = useCallback((threadId: string, user: ActivityUser) => {
    setPresence(prev => {
      const threadPresence = prev[threadId] || { threadId, users: [], lastUpdated: new Date() };
      const updatedUsers = threadPresence.users
        .filter(u => u.id !== user.id)
        .concat(user);
      
      return {
        ...prev,
        [threadId]: {
          ...threadPresence,
          users: updatedUsers,
          lastUpdated: new Date(),
        },
      };
    });
  }, []);

  const removePresence = useCallback((threadId: string, userId: string) => {
    setPresence(prev => {
      const threadPresence = prev[threadId];
      if (!threadPresence) return prev;

      return {
        ...prev,
        [threadId]: {
          ...threadPresence,
          users: threadPresence.users.filter(u => u.id !== userId),
          lastUpdated: new Date(),
        },
      };
    });
  }, []);

  const filterActivities = useCallback((filter: ActivityFilter): ThreadActivity[] => {
    return activities.filter(activity => {
      if (filter.threadId && activity.threadId !== filter.threadId) return false;
      if (filter.userId && activity.userId !== filter.userId) return false;
      if (filter.type?.length && !filter.type.includes(activity.type)) return false;
      if (filter.status?.length && !filter.status.includes(activity.status)) return false;
      if (filter.dateRange) {
        const activityDate = new Date(activity.timestamp);
        if (activityDate < filter.dateRange.start || activityDate > filter.dateRange.end) {
          return false;
        }
      }
      return true;
    });
  }, [activities]);

  const refreshStats = useCallback(async () => {
    // TODO: Implement API call to get updated stats
    const calculatedStats: ActivityStats = {
      totalActivities: activities.length,
      activeUsers: new Set(activities.map(a => a.userId)).size,
      activityByType: activities.reduce((acc, activity) => {
        acc[activity.type] = (acc[activity.type] || 0) + 1;
        return acc;
      }, {} as Record<ActivityType, number>),
      activityByThread: activities.reduce((acc, activity) => {
        acc[activity.threadId] = (acc[activity.threadId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      userEngagement: Object.entries(
        activities.reduce((acc, activity) => {
          if (!acc[activity.userId]) {
            acc[activity.userId] = { count: 0, lastActive: activity.timestamp };
          }
          acc[activity.userId].count++;
          acc[activity.userId].lastActive = new Date(
            Math.max(new Date(acc[activity.userId].lastActive).getTime(), new Date(activity.timestamp).getTime())
          );
          return acc;
        }, {} as Record<string, { count: number; lastActive: Date }>)
      ).map(([userId, data]) => ({
        userId,
        activityCount: data.count,
        lastActive: data.lastActive,
      })),
    };
    setStats(calculatedStats);
  }, [activities]);

  const startActivity = useCallback((threadId: string, type: ActivityType) => {
    setRealtimeActivities(prev => {
      const existingActivity = prev.find(a => a.threadId === threadId && a.type === type);
      if (existingActivity) {
        return prev.map(a =>
          a.id === existingActivity.id
            ? { ...a, userCount: (a.userCount || 0) + 1 }
            : a
        );
      }
      return [...prev, {
        id: crypto.randomUUID(),
        threadId,
        type,
        userId: 'system',
        timestamp: new Date(),
        status: 'pending',
        metadata: {},
        isActive: true,
        userCount: 1,
      }];
    });
  }, []);

  const endActivity = useCallback((threadId: string, type: ActivityType) => {
    setRealtimeActivities(prev => {
      const existingActivity = prev.find(a => a.threadId === threadId && a.type === type);
      if (!existingActivity) return prev;

      const newUserCount = (existingActivity.userCount || 0) - 1;
      if (newUserCount <= 0) {
        return prev.filter(a => a.id !== existingActivity.id);
      }

      return prev.map(a =>
        a.id === existingActivity.id
          ? { ...a, userCount: newUserCount }
          : a
      );
    });
  }, []);

  useEffect(() => {
    // Clean up inactive realtime activities
    const cleanup = setInterval(() => {
      setRealtimeActivities(prev =>
        prev.filter(activity => activity.isActive && (activity.userCount || 0) > 0)
      );
    }, 60000); // Clean up every minute

    return () => clearInterval(cleanup);
  }, []);

  const value = {
    activities,
    addActivity,
    updateActivity,
    deleteActivity,
    presence,
    updatePresence,
    removePresence,
    filterActivities,
    stats,
    refreshStats,
    realtimeActivities,
    startActivity,
    endActivity,
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
}; 