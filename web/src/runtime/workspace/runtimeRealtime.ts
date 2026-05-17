import type { Socket } from 'socket.io-client';
import { logger } from '@/lib/logger';

export type RuntimeRoomKind = 'conversation' | 'business' | 'schedule';

export function formatRuntimeRoom(kind: RuntimeRoomKind, id: string): string {
  return `${kind}:${id}`;
}

export function parseRuntimeRoomKey(
  roomKey: string
): { kind: RuntimeRoomKind; id: string } | null {
  const idx = roomKey.indexOf(':');
  if (idx < 0) return null;
  const kind = roomKey.slice(0, idx) as RuntimeRoomKind;
  if (kind !== 'conversation' && kind !== 'business' && kind !== 'schedule') {
    return null;
  }
  const id = roomKey.slice(idx + 1);
  if (!id) return null;
  return { kind, id };
}

export function emitJoinRuntimeRoom(socket: Socket, roomKey: string): boolean {
  const parsed = parseRuntimeRoomKey(roomKey);
  if (!parsed || !socket.connected) return false;
  switch (parsed.kind) {
    case 'conversation':
      socket.emit('join_conversation', parsed.id);
      return true;
    case 'business':
      socket.emit('join_business', parsed.id);
      return true;
    case 'schedule':
      socket.emit('join_schedule', parsed.id);
      return true;
    default:
      return false;
  }
}

export function emitLeaveRuntimeRoom(socket: Socket, roomKey: string): boolean {
  const parsed = parseRuntimeRoomKey(roomKey);
  if (!parsed || !socket.connected) return false;
  switch (parsed.kind) {
    case 'conversation':
      socket.emit('leave_conversation', parsed.id);
      return true;
    case 'business':
      socket.emit('leave_business', parsed.id);
      return true;
    case 'schedule':
      socket.emit('leave_schedule', parsed.id);
      return true;
    default:
      return false;
  }
}

export function leaveAllRuntimeRooms(socket: Socket | null, roomKeys: string[]): void {
  if (!socket?.connected || roomKeys.length === 0) return;
  for (const key of roomKeys) {
    emitLeaveRuntimeRoom(socket, key);
  }
}

export function logRuntimeRealtimeDebug(
  operation: string,
  context: Record<string, unknown>
): void {
  if (process.env.NODE_ENV !== 'development') return;
  void logger.debug('Workspace realtime', {
    operation,
    context,
  });
}
