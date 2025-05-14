'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Thread, ThreadActivity } from '@/types/thread';
import { useChatRealtime } from '@/hooks/useChatRealtime';

interface ThreadContextType {
  threads: Thread[];
  activeThread: Thread | null;
  threadActivities: Record<string, ThreadActivity[]>;
  createThread: (thread: Omit<Thread, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateThread: (threadId: string, updates: Partial<Thread>) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  setActiveThread: (thread: Thread | null) => void;
  addActivity: (threadId: string, activity: Omit<ThreadActivity, 'id' | 'timestamp'>) => Promise<void>;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

export const useThreadContext = () => {
  const context = useContext(ThreadContext);
  if (!context) {
    throw new Error('useThreadContext must be used within a ThreadProvider');
  }
  return context;
};

interface ThreadProviderProps {
  children: React.ReactNode;
  initialThreads?: Thread[];
}

export const ThreadProvider: React.FC<ThreadProviderProps> = ({
  children,
  initialThreads = [],
}) => {
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [threadActivities, setThreadActivities] = useState<Record<string, ThreadActivity[]>>({});

  const { emitEvent } = useChatRealtime({
    threadId: activeThread?.id || '',
    onThreadUpdate: (updatedThread) => {
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === updatedThread.id ? updatedThread : thread
        )
      );
    },
    onThreadActivity: (activity) => {
      setThreadActivities((prev) => ({
        ...prev,
        [activity.threadId]: [...(prev[activity.threadId] || []), activity],
      }));
    },
  });

  const createThread = useCallback(async (thread: Omit<Thread, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newThread: Thread = {
      ...thread,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setThreads((prev) => [...prev, newThread]);
    // TODO: Implement thread creation event or API call as needed
    // await emitEvent('thread:create', newThread);
  }, [emitEvent]);

  const updateThread = useCallback(async (threadId: string, updates: Partial<Thread>) => {
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === threadId
          ? { ...thread, ...updates, updatedAt: new Date() }
          : thread
      )
    );
    await emitEvent('thread:update', { threadId, updates });
  }, [emitEvent]);

  const deleteThread = useCallback(async (threadId: string) => {
    setThreads((prev) => prev.filter((thread) => thread.id !== threadId));
    // TODO: Implement thread deletion event or API call as needed
    // await emitEvent('thread:delete', { threadId });
  }, [emitEvent]);

  const addActivity = useCallback(async (
    threadId: string,
    activity: Omit<ThreadActivity, 'id' | 'timestamp'>
  ) => {
    const newActivity: ThreadActivity = {
      ...activity,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    setThreadActivities((prev) => ({
      ...prev,
      [threadId]: [...(prev[threadId] || []), newActivity],
    }));
    // TODO: Implement thread activity event or API call as needed
    // await emitEvent('thread:activity', newActivity);
  }, [emitEvent]);

  return (
    <ThreadContext.Provider
      value={{
        threads,
        activeThread,
        threadActivities,
        createThread,
        updateThread,
        deleteThread,
        setActiveThread,
        addActivity,
      }}
    >
      {children}
    </ThreadContext.Provider>
  );
}; 