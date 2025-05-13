'use client';

import React, { useState } from 'react';
import type { Message as MessageType, MessageStatusType } from '@/types/chat';
import type { FileReference } from '@/types/api';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MessageStatus } from './MessageStatus';
import { MessageReactions } from './MessageReactions';
import { MessageActions } from './MessageActions';
import { MessageTypingIndicator } from './MessageTypingIndicator';
import { MessageReadReceipts } from './MessageReadReceipts';
import { FilePreview } from '@/components/chat/FilePreview';
import { FileReferenceMessage } from '@/components/chat/FileReferenceMessage';
import { useChatContext } from '@/contexts/chat-context';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useChatRealtime } from '@/hooks/useChatRealtime';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFileReferences } from '@/hooks/useFileReferences';
import { useMessageQueue } from '@/hooks/useMessageQueue';

interface MessageProps {
  message: MessageType;
  conversationId: string;
  className?: string;
}

export const Message: React.FC<MessageProps> = ({
  message,
  conversationId,
  className,
}) => {
  const { editMessage, createThread } = useChatContext();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);
  const isCurrentUser = user?.id === message.sender.id;

  const { readReceipts, typingUsers } = useChatRealtime({
    conversationId,
    messageId: message.id,
  });

  const { fileReferences, isLoading: isLoadingFiles, error: fileError } = useFileReferences(message.id);
  const { retryMessage } = useMessageQueue();

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(message.content);
  };

  const handleSave = async () => {
    if (editedContent.trim() !== message.content) {
      await editMessage(message.id, editedContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent(message.content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleThreadClick = async () => {
    try {
      await createThread(message.id, '');
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
  };

  return (
    <div
      className={cn(
        'group flex items-start gap-3 hover:bg-accent/5 rounded-lg p-2 transition-colors',
        isCurrentUser && 'flex-row-reverse',
        className
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Avatar className="h-8 w-8">
        {message.sender.avatarUrl ? (
          <AvatarImage src={message.sender.avatarUrl} alt={message.sender.name} />
        ) : (
          <AvatarFallback>{message.sender.name[0]}</AvatarFallback>
        )}
      </Avatar>

      <div className={cn('flex flex-col gap-1', isCurrentUser && 'items-end')}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{message.sender.name}</span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.createdAt), 'p')}
          </span>
          {message.editedAt && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
          {typingUsers?.length > 0 && !isCurrentUser && (
            <MessageTypingIndicator className="ml-2" />
          )}
        </div>

        <div className="flex items-end gap-2">
          <div
            className={cn(
              'rounded-lg p-3',
              isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-accent'
            )}
          >
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="flex-1"
                />
                <Button size="sm" onClick={handleSave}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            ) : message.type === 'text' ? (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            ) : message.type === 'file' && message.files?.[0] ? (
              <FilePreview file={message.files[0]} />
            ) : null}
          </div>

          {showActions && !isEditing && (
            <div className="flex items-center gap-1">
              <MessageActions message={message} onEdit={handleEdit} />
              <MessageReactions message={message} />
              <button
                onClick={handleThreadClick}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Reply in Thread
              </button>
            </div>
          )}
        </div>

        {/* File References */}
        {isLoadingFiles ? (
          <div className="mt-2 text-sm text-muted-foreground">Loading files...</div>
        ) : fileError ? (
          <div className="mt-2 text-sm text-destructive">Failed to load files</div>
        ) : fileReferences.length > 0 && (
          <div className="mt-2 space-y-2">
            {fileReferences.map((reference: FileReference) => (
              <FileReferenceMessage
                key={reference.id}
                fileReference={reference}
                className="mt-1"
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {message.status && (
            <MessageStatus 
              status={message.status} 
              className="mt-1"
              {...(message.status === 'failed' ? {
                onRetry: () => retryMessage(message.id)
              } : {})}
            />
          )}
          {isCurrentUser && readReceipts && Object.keys(readReceipts).length > 0 && (
            <MessageReadReceipts
              readBy={Object.entries(readReceipts).map(([userId, receipt]) => ({
                userId,
                name: receipt.name,
                avatar: receipt.avatar || '',
                timestamp: receipt.timestamp,
              }))}
              className="mt-1"
            />
          )}
        </div>
      </div>
    </div>
  );
}; 