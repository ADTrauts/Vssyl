import { useState, useEffect, useCallback } from 'react';
import { useWebSocket, type WebSocketMessage, type WebSocketMessageType } from '@/hooks/useWebSocket';
import { useAuth } from '@/contexts/auth-context';

const TYPING_TIMEOUT_MS = 5000;

type TypingEventData = {
  threadId: string;
  userId: string;
  isTyping: boolean;
};

interface UseTypingIndicatorOptions {
  timeoutMs?: number;
}

export const useTypingIndicator = (
  threadId: string,
  options: UseTypingIndicatorOptions = {}
) => {
  const { user } = useAuth();
  const { sendMessage } = useWebSocket({});
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const timeoutMs = options.timeoutMs ?? TYPING_TIMEOUT_MS;

  const clearTypingTimeout = useCallback(() => {
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  }, [typingTimeout]);

  const sendTypingEvent = useCallback(
    (isTyping: boolean) => {
      if (!user) return;

      try {
        const message: WebSocketMessage<TypingEventData> = {
          type: 'message' as WebSocketMessageType,
          data: { threadId, userId: user.id, isTyping },
          timestamp: Date.now()
        };
        sendMessage(message);
      } catch (error) {
        console.error('Failed to send typing event:', error);
      }
    },
    [user, threadId, sendMessage]
  );

  const startTyping = useCallback(() => {
    if (!user || isTyping) return;

    setIsTyping(true);
    sendTypingEvent(true);
    clearTypingTimeout();

    // Set a new timeout to stop typing
    const timeout = setTimeout(() => {
      stopTyping();
    }, timeoutMs);

    setTypingTimeout(timeout);
  }, [user, isTyping, timeoutMs, clearTypingTimeout, sendTypingEvent]);

  const stopTyping = useCallback(() => {
    if (!user || !isTyping) return;

    setIsTyping(false);
    sendTypingEvent(false);
    clearTypingTimeout();
  }, [user, isTyping, clearTypingTimeout, sendTypingEvent]);

  // Cleanup on unmount or when threadId changes
  useEffect(() => {
    return () => {
      clearTypingTimeout();
      if (isTyping) {
        stopTyping();
      }
    };
  }, [threadId, isTyping, stopTyping, clearTypingTimeout]);

  return {
    startTyping,
    stopTyping,
    isTyping
  };
}; 