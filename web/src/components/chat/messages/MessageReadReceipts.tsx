'use client';

import React from 'react';
import { Avatar, AvatarGroup } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ReadReceipt {
  userId: string;
  name: string;
  avatar: string;
  timestamp: string;
}

interface MessageReadReceiptsProps {
  readBy: ReadReceipt[];
  className?: string;
}

export const MessageReadReceipts: React.FC<MessageReadReceiptsProps> = ({
  readBy,
  className,
}) => {
  if (!readBy.length) return null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <AvatarGroup>
              {readBy.map((receipt) => (
                <Avatar
                  key={receipt.userId}
                  src={receipt.avatar}
                  alt={receipt.name}
                  className="h-5 w-5 border-2 border-background"
                />
              ))}
            </AvatarGroup>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              {readBy.map((receipt) => (
                <div key={receipt.userId} className="flex items-center gap-2">
                  <Avatar
                    src={receipt.avatar}
                    alt={receipt.name}
                    className="h-4 w-4"
                  />
                  <span className="text-xs">{receipt.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(receipt.timestamp), 'p')}
                  </span>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}; 