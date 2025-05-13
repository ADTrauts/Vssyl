'use client';

import React from 'react';
import { AlertTriangleIcon, RefreshCwIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  error: Error;
  context?: Record<string, any>;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  showDetails?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  context,
  onRetry,
  onDismiss,
  className,
  showDetails = false,
}) => {
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangleIcon className="h-5 w-5" />
            Error Occurred
          </CardTitle>
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onDismiss}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>{error.message}</CardDescription>
      </CardHeader>

      {showDetails && (
        <CardContent>
          <div className="space-y-4">
            {error.stack && (
              <div>
                <h4 className="text-sm font-medium mb-2">Stack Trace</h4>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                  {error.stack}
                </pre>
              </div>
            )}
            {context && Object.keys(context).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Error Context</h4>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(context, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      )}

      <CardFooter className="flex gap-2 justify-end">
        {onRetry && (
          <Button variant="default" onClick={onRetry}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
        {onDismiss && (
          <Button variant="outline" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}; 