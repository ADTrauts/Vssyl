import React from 'react';
import type { Message as ApiMessage, FileReference, User } from '@/types/api';
import { FileReferenceMessage } from './FileReferenceMessage';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MessageProps {
  message: ApiMessage;
  fileReferences?: FileReference[];
  className?: string;
  currentUserId?: string;
}

export const Message: React.FC<MessageProps> = ({
  message,
  fileReferences = [],
  className,
  currentUserId,
}) => {
  const isUser = message.senderId === currentUserId;

  return (
    <div
      className={cn(
        'flex gap-3 p-4',
        isUser ? 'flex-row-reverse' : 'flex-row',
        className
      )}
    >
      <Avatar className="h-8 w-8">
        {message.sender?.avatarUrl && (
          <AvatarImage
            src={message.sender.avatarUrl}
            alt={message.sender.name || 'User'}
          />
        )}
        <AvatarFallback>
          {message.sender?.name?.[0] || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className={cn('flex flex-col gap-2', isUser ? 'items-end' : 'items-start')}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {message.sender?.name || 'Unknown User'}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </span>
        </div>
        <div
          className={cn(
            'rounded-lg px-4 py-2',
            isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
          {message.edited && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>
        {fileReferences.length > 0 && (
          <div className="mt-2 space-y-2">
            {fileReferences.map((reference) => (
              <FileReferenceMessage
                key={reference.id}
                fileReference={reference}
                className={isUser ? 'ml-auto' : 'mr-auto'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 