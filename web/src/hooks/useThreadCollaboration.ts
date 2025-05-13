import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './useSocket';
import type { 
  Collaborator,
  Version,
  Comment,
  Insight,
  ServerToClientEvents,
  ClientToServerEvents
} from '@/types/socket';
import type { Thread, ThreadActivity } from '@/types/thread';

/**
 * Represents the current collaboration state
 */
interface CollaborationState {
  /** List of current collaborators with timestamps */
  collaborators: {
    /** List of collaborators */
    items: Collaborator[];
    /** Timestamp when the list was last updated */
    lastUpdated: string;
  };
  /** List of thread versions with timestamps */
  versions: {
    /** List of versions */
    items: Version[];
    /** Timestamp when the list was last updated */
    lastUpdated: string;
  };
  /** List of comments with timestamps */
  comments: {
    /** List of comments */
    items: Comment[];
    /** Timestamp when the list was last updated */
    lastUpdated: string;
  };
  /** List of insights with timestamps */
  insights: {
    /** List of insights */
    items: Insight[];
    /** Timestamp when the list was last updated */
    lastUpdated: string;
  };
}

/**
 * Props for the useThreadCollaboration hook
 */
interface UseThreadCollaborationProps {
  /** ID of the thread to join */
  threadId: string;
  /** Callback when collaborators change */
  onCollaboratorsChange?: (collaborators: Collaborator[], lastUpdated: string) => void;
  /** Callback when versions change */
  onVersionsChange?: (versions: Version[], lastUpdated: string) => void;
  /** Callback when comments change */
  onCommentsChange?: (comments: Comment[], lastUpdated: string) => void;
  /** Callback when insights change */
  onInsightsChange?: (insights: Insight[], lastUpdated: string) => void;
  /** Callback when thread is updated */
  onThreadUpdate?: (thread: Thread) => void;
  /** Callback when thread activity occurs */
  onThreadActivity?: (activity: ThreadActivity) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

/**
 * Hook for managing thread collaboration functionality
 * @param props Configuration options for the hook
 * @returns Thread collaboration state and actions
 */
export const useThreadCollaboration = ({
  threadId,
  onCollaboratorsChange,
  onVersionsChange,
  onCommentsChange,
  onInsightsChange,
  onThreadUpdate,
  onThreadActivity,
  onError,
}: UseThreadCollaborationProps) => {
  const { socket, isConnected, error: socketError } = useSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || '',
    auth: {
      token: process.env.NEXT_PUBLIC_WS_TOKEN || '',
    },
    options: onError ? { onError } : null,
  });
  const [state, setState] = useState<CollaborationState>({
    collaborators: { items: [], lastUpdated: new Date().toISOString() },
    versions: { items: [], lastUpdated: new Date().toISOString() },
    comments: { items: [], lastUpdated: new Date().toISOString() },
    insights: { items: [], lastUpdated: new Date().toISOString() },
  });
  const [error, setError] = useState<Error | null>(null);

  // Handle socket errors
  useEffect(() => {
    if (socketError) {
      console.error('Socket error in useThreadCollaboration:', socketError);
      setError(socketError);
      onError?.(socketError);
    }
  }, [socketError, onError]);

  // Socket event handlers
  const handleCollaborators = useCallback((data: { collaborators: Collaborator[] }) => {
    try {
      const now = new Date().toISOString();
      setState(prev => {
        const newState = {
          ...prev,
          collaborators: {
            items: data.collaborators,
            lastUpdated: now,
          },
        };
        onCollaboratorsChange?.(newState.collaborators.items, now);
        return newState;
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to handle collaborators update');
      console.error('Error handling collaborators update:', error);
      setError(error);
      onError?.(error);
    }
  }, [onCollaboratorsChange, onError]);

  const handleVersions = useCallback((data: { versions: Version[] }) => {
    try {
      const now = new Date().toISOString();
      setState(prev => {
        const newState = {
          ...prev,
          versions: {
            items: data.versions,
            lastUpdated: now,
          },
        };
        onVersionsChange?.(newState.versions.items, now);
        return newState;
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to handle versions update');
      console.error('Error handling versions update:', error);
      setError(error);
      onError?.(error);
    }
  }, [onVersionsChange, onError]);

  const handleComments = useCallback((data: { comments: Comment[] }) => {
    try {
      const now = new Date().toISOString();
      setState(prev => {
        const newState = {
          ...prev,
          comments: {
            items: data.comments,
            lastUpdated: now,
          },
        };
        onCommentsChange?.(newState.comments.items, now);
        return newState;
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to handle comments update');
      console.error('Error handling comments update:', error);
      setError(error);
      onError?.(error);
    }
  }, [onCommentsChange, onError]);

  const handleInsights = useCallback((data: { insights: Insight[] }) => {
    try {
      const now = new Date().toISOString();
      setState(prev => {
        const newState = {
          ...prev,
          insights: {
            items: data.insights,
            lastUpdated: now,
          },
        };
        onInsightsChange?.(newState.insights.items, now);
        return newState;
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to handle insights update');
      console.error('Error handling insights update:', error);
      setError(error);
      onError?.(error);
    }
  }, [onInsightsChange, onError]);

  const handleThreadUpdate = useCallback((thread: Thread) => {
    try {
      onThreadUpdate?.(thread);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to handle thread update');
      console.error('Error handling thread update:', error);
      setError(error);
      onError?.(error);
    }
  }, [onThreadUpdate, onError]);

  const handleThreadActivity = useCallback((activity: ThreadActivity) => {
    try {
      onThreadActivity?.(activity);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to handle thread activity');
      console.error('Error handling thread activity:', error);
      setError(error);
      onError?.(error);
    }
  }, [onThreadActivity, onError]);

  // Generic event emitter with type safety
  const emitEvent = useCallback(<T extends keyof ClientToServerEvents>(
    event: T,
    ...args: Parameters<ClientToServerEvents[T]>
  ) => {
    if (!socket || !isConnected) {
      const error = new Error('Socket is not connected');
      console.warn(error.message);
      setError(error);
      onError?.(error);
      return;
    }
    try {
      socket.emit(event, ...args);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to emit socket event');
      console.error('Error emitting socket event:', error);
      setError(error);
      onError?.(error);
    }
  }, [socket, isConnected, onError]);

  // Socket connection and event handling
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Set up event listeners
    socket.on('thread:collaborators', handleCollaborators);
    socket.on('thread:versions', handleVersions);
    socket.on('thread:comments', handleComments);
    socket.on('thread:insights', handleInsights);
    socket.on('thread:update', handleThreadUpdate);
    socket.on('thread:activity', handleThreadActivity);

    // Join thread
    try {
      socket.emit('thread:join', threadId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to join thread');
      console.error('Error joining thread:', error);
      setError(error);
      onError?.(error);
    }

    // Cleanup function
    return () => {
      if (!socket) return;
      
      try {
        // Leave thread
        socket.emit('thread:leave', threadId);

        // Remove event listeners
        socket.off('thread:collaborators', handleCollaborators);
        socket.off('thread:versions', handleVersions);
        socket.off('thread:comments', handleComments);
        socket.off('thread:insights', handleInsights);
        socket.off('thread:update', handleThreadUpdate);
        socket.off('thread:activity', handleThreadActivity);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error during socket cleanup');
        console.error('Error during socket cleanup:', error);
        setError(error);
        onError?.(error);
      }
    };
  }, [
    socket,
    isConnected,
    threadId,
    handleCollaborators,
    handleVersions,
    handleComments,
    handleInsights,
    handleThreadUpdate,
    handleThreadActivity,
    onError
  ]);

  return {
    collaborators: state.collaborators.items,
    versions: state.versions.items,
    comments: state.comments.items,
    insights: state.insights.items,
    emitEvent,
    isConnected,
    error,
  };
}; 