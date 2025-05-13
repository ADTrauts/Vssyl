'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface MessageTypingIndicatorProps {
  className?: string;
}

export const MessageTypingIndicator: React.FC<MessageTypingIndicatorProps> = ({
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-full bg-accent/50',
        className
      )}
    >
      <div className="flex gap-1">
        <span className="h-2 w-2 rounded-full bg-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="h-2 w-2 rounded-full bg-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="h-2 w-2 rounded-full bg-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}; 