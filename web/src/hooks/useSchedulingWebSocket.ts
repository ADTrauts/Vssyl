'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { Socket } from 'socket.io-client';
import {
  acquireRealtimeConnection,
  getRealtimeSocket,
  releaseRealtimeConnection,
} from '@/lib/realtimeClient';
import { useWorkspaceRuntimeOptional } from '@/runtime/workspace/WorkspaceRuntimeContext';
import { formatRuntimeRoom } from '@/runtime/workspace/runtimeRealtime';
import { ScheduleShift } from '@/api/scheduling';

const HOLDER_ID = 'scheduling-ws';

interface SchedulingWebSocketEvents {
  onShiftCreated?: (data: { businessId: string; scheduleId: string; shift: ScheduleShift }) => void;
  onShiftUpdated?: (data: { businessId: string; scheduleId: string; shift: ScheduleShift }) => void;
  onShiftDeleted?: (data: { businessId: string; scheduleId: string; shiftId: string }) => void;
  onSchedulePublished?: (data: {
    businessId: string;
    scheduleId: string;
    schedule: Record<string, unknown>;
  }) => void;
}

interface UseSchedulingWebSocketOptions {
  businessId?: string;
  scheduleId?: string;
  enabled?: boolean;
  events?: SchedulingWebSocketEvents;
}

export function useSchedulingWebSocket({
  businessId,
  scheduleId,
  enabled = true,
  events = {},
}: UseSchedulingWebSocketOptions) {
  const { data: session } = useSession();
  const workspaceRuntime = useWorkspaceRuntimeOptional();
  const socketRef = useRef<Socket | null>(null);
  const isConnectedRef = useRef(false);
  const joinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryAttemptsRef = useRef<Map<string, number>>(new Map());
  const eventsRef = useRef(events);
  const trackedRoomsRef = useRef<string[]>([]);
  const listenersAttachedRef = useRef(false);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  const safeEmit = useCallback((socket: Socket, event: string, data: string, maxRetries = 3) => {
    if (!socket?.connected) {
      return false;
    }

    const retryKey = `${event}_${data}`;
    const attempts = retryAttemptsRef.current.get(retryKey) || 0;

    if (attempts >= maxRetries) {
      retryAttemptsRef.current.delete(retryKey);
      return false;
    }

    try {
      socket.emit(event, data);
      retryAttemptsRef.current.delete(retryKey);
      return true;
    } catch (error) {
      retryAttemptsRef.current.set(retryKey, attempts + 1);
      if (attempts < maxRetries - 1) {
        setTimeout(() => {
          if (socket.connected) {
            safeEmit(socket, event, data, maxRetries);
          }
        }, Math.min(100 * Math.pow(2, attempts), 1000));
      }
      return false;
    }
  }, []);

  const leaveTrackedRooms = useCallback(
    (socket: Socket) => {
      if (!socket.connected) return;
      for (const roomKey of trackedRoomsRef.current) {
        if (workspaceRuntime) {
          workspaceRuntime.unsubscribeRuntimeRoom(roomKey);
        } else {
          const parsed = roomKey.split(':');
          if (parsed[0] === 'business' && parsed[1]) {
            socket.emit('leave_business', parsed[1]);
          }
          if (parsed[0] === 'schedule' && parsed[1]) {
            socket.emit('leave_schedule', parsed[1]);
          }
        }
      }
      trackedRoomsRef.current = [];
    },
    [workspaceRuntime]
  );

  const joinRooms = useCallback(
    (socket: Socket, bizId?: string, schedId?: string, delay = 100) => {
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
      }

      joinTimeoutRef.current = setTimeout(() => {
        if (!socket?.connected) return;

        leaveTrackedRooms(socket);

        try {
          if (bizId) {
            const roomKey = formatRuntimeRoom('business', bizId);
            if (workspaceRuntime) {
              workspaceRuntime.subscribeRuntimeRoom(roomKey);
            } else {
              safeEmit(socket, 'join_business', bizId);
            }
            trackedRoomsRef.current.push(roomKey);
          }
          if (schedId) {
            const roomKey = formatRuntimeRoom('schedule', schedId);
            if (workspaceRuntime) {
              workspaceRuntime.subscribeRuntimeRoom(roomKey);
            } else {
              safeEmit(socket, 'join_schedule', schedId);
            }
            trackedRoomsRef.current.push(roomKey);
          }
        } catch (error) {
          console.error('Failed to join rooms:', error);
        }
      }, delay);
    },
    [safeEmit, workspaceRuntime, leaveTrackedRooms]
  );

  const connect = useCallback(async () => {
    if (!enabled || !session?.accessToken) {
      return;
    }

    if (socketRef.current?.connected) {
      if (businessId || scheduleId) {
        joinRooms(socketRef.current, businessId, scheduleId, 0);
      }
      return;
    }

    try {
      const socket = await acquireRealtimeConnection(session.accessToken, HOLDER_ID);
      socketRef.current = socket;
      isConnectedRef.current = true;

      if (!listenersAttachedRef.current) {
        socket.on(
          'schedule:shift:created',
          (data: { businessId: string; scheduleId: string; shift: ScheduleShift }) => {
            eventsRef.current.onShiftCreated?.(data);
          }
        );
        socket.on(
          'schedule:shift:updated',
          (data: { businessId: string; scheduleId: string; shift: ScheduleShift }) => {
            eventsRef.current.onShiftUpdated?.(data);
          }
        );
        socket.on(
          'schedule:shift:deleted',
          (data: { businessId: string; scheduleId: string; shiftId: string }) => {
            eventsRef.current.onShiftDeleted?.(data);
          }
        );
        socket.on(
          'schedule:published',
          (data: {
            businessId: string;
            scheduleId: string;
            schedule: Record<string, unknown>;
          }) => {
            eventsRef.current.onSchedulePublished?.(data);
          }
        );
        listenersAttachedRef.current = true;
      }

      joinRooms(socket, businessId, scheduleId, 150);
    } catch (error) {
      console.error('Failed to connect to scheduling WebSocket:', error);
      isConnectedRef.current = false;
    }
  }, [enabled, session?.accessToken, businessId, scheduleId, joinRooms]);

  const disconnect = useCallback(() => {
    if (joinTimeoutRef.current) {
      clearTimeout(joinTimeoutRef.current);
      joinTimeoutRef.current = null;
    }

    if (socketRef.current) {
      leaveTrackedRooms(socketRef.current);
      socketRef.current = null;
      isConnectedRef.current = false;
      retryAttemptsRef.current.clear();
    }

    releaseRealtimeConnection(HOLDER_ID);
    if (!getRealtimeSocket()) {
      listenersAttachedRef.current = false;
    }
  }, [leaveTrackedRooms]);

  useEffect(() => {
    if (enabled && session?.accessToken) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, session?.accessToken, businessId, scheduleId]);

  useEffect(() => {
    if (!socketRef.current?.connected) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (socketRef.current?.connected) {
        joinRooms(socketRef.current, businessId, scheduleId, 0);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [businessId, scheduleId, joinRooms]);

  return {
    isConnected: isConnectedRef.current,
    connect,
    disconnect,
  };
}
