'use client';

import React from 'react';
import { Thread } from '@/types/chat';
import { cn } from '@/lib/utils';
import { MessageBubble } from './MessageBubble';

interface ThreadViewProps {
  thread: Thread;
  className?: string;
}

export function ThreadView({ thread, className }: ThreadViewProps) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">{thread.title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {thread.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>
    </div>
  );
} 