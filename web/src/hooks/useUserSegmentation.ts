import { useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';

interface UserSegment {
  id: string;
  name: string;
  description: string;
  criteria: {
    engagementScore: number;
    activityLevel: 'low' | 'medium' | 'high';
    threadParticipation: number;
    responseTime: number;
  };
}

interface UserSegmentStats {
  segmentId: string;
  userCount: number;
  averageEngagement: number;
  averageActivity: number;
  averageResponseTime: number;
  topTags: string[];
  activeHours: number[];
}

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  engagementScore: number;
  threadParticipation: number;
  averageResponseTime: number;
  lastActive: string;
}

export const useUserSegmentation = () => {
  const [segments, setSegments] = useState<UserSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [segmentStats, setSegmentStats] = useState<UserSegmentStats | null>(null);
  const [segmentUsers, setSegmentUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSegments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/segmentation/segments');
      if (!response.ok) throw new Error('Failed to fetch segments');
      const data = await response.json();
      setSegments(data);
    } catch (error) {
      logger.error('Error fetching segments:', error);
      setError('Failed to fetch segments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSegmentStats = useCallback(async (segmentId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/segmentation/segments/${segmentId}/stats`);
      if (!response.ok) throw new Error('Failed to fetch segment stats');
      const data = await response.json();
      setSegmentStats(data);
    } catch (error) {
      logger.error('Error fetching segment stats:', error);
      setError('Failed to fetch segment stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSegmentUsers = useCallback(async (segmentId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/segmentation/segments/${segmentId}/users`);
      if (!response.ok) throw new Error('Failed to fetch segment users');
      const data = await response.json();
      setSegmentUsers(data);
    } catch (error) {
      logger.error('Error fetching segment users:', error);
      setError('Failed to fetch segment users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectSegment = useCallback(async (segmentId: string) => {
    setSelectedSegment(segmentId);
    await Promise.all([
      fetchSegmentStats(segmentId),
      fetchSegmentUsers(segmentId)
    ]);
  }, [fetchSegmentStats, fetchSegmentUsers]);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  return {
    segments,
    selectedSegment,
    segmentStats,
    segmentUsers,
    isLoading,
    error,
    selectSegment
  };
}; 