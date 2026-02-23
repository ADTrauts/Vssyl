'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Socket } from 'socket.io-client';
import { createWebSocketConnection } from '@/lib/websocketUtils';

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

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  const connect = useCallback(async () => {
    if (!enabled || !session?.accessToken) return;
    if (socketRef.current?.connected) return;

    try {
      const socket = await createWebSocketConnection(
        session.accessToken,
        () => {},
        () => {},
        () => {}
      );

      socketRef.current = socket;

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
    } catch {
      // Connection failure is handled by the websocket utils
    }
  }, [enabled, session?.accessToken]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => { disconnect(); };
  }, [connect, disconnect]);

  return { connected: !!socketRef.current?.connected, disconnect };
}
