'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { errorLogger } from '@/lib/error-logger';

interface ErrorHandlerOptions {
  context?: string;
  onError?: (error: Error) => void;
  onRecovery?: () => void;
  showToast?: boolean;
}

interface ErrorState {
  error: Error | null;
  errorId: string | null;
  context: Record<string, unknown>;
  timestamp: number;
}

export function useErrorHandler({
  context = 'unknown',
  onError,
  onRecovery,
  showToast = true,
}: ErrorHandlerOptions = {}) {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    errorId: null,
    context: {},
    timestamp: 0,
  });
  const { toast } = useToast();

  const handleError = useCallback(
    (error: Error, additionalContext?: Record<string, unknown>) => {
      const errorContext = {
        context,
        ...additionalContext,
      };

      const errorId = errorLogger.log(error, errorContext);

      setErrorState({
        error,
        errorId,
        context: errorContext,
        timestamp: Date.now(),
      });

      onError?.(error);

      if (showToast) {
        toast({
          title: 'Error Occurred',
          description: error.message,
          variant: 'destructive',
        });
      }

      return errorId;
    },
    [context, onError, showToast, toast]
  );

  const clearError = useCallback(() => {
    if (errorState.errorId) {
      errorLogger.markAsHandled(errorState.errorId);
    }
    setErrorState({
      error: null,
      errorId: null,
      context: {},
      timestamp: 0,
    });
  }, [errorState.errorId]);

  const recover = useCallback(() => {
    clearError();
    onRecovery?.();
  }, [clearError, onRecovery]);

  const wrapPromise = useCallback(
    async <T,>(promise: Promise<T>, errorContext?: Record<string, unknown>): Promise<T> => {
      try {
        return await promise;
      } catch (error) {
        handleError(error as Error, errorContext);
        throw error;
      }
    },
    [handleError]
  );

  const tryCallback = useCallback(
    <T extends unknown[]>(
      callback: (...args: T) => void,
      errorContext?: Record<string, unknown>
    ) => {
      return (...args: T) => {
        try {
          return callback(...args);
        } catch (error) {
          handleError(error as Error, errorContext);
          throw error;
        }
      };
    },
    [handleError]
  );

  return {
    error: errorState.error,
    errorId: errorState.errorId,
    errorContext: errorState.context,
    errorTimestamp: errorState.timestamp,
    handleError,
    clearError,
    recover,
    wrapPromise,
    tryCallback,
  };
} 