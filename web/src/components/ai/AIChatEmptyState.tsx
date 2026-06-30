'use client';

import React from 'react';
import { Brain, MessageSquare, Plus } from 'lucide-react';
import { Button, EmptyState } from 'shared/components';

export type AIChatEmptyVariant = 'sidebar' | 'thread' | 'thread-welcome';

interface AIChatEmptyStateProps {
  variant: AIChatEmptyVariant;
  onAction?: () => void;
  /** Sidebar: no conversations match search */
  searchQuery?: string;
  /** Sidebar: viewing archived with none */
  showArchived?: boolean;
}

export function AIChatEmptyState({
  variant,
  onAction,
  searchQuery = '',
  showArchived = false,
}: AIChatEmptyStateProps) {
  if (variant === 'sidebar') {
    const title = searchQuery
      ? 'No conversations found'
      : showArchived
        ? 'No archived conversations'
        : 'No conversations yet';
    const description = searchQuery
      ? 'Try a different search term.'
      : showArchived
        ? 'Archived chats will appear here.'
        : 'Start a new conversation to get started.';

    return (
      <div className="px-4 py-8">
        <EmptyState
          icon={<MessageSquare className="h-12 w-12" />}
          title={title}
          description={description}
        />
        {!searchQuery && !showArchived && onAction ? (
          <div className="mt-4 flex justify-center">
            <Button variant="ghost" size="sm" onClick={onAction}>
              <Plus className="h-4 w-4 mr-1" />
              New conversation
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  if (variant === 'thread-welcome') {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md w-full">
          <EmptyState
            icon={<Brain className="h-16 w-16" />}
            title="Ask your first question"
            description="Ask me anything about your digital life. I can help you schedule meetings, organize files, analyze data, and much more."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <EmptyState
        icon={<Brain className="h-12 w-12" />}
        title="What's on your mind today?"
        description="I can help you with tasks, answer questions, and assist with your digital life."
      />
      {onAction ? (
        <div className="mt-6">
          <Button variant="primary" size="lg" onClick={onAction}>
            <Plus className="h-5 w-5 mr-2" />
            Start New Conversation
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default AIChatEmptyState;
