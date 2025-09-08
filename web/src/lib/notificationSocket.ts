import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';

export interface NotificationEvent {
  id: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  createdAt: string;
  read: boolean;
}

interface NotificationSocketHook {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  onNotification: (callback: (notification: NotificationEvent) => void) => void;
  onNotificationUpdate: (callback: (data: { id: string; read: boolean }) => void) => void;
  onNotificationDelete: (callback: (data: { id: string }) => void) => void;
}

export const useNotificationSocket = (): NotificationSocketHook => {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const isConnectedRef = useRef(false);

  const connect = useCallback(() => {
    if (!session?.accessToken || socketRef.current?.connected) {
      return;
    }

    try {
      socketRef.current = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000', {
        auth: {
          token: session.accessToken
        },
        transports: ['websocket', 'polling']
      });

      socketRef.current.on('connect', () => {
        console.log('Notification socket connected');
        isConnectedRef.current = true;
      });

      socketRef.current.on('disconnect', () => {
        console.log('Notification socket disconnected');
        isConnectedRef.current = false;
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Notification socket connection error:', error);
        isConnectedRef.current = false;
      });

    } catch (error) {
      console.error('Error connecting to notification socket:', error);
    }
  }, [session?.accessToken]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      isConnectedRef.current = false;
    }
  }, []);

  const onNotification = useCallback((callback: (notification: NotificationEvent) => void) => {
    if (socketRef.current) {
      socketRef.current.on('new_notification', callback);
    }
  }, []);

  const onNotificationUpdate = useCallback((callback: (data: { id: string; read: boolean }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('notification_updated', callback);
    }
  }, []);

  const onNotificationDelete = useCallback((callback: (data: { id: string }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('notification_deleted', callback);
    }
  }, []);

  useEffect(() => {
    if (session?.accessToken) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [session?.accessToken, connect, disconnect]);

  return {
    isConnected: isConnectedRef.current,
    connect,
    disconnect,
    onNotification,
    onNotificationUpdate,
    onNotificationDelete
  };
}; 