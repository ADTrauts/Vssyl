import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as chatSocket from '../chatSocketService';
import {
  broadcastNewMessage,
  broadcastReaction,
  broadcastReadReceipt,
} from '../chatRealtimeService';

describe('chatRealtimeService', () => {
  const mockSocket = {
    broadcastMessage: vi.fn(),
    broadcastMessageReaction: vi.fn(),
    broadcastReadReceipt: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(chatSocket, 'getChatSocketService').mockReturnValue(mockSocket as never);
  });

  it('broadcastNewMessage delegates to socket transport', () => {
    broadcastNewMessage('conv-1', { id: 'm1' });
    expect(mockSocket.broadcastMessage).toHaveBeenCalledWith('conv-1', { id: 'm1' });
  });

  it('broadcastReaction delegates to socket transport', () => {
    broadcastReaction('conv-1', {
      messageId: 'm1',
      reaction: { emoji: '👍' },
      action: 'added',
    });
    expect(mockSocket.broadcastMessageReaction).toHaveBeenCalled();
  });

  it('broadcastReadReceipt delegates to socket transport', () => {
    broadcastReadReceipt('conv-1', {
      messageId: 'm1',
      readReceipt: { id: 'r1' },
    });
    expect(mockSocket.broadcastReadReceipt).toHaveBeenCalled();
  });
});
