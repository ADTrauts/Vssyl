'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { Socket } from 'socket.io-client';
import {
  acquireRealtimeConnection,
  getRealtimeSocket,
  releaseRealtimeConnection,
} from '@/lib/realtimeClient';

const HOLDER_ID = 'place-ws';

interface PlaceWebSocketEvents {
  onNodeAdded?: (data: Record<string, unknown>) => void;
  onNodeRemoved?: (data: Record<string, unknown>) => void;
  onConnectionAccepted?: (data: Record<string, unknown>) => void;
  onConnectionRequest?: (data: Record<string, unknown>) => void;
}

interface UsePlaceWebSocketOptions {
  enabled?: boolean;
  events?: PlaceWebSocketEvents;
}

export function usePlaceWebSocket({
  enabled = true,
  events = {},
}: UsePlaceWebSocketOptions) {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const eventsRef = useRef(events);
  const listenersAttachedRef = useRef(false);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  const connect = useCallback(async () => {
    if (!enabled || !session?.accessToken) return;
    if (socketRef.current?.connected) return;

    try {
      const socket = await acquireRealtimeConnection(session.accessToken, HOLDER_ID);
      socketRef.current = socket;

      if (!listenersAttachedRef.current) {
        socket.on('place:node:added', (data: Record<string, unknown>) => {
          eventsRef.current.onNodeAdded?.(data);
        });
        socket.on('place:node:removed', (data: Record<string, unknown>) => {
          eventsRef.current.onNodeRemoved?.(data);
        });
        socket.on('place:connection:accepted', (data: Record<string, unknown>) => {
          eventsRef.current.onConnectionAccepted?.(data);
        });
        socket.on('place:connection:request', (data: Record<string, unknown>) => {
          eventsRef.current.onConnectionRequest?.(data);
        });
        listenersAttachedRef.current = true;
      }
    } catch {
      // Connection failure is non-critical
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
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { connected: !!socketRef.current?.connected, disconnect };
}
