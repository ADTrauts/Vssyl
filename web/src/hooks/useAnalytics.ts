import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { logger } from '../utils/logger';

interface ThreadAnalytics {
  id: string;
  title: string;
  viewCount: number;
  replyCount: number;
  reactionCount: number;
  participantCount: number;
  averageTimeSpent: number;
  lastActivity: Date;
  engagementScore: number;
}

interface UserAnalytics {
  id: string;
  name: string;
  threadCount: number;
  replyCount: number;
  reactionCount: number;
  averageResponseTime: number;
  activeHours: number[];
  engagementScore: number;
}

interface TagAnalytics {
  name: string;
  threadCount: number;
  averageEngagement: number;
  trendingScore: number;
}

interface TimeRange {
  start: Date;
  end: Date;
}

interface ExportOptions {
  format: 'csv' | 'json' | 'excel';
  timeRange?: TimeRange;
  include?: {
    userStats?: boolean;
    threadStats?: boolean;
    tagStats?: boolean;
    trendingThreads?: boolean;
  };
}

export const useAnalytics = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getThreadAnalytics = useCallback(async (threadId: string): Promise<ThreadAnalytics> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics/threads/${threadId}`);
      if (!response.ok) {
        throw new Error('Failed to get thread analytics');
      }

      return await response.json();
    } catch (error) {
      logger.error('Error getting thread analytics:', error);
      setError('Failed to get thread analytics');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const getUserAnalytics = useCallback(async (
    userId: string,
    timeRange?: TimeRange
  ): Promise<UserAnalytics> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (timeRange) {
        queryParams.set('startDate', timeRange.start.toISOString());
        queryParams.set('endDate', timeRange.end.toISOString());
      }

      const response = await fetch(`/api/analytics/users/${userId}?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to get user analytics');
      }

      return await response.json();
    } catch (error) {
      logger.error('Error getting user analytics:', error);
      setError('Failed to get user analytics');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const getTagAnalytics = useCallback(async (
    timeRange?: TimeRange
  ): Promise<TagAnalytics[]> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (timeRange) {
        queryParams.set('startDate', timeRange.start.toISOString());
        queryParams.set('endDate', timeRange.end.toISOString());
      }

      const response = await fetch(`/api/analytics/tags?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to get tag analytics');
      }

      return await response.json();
    } catch (error) {
      logger.error('Error getting tag analytics:', error);
      setError('Failed to get tag analytics');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const getTrendingThreads = useCallback(async (limit?: number): Promise<ThreadAnalytics[]> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (limit) {
        queryParams.set('limit', limit.toString());
      }

      const response = await fetch(`/api/analytics/trending?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to get trending threads');
      }

      return await response.json();
    } catch (error) {
      logger.error('Error getting trending threads:', error);
      setError('Failed to get trending threads');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const exportAnalytics = useCallback(async (options: ExportOptions): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
      });

      if (!response.ok) {
        throw new Error('Failed to export analytics');
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `analytics-${new Date().toISOString().split('T')[0]}.${options.format}`;

      // Create a blob from the response
      const blob = await response.blob();

      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Error exporting analytics:', error);
      setError('Failed to export analytics');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    isLoading,
    error,
    getThreadAnalytics,
    getUserAnalytics,
    getTagAnalytics,
    getTrendingThreads,
    exportAnalytics
  };
}; 