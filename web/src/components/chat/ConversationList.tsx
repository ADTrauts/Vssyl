'use client';

import { useChat } from '@/hooks/useChat';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConversationList() {
  const { conversations, activeConversation, setActiveConversation, createThread } = useChat();

  const handleNewConversation = () => {
    createThread('New Conversation');
  };

  if (!conversations?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
        <p>No conversations yet</p>
        <p className="text-sm">Start a new conversation to begin chatting</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={handleNewConversation}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Conversation
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <Button
        variant="outline"
        size="sm"
        className="mb-2"
        onClick={handleNewConversation}
      >
        <Plus className="mr-2 h-4 w-4" />
        New Conversation
      </Button>
      {conversations.map((conversation) => (
        <Button
          key={conversation.id}
          variant="ghost"
          onClick={() => setActiveConversation(conversation.id)}
          className={cn(
            'flex flex-col items-start gap-1 h-auto p-3 text-left',
            conversation.id === activeConversation?.id && 'bg-muted'
          )}
        >
          <span className="font-medium">{conversation.title}</span>
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
          </span>
        </Button>
      ))}
    </div>
  );
} 