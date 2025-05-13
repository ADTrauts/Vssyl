import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './useSocket';
import type { 
  ReadReceipt,
  ServerToClientEvents,
  ClientToServerEvents
} from '@/types/socket';
import type { Thread, ThreadActivity } from '@/types/thread';

/**
 * Represents the typing state for users in a thread
 */
interface TypingState {
  /** Map of user IDs to their typing status */
  [userId: string]: {
    /** Whether the user is currently typing */
    isTyping: boolean;
    /** Timestamp when the typing status was last updated */
    lastUpdated: string;
  };
}

/**
 * Represents the read receipt state for messages in a thread
 */
interface ReadReceiptState {
  /** Map of message IDs to their read receipts */
  [messageId: string]: {
    /** List of read receipts for this message */
    receipts: ReadReceipt[];
    /** Timestamp when the receipts were last updated */
    lastUpdated: string;
  };
}

/**
 * Props for the useChatRealtime hook
 */
interface UseChatRealtimeProps {
  /** ID of the thread to join */
  threadId: string;
  /** Callback when typing status changes */
  onTypingChange?: (userId: string, isTyping: boolean, lastUpdated: string) => void;
  /** Callback when read receipt is received */
  onReadReceiptChange?: (messageId: string, readReceipts: ReadReceipt[], lastUpdated: string) => void;
  /** Callback when thread is updated */
  onThreadUpdate?: (thread: Thread) => void;
  /** Callback when thread activity occurs */
  onThreadActivity?: (activity: ThreadActivity) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

/**
 * Hook for managing real-time chat functionality
 * @param props Configuration options for the hook
 * @returns Chat state and actions
 */
export const useChatRealtime = ({
  threadId,
  onTypingChange,
  onReadReceiptChange,
  onThreadUpdate,
  onThreadActivity,
  onError,
}: UseChatRealtimeProps) => {
  const { socket, isConnected, error: socketError } = useSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || '',
    auth: {
      token: process.env.NEXT_PUBLIC_WS_TOKEN || '',
    },
    options: onError ? { onError } : null,
  });
  const [typingState, setTypingState] = useState<TypingState>({});
  const [readReceipts, setReadReceipts] = useState<ReadReceiptState>({});
  const [error, setError] = useState<Error | null>(null);

  // Handle socket errors
  useEffect(() => {
    if (socketError) {
      console.error('Socket error in useChatRealtime:', socketError);
      setError(socketError);
      onError?.(socketError);
    }
  }, [socketError, onError]);

  // Socket event handlers
  const handleTyping = useCallback((data: { userId: string; isTyping: boolean }) => {
    try {
      const now = new Date().toISOString();
      setTypingState(prev => {
        const newState = {
          ...prev,
          [data.userId]: {
            isTyping: data.isTyping,
            lastUpdated: now,
          },
        };
        onTypingChange?.(data.userId, data.isTyping, now);
        return newState;
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to handle typing update');
      console.error('Error handling typing update:', error);
      setError(error);
      onError?.(error);
    }
  }, [onTypingChange, onError]);

  const handleRead = useCallback((data: { messageId: string; userId: string }) => {
    try {
      const now = new Date().toISOString();
      setReadReceipts(prev => {
        const currentReceipts = prev[data.messageId]?.receipts || [];
        const readReceipt: ReadReceipt = {
          messageId: data.messageId,
          userId: data.userId,
          readAt: now,
        };
        const newReceipts = [...currentReceipts, readReceipt];
        const newState = {
          ...prev,
          [data.messageId]: {
            receipts: newReceipts,
            lastUpdated: now,
          },
        };
        onReadReceiptChange?.(data.messageId, newReceipts, now);
        return newState;
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to handle read receipt');
      console.error('Error handling read receipt:', error);
      setError(error);
      onError?.(error);
    }
  }, [onReadReceiptChange, onError]);

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
    socket.on('thread:typing', handleTyping);
    socket.on('thread:read', handleRead);
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
        socket.off('thread:typing', handleTyping);
        socket.off('thread:read', handleRead);
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
    handleTyping,
    handleRead,
    handleThreadUpdate,
    handleThreadActivity,
    onError
  ]);

  return {
    typingState,
    readReceipts,
    emitEvent,
    isConnected,
    error,
  };
}; 