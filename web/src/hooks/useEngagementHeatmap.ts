import { useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';

interface HeatmapData {
  hour: number;
  day: number;
  value: number;
}

interface ThreadEngagement {
  threadId: string;
  title: string;
  heatmap: HeatmapData[];
  totalEngagement: number;
  peakHour: number;
  peakDay: number;
}

interface UserEngagement {
  userId: string;
  name: string;
  heatmap: HeatmapData[];
  totalEngagement: number;
  peakHour: number;
  peakDay: number;
}

export const useEngagementHeatmap = () => {
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [threadHeatmap, setThreadHeatmap] = useState<ThreadEngagement | null>(null);
  const [userHeatmap, setUserHeatmap] = useState<UserEngagement | null>(null);
  const [topThreads, setTopThreads] = useState<ThreadEngagement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThreadHeatmap = useCallback(async (threadId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/engagement-heatmap/threads/${threadId}/heatmap`);
      if (!response.ok) throw new Error('Failed to fetch thread heatmap');
      const data = await response.json();
      setThreadHeatmap(data);
    } catch (error) {
      logger.error('Error fetching thread heatmap:', error);
      setError('Failed to fetch thread heatmap');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUserHeatmap = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/engagement-heatmap/users/${userId}/heatmap`);
      if (!response.ok) throw new Error('Failed to fetch user heatmap');
      const data = await response.json();
      setUserHeatmap(data);
    } catch (error) {
      logger.error('Error fetching user heatmap:', error);
      setError('Failed to fetch user heatmap');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTopEngagedThreads = useCallback(async (limit: number = 10) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/engagement-heatmap/threads/top-engaged?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch top engaged threads');
      const data = await response.json();
      setTopThreads(data);
    } catch (error) {
      logger.error('Error fetching top engaged threads:', error);
      setError('Failed to fetch top engaged threads');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectThread = useCallback(async (threadId: string) => {
    setSelectedThread(threadId);
    setSelectedUser(null);
    await fetchThreadHeatmap(threadId);
  }, [fetchThreadHeatmap]);

  const selectUser = useCallback(async (userId: string) => {
    setSelectedUser(userId);
    setSelectedThread(null);
    await fetchUserHeatmap(userId);
  }, [fetchUserHeatmap]);

  useEffect(() => {
    fetchTopEngagedThreads();
  }, [fetchTopEngagedThreads]);

  return {
    selectedThread,
    selectedUser,
    threadHeatmap,
    userHeatmap,
    topThreads,
    isLoading,
    error,
    selectThread,
    selectUser,
    fetchTopEngagedThreads
  };
}; 