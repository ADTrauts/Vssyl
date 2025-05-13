import React from 'react';
import { Thread, ThreadType } from '@/types/thread';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Pin, PinOff, Archive, Trash2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const getThreadTypeColor = (type: ThreadType) => {
  switch (type) {
    case 'message':
      return 'bg-blue-100 text-blue-800';
    case 'topic':
      return 'bg-green-100 text-green-800';
    case 'project':
      return 'bg-purple-100 text-purple-800';
    case 'decision':
      return 'bg-yellow-100 text-yellow-800';
    case 'documentation':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

interface ThreadListProps {
  threads: Thread[];
  onThreadSelect: (threadId: string) => void;
  onPinThread: (threadId: string) => void;
  onUnpinThread: (threadId: string) => void;
  onArchiveThread: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
}

export const ThreadList: React.FC<ThreadListProps> = ({
  threads,
  onThreadSelect,
  onPinThread,
  onUnpinThread,
  onArchiveThread,
  onDeleteThread,
}) => {
  const handleThreadAction = (action: string, threadId: string) => {
    switch (action) {
      case 'pin':
        onPinThread(threadId);
        break;
      case 'unpin':
        onUnpinThread(threadId);
        break;
      case 'archive':
        onArchiveThread(threadId);
        break;
      case 'delete':
        onDeleteThread(threadId);
        break;
    }
  };

  return (
    <div className="space-y-4">
      {threads.map(thread => (
        <Card
          key={thread.id}
          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onThreadSelect(thread.id)}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{thread.title}</h3>
                <Badge className={getThreadTypeColor(thread.type)}>
                  {thread.type}
                </Badge>
                {thread.isPinned && (
                  <Badge variant="secondary">
                    <Pin size={12} className="mr-1" />
                    Pinned
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {thread.description || 'No description available'}
              </p>
              <div className="flex flex-wrap gap-2">
                {thread.metadata?.tags?.map(tag => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {thread.isPinned ? (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleThreadAction('unpin', thread.id);
                      }}
                    >
                      <PinOff size={14} className="mr-2" />
                      Unpin
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleThreadAction('pin', thread.id);
                      }}
                    >
                      <Pin size={14} className="mr-2" />
                      Pin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleThreadAction('archive', thread.id);
                    }}
                  >
                    <Archive size={14} className="mr-2" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleThreadAction('delete', thread.id);
                    }}
                    className="text-red-600"
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <div>
              {thread.participants.length} participant
              {thread.participants.length !== 1 ? 's' : ''}
            </div>
            {thread.metadata?.status && (
              <Badge variant="outline">
                {thread.metadata.status}
              </Badge>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}; 