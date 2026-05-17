'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { Socket } from 'socket.io-client';
import {
  acquireRealtimeConnection,
  getRealtimeSocket,
  releaseRealtimeConnection,
} from '@/lib/realtimeClient';

const HOLDER_ID = 'drive-ws';

interface DriveWebSocketEvents {
  onItemCreated?: (data: Record<string, unknown>) => void;
  onItemUpdated?: (data: Record<string, unknown>) => void;
  onItemDeleted?: (data: Record<string, unknown>) => void;
  onItemMoved?: (data: Record<string, unknown>) => void;
  onItemPinned?: (data: Record<string, unknown>) => void;
}

interface UseDriveWebSocketOptions {
  enabled?: boolean;
  events?: DriveWebSocketEvents;
}

export function useDriveWebSocket({
  enabled = true,
  events = {},
}: UseDriveWebSocketOptions) {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const eventsRef = useRef(events);
  const listenersAttachedRef = useRef(false);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  const connect = useCallback(async () => {
    if (!enabled || !session?.accessToken) {
      return;
    }

    if (socketRef.current?.connected) {
      return;
    }

    try {
      const socket = await acquireRealtimeConnection(session.accessToken, HOLDER_ID);
      socketRef.current = socket;

      if (!listenersAttachedRef.current) {
        socket.on('drive:item:created', (data: Record<string, unknown>) => {
          eventsRef.current.onItemCreated?.(data);
        });
        socket.on('drive:item:updated', (data: Record<string, unknown>) => {
          eventsRef.current.onItemUpdated?.(data);
        });
        socket.on('drive:item:deleted', (data: Record<string, unknown>) => {
          eventsRef.current.onItemDeleted?.(data);
        });
        socket.on('drive:item:moved', (data: Record<string, unknown>) => {
          eventsRef.current.onItemMoved?.(data);
        });
        socket.on('drive:item:pinned', (data: Record<string, unknown>) => {
          eventsRef.current.onItemPinned?.(data);
        });
        listenersAttachedRef.current = true;
      }
    } catch (error) {
      console.error('Failed to connect to Drive WebSocket:', error);
    }
  }, [enabled, session?.accessToken]);

  const disconnect = useCallback(() => {
    socketRef.current = null;
    releaseRealtimeConnection(HOLDER_ID);
    if (!getRealtimeSocket()) {
      listenersAttachedRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (enabled && session?.accessToken) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, session?.accessToken]);

  return {
    connect,
    disconnect,
  };
}
