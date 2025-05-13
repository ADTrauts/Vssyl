'use client';

import React, { useState } from 'react';
import { TopicThread as TopicThreadType } from '@/types/thread';
import { Thread } from './Thread';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon, ChevronUpIcon, TagIcon, LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThreadContext } from '@/contexts/thread-context';
import { MessageInput } from '../chat/messages/MessageInput';
import { Message } from '../chat/messages/Message';
import { useChatContext } from '@/contexts/chat-context';

interface TopicThreadProps {
  thread: TopicThreadType;
  participants: ThreadParticipant[];
  className?: string;
}

export const TopicThread: React.FC<TopicThreadProps> = ({
  thread,
  participants,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { messages } = useChatContext();
  const { addActivity } = useThreadContext();

  const topicMessages = messages.filter((msg) => 
    msg.threadId === thread.id && msg.conversationId === thread.conversationId
  );

  const handleReply = async (content: string) => {
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

    await addActivity(thread.id, {
      type: 'message',
      userId: 'current-user',
      data: { messageId: newMessage.id },
    });
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
          <div className="flex flex-wrap gap-2">
            {thread.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-xs"
              >
                <TagIcon className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>

          {thread.resources.length > 0 && (
            <div className="rounded-lg border p-4">
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                Resources
              </h4>
              <div className="space-y-2">
                {thread.resources.map((resource) => (
                  <a
                    key={resource}
                    href={resource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <LinkIcon className="h-4 w-4" />
                    {resource}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {topicMessages.map((message) => (
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
            placeholder="Add to the discussion..."
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
              Collapse Topic
            </>
          ) : (
            <>
              <ChevronDownIcon className="mr-1 h-3 w-3" />
              Expand Topic ({topicMessages.length} messages)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}; 