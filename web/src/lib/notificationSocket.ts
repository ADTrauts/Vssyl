import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  acquireRealtimeConnection,
  getRealtimeSocket,
  onRealtimeConnectionChange,
  releaseRealtimeConnection,
} from './realtimeClient';

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

const HOLDER_ID = 'notifications';

const newNotificationListeners = new Set<(n: NotificationEvent) => void>();
const notificationUpdatedListeners = new Set<(data: NotificationUpdatePayload) => void>();
const notificationDeletedListeners = new Set<(data: DeletePayload) => void>();
const connectionListeners = new Set<(connected: boolean) => void>();

let notificationForwardingAttached = false;
let notificationHolders = 0;

function notifyConnection(connected: boolean): void {
  connectionListeners.forEach((fn) => {
    try {
      fn(connected);
    } catch {
      /* ignore subscriber errors */
    }
  });
}

function attachNotificationForwarding(): void {
  const s = getRealtimeSocket();
  if (!s || notificationForwardingAttached) return;
  notificationForwardingAttached = true;

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

function acquireNotificationSocket(token: string): void {
  notificationHolders += 1;
  void acquireRealtimeConnection(token, HOLDER_ID).then(() => {
    attachNotificationForwarding();
  });
}

function releaseNotificationSocket(): void {
  notificationHolders = Math.max(0, notificationHolders - 1);
  if (notificationHolders === 0) {
    releaseRealtimeConnection(HOLDER_ID);
    if (!getRealtimeSocket()) {
      notificationForwardingAttached = false;
    }
    notifyConnection(false);
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

  useEffect(() => onRealtimeConnectionChange(setIsConnected), []);

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

  const connect = useCallback(() => {}, []);

  const disconnect = useCallback(() => {}, []);

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
