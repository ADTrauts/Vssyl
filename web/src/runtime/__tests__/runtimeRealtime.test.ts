import { describe, expect, it, vi } from 'vitest';
import {
  emitJoinRuntimeRoom,
  emitLeaveRuntimeRoom,
  formatRuntimeRoom,
  parseRuntimeRoomKey,
} from '../workspace/runtimeRealtime';

describe('runtimeRealtime', () => {
  it('formats and parses room keys', () => {
    const key = formatRuntimeRoom('business', 'biz-1');
    expect(parseRuntimeRoomKey(key)).toEqual({ kind: 'business', id: 'biz-1' });
  });

  it('emits join_business for business room', () => {
    const emit = vi.fn();
    const socket = { connected: true, emit } as unknown as import('socket.io-client').Socket;
    expect(emitJoinRuntimeRoom(socket, 'business:biz-1')).toBe(true);
    expect(emit).toHaveBeenCalledWith('join_business', 'biz-1');
  });

  it('emits leave_schedule for schedule room', () => {
    const emit = vi.fn();
    const socket = { connected: true, emit } as unknown as import('socket.io-client').Socket;
    expect(emitLeaveRuntimeRoom(socket, 'schedule:sched-1')).toBe(true);
    expect(emit).toHaveBeenCalledWith('leave_schedule', 'sched-1');
  });
});
