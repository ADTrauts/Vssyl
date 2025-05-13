import { useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';

interface ContentPerformanceMetrics {
  threadId: string;
  title: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  lastUpdated: Date;
  totalViews: number;
  uniqueViews: number;
  averageTimeSpent: number;
  engagementRate: number;
  completionRate: number;
  bounceRate: number;
  topReferrers: { source: string; count: number }[];
  userSegments: { segment: string; count: number }[];
  deviceTypes: { type: string; count: number }[];
  geographicData: { country: string; count: number }[];
  timeSeries: { date: Date; views: number; engagement: number }[];
}

export const useContentPerformance = () => {
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [threadMetrics, setThreadMetrics] = useState<ContentPerformanceMetrics | null>(null);
  const [topThreads, setTopThreads] = useState<ContentPerformanceMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThreadPerformance = useCallback(async (threadId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/content-performance/threads/${threadId}/performance`);
      if (!response.ok) throw new Error('Failed to fetch thread performance');
      const data = await response.json();
      setThreadMetrics(data);
    } catch (error) {
      logger.error('Error fetching thread performance:', error);
      setError('Failed to fetch thread performance metrics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTopPerformingThreads = useCallback(async (limit: number = 10) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/content-performance/threads/top-performing?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch top performing threads');
      const data = await response.json();
      setTopThreads(data);
    } catch (error) {
      logger.error('Error fetching top performing threads:', error);
      setError('Failed to fetch top performing threads');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectThread = useCallback(async (threadId: string) => {
    setSelectedThread(threadId);
    await fetchThreadPerformance(threadId);
  }, [fetchThreadPerformance]);

  useEffect(() => {
    fetchTopPerformingThreads();
  }, [fetchTopPerformingThreads]);

  return {
    selectedThread,
    threadMetrics,
    topThreads,
    isLoading,
    error,
    selectThread,
    fetchTopPerformingThreads
  };
}; 