/**
 * Shared Socket.IO client — single connection, ref-counted holders.
 * Prefer acquire/release over direct io() calls.
 */

import { io, type Socket } from 'socket.io-client';
import { logger } from '@/lib/logger';
import { getWebSocketConfig } from './websocketUtils';

const WORKSPACE_RUNTIME_HOLDER = 'workspace-runtime';

type ConnectionListener = (connected: boolean) => void;

let socket: Socket | null = null;
let activeToken: string | null = null;
const holderCounts = new Map<string, number>();
const connectionListeners = new Set<ConnectionListener>();
let platformDomainEventAttached = false;

const platformDomainEventListeners = new Set<(payload: PlatformDomainEventPayload) => void>();

export interface PlatformDomainEventPayload {
  id: string;
  type: string;
  action: string;
  entityType: string;
  entityId: string;
  dashboardId?: string;
  businessId?: string;
  householdId?: string;
  createdAt: string;
}

function notifyConnection(connected: boolean): void {
  connectionListeners.forEach((fn) => {
    try {
      fn(connected);
    } catch {
      /* ignore subscriber errors */
    }
  });
}

function attachPlatformDomainEventForwarding(s: Socket): void {
  if (platformDomainEventAttached) return;
  platformDomainEventAttached = true;
  s.on('platform:domain_event', (payload: PlatformDomainEventPayload) => {
    platformDomainEventListeners.forEach((cb) => {
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
  platformDomainEventAttached = false;
  notifyConnection(false);
}

function ensureSocket(token: string): Socket {
  if (activeToken === token && socket) {
    return socket;
  }
  teardownSocket();
  activeToken = token;
  const config = getWebSocketConfig();
  socket = io(config.url, {
    ...config.options,
    auth: { token },
    forceNew: false,
  });
  attachPlatformDomainEventForwarding(socket);
  socket.on('connect', () => {
    notifyConnection(true);
    if (process.env.NODE_ENV === 'development') {
      void logger.debug('Realtime client connected', {
        operation: 'realtime_connect',
        context: { holders: holderCounts.size },
      });
    }
  });
  socket.on('disconnect', (reason) => {
    notifyConnection(false);
    if (process.env.NODE_ENV === 'development') {
      void logger.debug('Realtime client disconnected', {
        operation: 'realtime_disconnect',
        context: { reason },
      });
    }
  });
  socket.on('connect_error', () => {
    notifyConnection(false);
  });
  return socket;
}

export function acquireRealtimeConnection(
  token: string,
  holderId: string = 'default'
): Promise<Socket> {
  const count = holderCounts.get(holderId) ?? 0;
  holderCounts.set(holderId, count + 1);
  const s = ensureSocket(token);
  return Promise.resolve(s);
}

export function releaseRealtimeConnection(holderId: string = 'default'): void {
  const count = holderCounts.get(holderId) ?? 0;
  if (count <= 1) {
    holderCounts.delete(holderId);
  } else {
    holderCounts.set(holderId, count - 1);
  }
  if (holderCounts.size === 0) {
    teardownSocket();
  }
}

export function getRealtimeSocket(): Socket | null {
  return socket;
}

export function isRealtimeConnected(): boolean {
  return Boolean(socket?.connected);
}

export function onRealtimeConnectionChange(listener: ConnectionListener): () => void {
  connectionListeners.add(listener);
  listener(Boolean(socket?.connected));
  return () => {
    connectionListeners.delete(listener);
  };
}

export function onPlatformDomainEvent(
  callback: (payload: PlatformDomainEventPayload) => void
): () => void {
  platformDomainEventListeners.add(callback);
  return () => {
    platformDomainEventListeners.delete(callback);
  };
}

/** Workspace runtime holds a persistent connection while mounted. */
export async function acquireWorkspaceRealtimeConnection(token: string): Promise<Socket> {
  return acquireRealtimeConnection(token, WORKSPACE_RUNTIME_HOLDER);
}

export function releaseWorkspaceRealtimeConnection(): void {
  releaseRealtimeConnection(WORKSPACE_RUNTIME_HOLDER);
}

export function getRealtimeClientDiagnostics(): {
  connected: boolean;
  holderIds: string[];
  holderCount: number;
  platformListenerCount: number;
} {
  return {
    connected: Boolean(socket?.connected),
    holderIds: Array.from(holderCounts.keys()),
    holderCount: holderCounts.size,
    platformListenerCount: platformDomainEventListeners.size,
  };
}
