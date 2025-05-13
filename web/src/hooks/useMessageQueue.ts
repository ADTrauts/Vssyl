'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageQueue, QueuedMessage } from '@/lib/message-queue';
import { useToast } from '@/components/ui/use-toast';

interface UseMessageQueueOptions {
  onMessageSent?: (messageId: string) => void;
  onMessageFailed?: (messageId: string, error: Error) => void;
  onQueueChanged?: (messages: QueuedMessage[]) => void;
}

interface SendMessageOptions {
  id: string;
  content: string;
  type: 'text' | 'file';
  conversationId: string;
  threadId?: string;
  file?: any;
}

export function useMessageQueue({
  onMessageSent,
  onMessageFailed,
  onQueueChanged,
}: UseMessageQueueOptions = {}) {
  const [queue] = useState(() => new MessageQueue());
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const handleMessageSent = (message: QueuedMessage) => {
      setQueuedMessages(queue.getQueuedMessages());
      onMessageSent?.(message.id);
      onQueueChanged?.(queue.getQueuedMessages());
    };

    const handleMessageFailed = ({ message, error }: { message: QueuedMessage; error: Error }) => {
      setQueuedMessages(queue.getQueuedMessages());
      onMessageFailed?.(message.id, error);
      onQueueChanged?.(queue.getQueuedMessages());

      toast({
        title: 'Message Failed',
        description: `Failed to send message: ${error.message}`,
        variant: 'destructive',
      });
    };

    const handleMessageQueued = () => {
      setQueuedMessages(queue.getQueuedMessages());
      onQueueChanged?.(queue.getQueuedMessages());
    };

    const handleRetryScheduled = ({
      message,
      delay,
    }: {
      message: QueuedMessage;
      delay: number;
    }) => {
      toast({
        title: 'Retrying Message',
        description: `Will retry in ${Math.round(delay / 1000)} seconds`,
        variant: 'default',
      });
    };

    queue.on('message_sent', handleMessageSent);
    queue.on('message_failed', handleMessageFailed);
    queue.on('message_queued', handleMessageQueued);
    queue.on('message_retry_scheduled', handleRetryScheduled);

    return () => {
      queue.off('message_sent', handleMessageSent);
      queue.off('message_failed', handleMessageFailed);
      queue.off('message_queued', handleMessageQueued);
      queue.off('message_retry_scheduled', handleRetryScheduled);
    };
  }, [queue, onMessageSent, onMessageFailed, onQueueChanged, toast]);

  const sendMessage = useCallback(
    async (options: SendMessageOptions) => {
      try {
        await queue.enqueue(options);
      } catch (error) {
        toast({
          title: 'Error',
          description: (error as Error).message,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [queue, toast]
  );

  const retryMessage = useCallback(
    (messageId: string) => {
      const message = queuedMessages.find((msg) => msg.id === messageId);
      if (message && message.status === 'failed') {
        message.status = 'queued';
        message.retryCount = 0;
        queue.enqueue(message);
      }
    },
    [queue, queuedMessages]
  );

  const getMessageStatus = useCallback(
    (messageId: string) => {
      return queue.getMessageStatus(messageId);
    },
    [queue]
  );

  const clearQueue = useCallback(() => {
    queue.clearQueue();
    setQueuedMessages([]);
    onQueueChanged?.([]);
  }, [queue, onQueueChanged]);

  return {
    sendMessage,
    retryMessage,
    getMessageStatus,
    clearQueue,
    queuedMessages,
  };
} 