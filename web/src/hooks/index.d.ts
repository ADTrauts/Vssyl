declare module '@/hooks/useFileReferences' {
  import { FileReference } from '@/types/api';
  
  interface UseFileReferencesResult {
    fileReferences: FileReference[];
    isLoading: boolean;
    error: Error | null;
  }

  export function useFileReferences(messageId: string): UseFileReferencesResult;
}

declare module '@/hooks/useMessageQueue' {
  import { QueuedMessage } from '@/lib/message-queue';

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

  export function useMessageQueue(options?: UseMessageQueueOptions): {
    sendMessage: (options: SendMessageOptions) => Promise<void>;
    retryMessage: (messageId: string) => void;
    getMessageStatus: (messageId: string) => QueuedMessage['status'] | null;
    clearQueue: () => void;
    queuedMessages: QueuedMessage[];
  };
} 