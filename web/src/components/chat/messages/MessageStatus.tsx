'use client';

import React from 'react';
import { CheckIcon, AlertCircleIcon, ClockIcon, SendIcon, CheckCheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { MessageStatusType } from '@/types/chat';

interface MessageStatusProps {
  status: MessageStatusType;
  onRetry?: () => void;
  className?: string;
}

export const MessageStatus: React.FC<MessageStatusProps> = ({
  status,
  onRetry,
  className,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'sent':
        return <CheckIcon className="h-4 w-4 text-success" />;
      case 'delivered':
        return <CheckCheckIcon className="h-4 w-4 text-success" />;
      case 'read':
        return <CheckCheckIcon className="h-4 w-4 text-primary" />;
      case 'failed':
        return <AlertCircleIcon className="h-4 w-4 text-destructive" />;
      case 'sending':
        return <SendIcon className="h-4 w-4 text-muted-foreground animate-pulse" />;
      case 'received':
        return <ClockIcon className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'sent':
        return 'Message sent';
      case 'delivered':
        return 'Message delivered';
      case 'read':
        return 'Message read';
      case 'failed':
        return 'Failed to send';
      case 'sending':
        return 'Sending...';
      case 'received':
        return 'Message received';
      default:
        return '';
    }
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              {status === 'failed' && onRetry && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRetry();
                  }}
                >
                  <SendIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getStatusText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}; 