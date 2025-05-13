'use client';

import React, { useState } from 'react';
import { MessageThread as MessageThreadType } from '@/types/thread';
import { Thread } from './Thread';
import { Message } from '../chat/messages/Message';
import { MessageInput } from '../chat/messages/MessageInput';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThreadContext } from '@/contexts/thread-context';
import { useChatContext } from '@/contexts/chat-context';

interface MessageThreadProps {
  thread: MessageThreadType;
  participants: ThreadParticipant[];
  className?: string;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  thread,
  participants,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { messages } = useChatContext();
  const { addActivity } = useThreadContext();

  const threadMessages = messages.filter((msg) => thread.messages.includes(msg.id));
  const parentMessage = messages.find((msg) => msg.id === thread.parentMessageId);

  const handleReply = async (content: string) => {
    // Create new message
    const newMessage = {
      id: crypto.randomUUID(),
      content,
      type: 'text',
      senderId: 'current-user',
      userId: 'current-user',
      conversationId: thread.conversationId,
      threadId: thread.id,
      status: 'sending',
      sender: {
        id: 'current-user',
        name: 'Current User',
        avatar: '/avatars/default.png',
        status: 'online',
      },
    };

    // Add message to thread
    await addActivity(thread.id, {
      type: 'message',
      userId: 'current-user',
      data: { messageId: newMessage.id },
    });

    // Update thread messages
    thread.messages.push(newMessage.id);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Thread
        thread={thread}
        participants={participants}
        className={cn(
          'cursor-pointer transition-colors hover:bg-accent/5',
          isExpanded && 'bg-accent/5'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      />

      {isExpanded && (
        <div className="ml-8 space-y-4">
          {parentMessage && (
            <div className="rounded-lg border p-4">
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                Original Message
              </h4>
              <Message message={parentMessage} conversationId={thread.conversationId} />
            </div>
          )}

          <div className="space-y-4">
            {threadMessages.map((message) => (
              <Message
                key={message.id}
                message={message}
                conversationId={thread.conversationId}
              />
            ))}
          </div>

          <MessageInput
            conversationId={thread.conversationId}
            threadId={thread.id}
            placeholder="Reply in thread..."
            onSend={handleReply}
          />
        </div>
      )}

      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-muted-foreground"
        >
          {isExpanded ? (
            <>
              <ChevronUpIcon className="mr-1 h-3 w-3" />
              Collapse Thread
            </>
          ) : (
            <>
              <ChevronDownIcon className="mr-1 h-3 w-3" />
              Expand Thread ({threadMessages.length} replies)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}; 