'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConnectionManager, ConnectionState } from '@/lib/connection-manager';
import { useToast } from '@/components/ui/use-toast';

interface UseConnectionOptions {
  url: string;
  onMessage?: (data: any) => void;
  onStateChange?: (state: ConnectionState) => void;
  onError?: (error: Error) => void;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
}

export function useConnection({
  url,
  onMessage,
  onStateChange,
  onError,
  reconnectDelay = 1000,
  maxReconnectAttempts = 5,
  heartbeatInterval = 30000,
  heartbeatTimeout = 5000,
}: UseConnectionOptions) {
  const [manager] = useState(
    () =>
      new ConnectionManager({
        url,
        reconnectDelay,
        maxReconnectAttempts,
        heartbeatInterval,
        heartbeatTimeout,
      })
  );
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const { toast } = useToast();

  useEffect(() => {
    const handleStateChange = (state: ConnectionState) => {
      setConnectionState(state);
      onStateChange?.(state);

      switch (state) {
        case 'connected':
          toast({
            title: 'Connected',
            description: 'Successfully connected to the server',
            variant: 'default',
          });
          break;
        case 'reconnecting':
          toast({
            title: 'Reconnecting',
            description: 'Attempting to reconnect...',
            variant: 'default',
          });
          break;
        case 'disconnected':
          toast({
            title: 'Disconnected',
            description: 'Lost connection to the server',
            variant: 'destructive',
          });
          break;
      }
    };

    const handleMessage = (data: any) => {
      onMessage?.(data);
    };

    const handleError = (error: Error) => {
      onError?.(error);
      toast({
        title: 'Connection Error',
        description: error.message,
        variant: 'destructive',
      });
    };

    const handleMaxReconnectAttempts = () => {
      toast({
        title: 'Connection Failed',
        description: 'Maximum reconnection attempts reached',
        variant: 'destructive',
      });
    };

    manager.on('state_change', handleStateChange);
    manager.on('message', handleMessage);
    manager.on('error', handleError);
    manager.on('max_reconnect_attempts', handleMaxReconnectAttempts);

    // Start connection
    manager.connect();

    return () => {
      manager.off('state_change', handleStateChange);
      manager.off('message', handleMessage);
      manager.off('error', handleError);
      manager.off('max_reconnect_attempts', handleMaxReconnectAttempts);
      manager.disconnect();
    };
  }, [manager, onMessage, onStateChange, onError, toast]);

  const send = useCallback(
    (data: any) => {
      return manager.send(data);
    },
    [manager]
  );

  const connect = useCallback(() => {
    manager.connect();
  }, [manager]);

  const disconnect = useCallback(() => {
    manager.disconnect();
  }, [manager]);

  return {
    isConnected: connectionState === 'connected',
    isConnecting: connectionState === 'connecting',
    isReconnecting: connectionState === 'reconnecting',
    connectionState,
    send,
    connect,
    disconnect,
  };
} 