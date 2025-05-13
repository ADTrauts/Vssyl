import React from 'react';
import { Message } from './Message';
import { MessageInput } from './MessageInput';
import { File } from '@/types/api';
import { fileReferenceService } from '@/services/fileReferenceService';
import { useToast } from '@/components/ui/use-toast';

interface MessagePanelProps {
  conversationId: string;
  threadId?: string;
  messages: Array<{
    id: string;
    content: string;
    senderId: string;
    sender?: {
      id: string;
      name: string;
      avatar?: string;
    };
    createdAt: string;
    fileReferences?: Array<{
      id: string;
      fileId: string;
      type: 'message' | 'thread' | 'conversation';
    }>;
  }>;
  onSendMessage: (content: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export const MessagePanel: React.FC<MessagePanelProps> = ({
  conversationId,
  threadId,
  messages,
  onSendMessage,
  onTyping,
  className,
  disabled,
}) => {
  const { toast } = useToast();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content: string, files?: File[]) => {
    try {
      // Send the message first
      await onSendMessage(content);

      // If there are files, create file references
      if (files && files.length > 0) {
        await Promise.all(
          files.map((file) =>
            fileReferenceService.createFileReference({
              fileId: file.id,
              conversationId,
              threadId,
              type: threadId ? 'thread' : 'conversation',
              metadata: {
                sharedAt: new Date().toISOString(),
              },
            })
          )
        );
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to send message',
      });
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              fileReferences={message.fileReferences}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="border-t p-4">
        <MessageInput
          onSend={handleSend}
          onTyping={onTyping}
          disabled={disabled}
          placeholder="Type a message..."
        />
      </div>
    </div>
  );
}; 