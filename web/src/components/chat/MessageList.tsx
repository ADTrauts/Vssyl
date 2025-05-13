'use client';

import React from 'react';
import type { ChatMessage } from '@/types/chat';
import { cn } from '@/lib/utils';

interface MessageListProps {
  messages: ChatMessage[];
  className?: string;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, className }) => {
  return (
    <div className={cn('flex flex-col gap-2 p-2 overflow-y-auto', className)}>
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            'p-2 rounded-lg',
            message.role === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted'
          )}
        >
          {message.content}
        </div>
      ))}
    </div>
  );
}; 