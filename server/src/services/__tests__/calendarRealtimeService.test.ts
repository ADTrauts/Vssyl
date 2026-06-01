import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as chatSocket from '../chatSocketService';
import { broadcastCalendarEventCreated } from '../calendarRealtimeService';

describe('calendarRealtimeService', () => {
  const mockSocket = {
    broadcastToUser: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(chatSocket, 'getChatSocketService').mockReturnValue(mockSocket as never);
  });

  it('broadcastCalendarEventCreated fans out calendar_event payloads', () => {
    broadcastCalendarEventCreated(['u1', 'u2'], { id: 'evt-1' });
    expect(mockSocket.broadcastToUser).toHaveBeenCalledTimes(2);
    expect(mockSocket.broadcastToUser).toHaveBeenCalledWith('u1', 'calendar_event', {
      type: 'event',
      action: 'created',
      event: { id: 'evt-1' },
    });
  });
});
