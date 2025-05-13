'use client';

import React from 'react';
import { WifiIcon, WifiOffIcon, LoaderIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ConnectionState } from '@/lib/connection-manager';

interface ConnectionStatusProps {
  state: ConnectionState;
  onReconnect?: () => void;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  state,
  onReconnect,
  className,
}) => {
  const getStatusIcon = () => {
    switch (state) {
      case 'connected':
        return <WifiIcon className="h-4 w-4 text-success" />;
      case 'disconnected':
        return <WifiOffIcon className="h-4 w-4 text-destructive" />;
      case 'connecting':
      case 'reconnecting':
        return <LoaderIcon className="h-4 w-4 text-muted-foreground animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (state) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return 'Reconnecting...';
      default:
        return '';
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span className="text-sm text-muted-foreground">
                {getStatusText()}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getStatusText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {state === 'disconnected' && onReconnect && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={onReconnect}
        >
          Reconnect
        </Button>
      )}
    </div>
  );
}; 