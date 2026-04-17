import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
import { getWebSocketConfig } from './websocketUtils';

export interface NotificationEvent {
  id: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  createdAt: string;
  read: boolean;
}

export type NotificationUpdatePayload = { id: string; read?: boolean; deleted?: boolean };

interface NotificationSocketHook {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  onNotification: (callback: (notification: NotificationEvent) => void) => () => void;
  onNotificationUpdate: (callback: (data: NotificationUpdatePayload) => void) => () => void;
  onNotificationDelete: (callback: (data: { id: string }) => void) => () => void;
}

type DeletePayload = { id: string };

let socket: Socket | null = null;
let activeToken: string | null = null;
let connectionHolders = 0;

const newNotificationListeners = new Set<(n: NotificationEvent) => void>();
const notificationUpdatedListeners = new Set<(data: NotificationUpdatePayload) => void>();
const notificationDeletedListeners = new Set<(data: DeletePayload) => void>();

const connectionListeners = new Set<(connected: boolean) => void>();

function notifyConnection(connected: boolean): void {
  connectionListeners.forEach((fn) => {
    try {
      fn(connected);
    } catch {
      /* ignore subscriber errors */
    }
  });
}

function attachSocketForwarding(s: Socket): void {
  s.off('new_notification');
  s.off('notification_updated');
  s.off('notification_deleted');
  s.on('new_notification', (payload: NotificationEvent) => {
    newNotificationListeners.forEach((cb) => {
      try {
        cb(payload);
      } catch {
        /* ignore */
      }
    });
  });
  s.on('notification_updated', (payload: NotificationUpdatePayload) => {
    notificationUpdatedListeners.forEach((cb) => {
      try {
        cb(payload);
      } catch {
        /* ignore */
      }
    });
  });
  s.on('notification_deleted', (payload: DeletePayload) => {
    notificationDeletedListeners.forEach((cb) => {
      try {
        cb(payload);
      } catch {
        /* ignore */
      }
    });
  });
}

function teardownSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    if (socket.connected) {
      socket.disconnect();
    }
    socket = null;
  }
  activeToken = null;
  notifyConnection(false);
}

function ensureSocket(token: string): void {
  if (activeToken === token && socket) {
    return;
  }
  teardownSocket();
  activeToken = token;
  const config = getWebSocketConfig();
  socket = io(config.url, {
    ...config.options,
    auth: { token },
  });
  attachSocketForwarding(socket);
  socket.on('connect', () => notifyConnection(true));
  socket.on('disconnect', () => notifyConnection(false));
  socket.on('connect_error', () => notifyConnection(false));
}

function acquireNotificationSocket(token: string): void {
  connectionHolders += 1;
  ensureSocket(token);
}

function releaseNotificationSocket(): void {
  connectionHolders = Math.max(0, connectionHolders - 1);
  if (connectionHolders === 0) {
    teardownSocket();
  }
}

function subscribeNewNotification(
  callback: (notification: NotificationEvent) => void
): () => void {
  newNotificationListeners.add(callback);
  return () => {
    newNotificationListeners.delete(callback);
  };
}

function subscribeNotificationUpdate(
  callback: (data: NotificationUpdatePayload) => void
): () => void {
  notificationUpdatedListeners.add(callback);
  return () => {
    notificationUpdatedListeners.delete(callback);
  };
}

function subscribeNotificationDelete(
  callback: (data: DeletePayload) => void
): () => void {
  notificationDeletedListeners.add(callback);
  return () => {
    notificationDeletedListeners.delete(callback);
  };
}

export const useNotificationSocket = (): NotificationSocketHook => {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const onConnection = (connected: boolean) => {
      setIsConnected(connected);
    };
    connectionListeners.add(onConnection);
    setIsConnected(Boolean(socket?.connected));
    return () => {
      connectionListeners.delete(onConnection);
    };
  }, []);

  useEffect(() => {
    const token = session?.accessToken;
    if (!token || typeof token !== 'string') {
      return;
    }
    acquireNotificationSocket(token);
    return () => {
      releaseNotificationSocket();
    };
  }, [session?.accessToken]);

  const connect = useCallback(() => {
    /* Socket lifecycle is managed by this hook via session token + ref counting. */
  }, []);

  const disconnect = useCallback(() => {
    /* Use session sign-out or unmount instead; manual disconnect would desync ref counts. */
  }, []);

  const onNotification = useCallback(
    (callback: (notification: NotificationEvent) => void) => subscribeNewNotification(callback),
    []
  );

  const onNotificationUpdate = useCallback(
    (callback: (data: NotificationUpdatePayload) => void) =>
      subscribeNotificationUpdate(callback),
    []
  );

  const onNotificationDelete = useCallback(
    (callback: (data: DeletePayload) => void) => subscribeNotificationDelete(callback),
    []
  );

  return useMemo(
    () => ({
      isConnected,
      connect,
      disconnect,
      onNotification,
      onNotificationUpdate,
      onNotificationDelete,
    }),
    [isConnected, connect, disconnect, onNotification, onNotificationUpdate, onNotificationDelete]
  );
};
