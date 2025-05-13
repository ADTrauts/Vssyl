'use client';

import React, { useEffect, useRef } from 'react';
import { useChatContext } from '@/contexts/chat-context';
import { Message } from '@/components/chat/Message';
import { MessageInput } from '@/components/chat/MessageInput';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThreadViewProps {
  className?: string;
}

export const ThreadView: React.FC<ThreadViewProps> = ({ className }) => {
  const { activeThreadId, threads, closeThread } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const thread = activeThreadId ? threads[activeThreadId] : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages]);

  if (!thread) return null;

  return (
    <div
      className={cn(
        'flex h-full w-[400px] flex-col border-l bg-background',
        className
      )}
    >
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">Thread</h3>
          <p className="text-sm text-muted-foreground">
            {thread.participants.length} participant
            {thread.participants.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={closeThread}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Parent Message */}
        <div className="relative">
          <div className="absolute inset-0 bg-accent/50 rounded-lg" />
          <Message message={thread.messages[0]} />
        </div>

        {/* Thread Messages */}
        <div className="border-t pt-4 mt-4">
          <div className="text-xs text-muted-foreground mb-4">
            {thread.messages.length - 1} repl{thread.messages.length - 1 !== 1 ? 'ies' : 'y'}
          </div>
          {thread.messages.slice(1).map((message) => (
            <Message key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <MessageInput
        threadId={thread.id}
        placeholder="Reply in thread..."
      />
    </div>
  );
}; 