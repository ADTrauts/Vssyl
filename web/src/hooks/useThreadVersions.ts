import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useAuth } from './useAuth';
import { logger } from '../utils/logger';

interface ThreadVersion {
  id: string;
  threadId: string;
  content: string;
  version: number;
  createdBy: string;
  createdAt: Date;
  metadata: {
    changes: {
      type: 'insert' | 'delete' | 'replace';
      position: number;
      length: number;
      text?: string;
    }[];
    userAgent?: string;
  };
  createdByUser: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export const useThreadVersions = (threadId: string) => {
  const { user } = useAuth();
  const { sendMessage, subscribeToThread } = useWebSocket();
  const [versions, setVersions] = useState<ThreadVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/threads/${threadId}/versions`);
      if (!response.ok) {
        throw new Error('Failed to fetch versions');
      }
      const data = await response.json();
      setVersions(data);
    } catch (error) {
      logger.error('Error fetching versions:', error);
      setError('Failed to load version history');
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  const createVersion = useCallback(async (content: string, metadata: ThreadVersion['metadata']) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/threads/${threadId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          metadata
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create version');
      }

      const newVersion = await response.json();
      setVersions(prev => [newVersion, ...prev]);
      return newVersion;
    } catch (error) {
      logger.error('Error creating version:', error);
      throw error;
    }
  }, [threadId, user]);

  const rollbackToVersion = useCallback(async (version: number) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/threads/${threadId}/versions/${version}/rollback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to rollback version');
      }

      const newVersion = await response.json();
      setVersions(prev => [newVersion, ...prev]);
      return newVersion;
    } catch (error) {
      logger.error('Error rolling back version:', error);
      throw error;
    }
  }, [threadId, user]);

  const compareVersions = useCallback(async (version1: number, version2: number) => {
    try {
      const response = await fetch(`/api/threads/${threadId}/versions/compare?version1=${version1}&version2=${version2}`);
      if (!response.ok) {
        throw new Error('Failed to compare versions');
      }
      return await response.json();
    } catch (error) {
      logger.error('Error comparing versions:', error);
      throw error;
    }
  }, [threadId]);

  useEffect(() => {
    fetchVersions();

    const handleVersionUpdate = (message: any) => {
      if (message.type === 'version:update' && message.data.threadId === threadId) {
        setVersions(prev => [message.data, ...prev]);
      }
    };

    subscribeToThread(threadId, handleVersionUpdate);

    return () => {
      // Cleanup subscriptions
    };
  }, [threadId, fetchVersions, subscribeToThread]);

  return {
    versions,
    isLoading,
    error,
    createVersion,
    rollbackToVersion,
    compareVersions,
    refreshVersions: fetchVersions
  };
}; 