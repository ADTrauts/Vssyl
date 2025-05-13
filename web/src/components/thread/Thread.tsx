'use client';

import React from 'react';
import { Thread as ThreadType, ThreadParticipant } from '@/types/thread';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { PinIcon, ArchiveIcon, TrashIcon } from 'lucide-react';
import { useThreadContext } from '@/contexts/thread-context';

interface ThreadProps {
  thread: ThreadType;
  participants: ThreadParticipant[];
  onPin?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const Thread: React.FC<ThreadProps> = ({
  thread,
  participants,
  onPin,
  onArchive,
  onDelete,
  className,
}) => {
  const { updateThread } = useThreadContext();

  const handlePin = () => {
    updateThread(thread.id, { isPinned: !thread.isPinned });
    onPin?.();
  };

  const handleArchive = () => {
    updateThread(thread.id, { status: 'archived' });
    onArchive?.();
  };

  const handleDelete = () => {
    updateThread(thread.id, { status: 'deleted' });
    onDelete?.();
  };

  return (
    <div className={cn('rounded-lg border p-4', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{thread.title}</h3>
            {thread.isPinned && (
              <PinIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          {thread.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {thread.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePin}
            className={cn(
              'h-8 w-8',
              thread.isPinned && 'text-primary'
            )}
          >
            <PinIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleArchive}
            className="h-8 w-8"
          >
            <ArchiveIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-8 w-8"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="flex -space-x-2">
          {participants.slice(0, 3).map((participant) => (
            <Avatar
              key={participant.id}
              src={participant.avatar}
              alt={participant.name}
              status={participant.status}
              className="h-6 w-6 border-2 border-background"
            />
          ))}
          {participants.length > 3 && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs">
              +{participants.length - 3}
            </div>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          Created by {participants.find(p => p.id === thread.createdBy)?.name} on{' '}
          {format(new Date(thread.createdAt), 'MMM d, yyyy')}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <span>Last updated {format(new Date(thread.updatedAt), 'MMM d, yyyy')}</span>
        <span>•</span>
        <span>{participants.length} participants</span>
      </div>
    </div>
  );
}; 