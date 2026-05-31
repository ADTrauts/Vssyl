import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import { NotificationService } from '../notificationService';
import { notifyNewMessage, notifyReaction } from '../chatNotificationService';

vi.mock('../notificationService', () => ({
  NotificationService: {
    handleNotification: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('chatNotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('notifyNewMessage skips self and notifies participants', async () => {
    vi.spyOn(prisma.conversationParticipant, 'findMany').mockResolvedValue([
      { user: { id: 'u2', name: 'Bob' } },
    ] as never);

    await notifyNewMessage({
      actorUserId: 'u1',
      senderName: 'Alice',
      conversationId: 'c1',
      messageId: 'm1',
      content: 'hello team',
    });

    expect(NotificationService.handleNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'chat_message',
        recipients: ['u2'],
      })
    );
  });

  it('notifyReaction suppresses self-notify', async () => {
    await notifyReaction({
      actorUserId: 'u1',
      actorName: 'Alice',
      messageId: 'm1',
      conversationId: 'c1',
      messageSenderId: 'u1',
      emoji: '👍',
    });

    expect(NotificationService.handleNotification).not.toHaveBeenCalled();
  });

  it('notifyReaction notifies message sender', async () => {
    await notifyReaction({
      actorUserId: 'u2',
      actorName: 'Bob',
      messageId: 'm1',
      conversationId: 'c1',
      messageSenderId: 'u1',
      emoji: '👍',
    });

    expect(NotificationService.handleNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'chat_reaction',
        recipients: ['u1'],
      })
    );
  });
});
