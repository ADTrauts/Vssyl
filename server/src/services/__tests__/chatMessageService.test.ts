import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as chatPermission from '../chatPermissionService';
import * as chatThread from '../chatThreadService';
import * as chatActivity from '../chatActivityService';
import * as chatDomainEvents from '../chatDomainEventService';
import * as chatNotifications from '../chatNotificationService';
import * as chatRealtime from '../chatRealtimeService';
import * as chatAttachment from '../chatAttachmentService';
import * as chatPolicyDual from '../../auth/chatPolicyDual';
import { sendMessage } from '../chatMessageService';
import { ChatServiceError } from '../chat/chatErrors';

vi.mock('../notificationService', () => ({
  NotificationService: {
    handleNotification: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('chatMessageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(chatPermission, 'assertActiveConversationParticipant').mockResolvedValue(undefined);
    vi.spyOn(chatPolicyDual, 'evaluateChatPolicyDual').mockResolvedValue({ blocked: false });
    vi.spyOn(chatAttachment, 'validateMessageAttachmentFileIds').mockResolvedValue([]);
    vi.spyOn(chatActivity, 'recordMessageSent').mockResolvedValue(undefined);
    vi.spyOn(chatDomainEvents, 'recordChatMessageSentDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(chatNotifications, 'notifyNewMessage').mockResolvedValue(undefined);
    vi.spyOn(chatRealtime, 'broadcastNewMessage').mockImplementation(() => undefined);
  });

  it('sendMessage rejects empty content', async () => {
    await expect(
      sendMessage({
        userId: 'user-1',
        senderName: 'Alice',
        conversationId: 'conv-1',
        content: '   ',
      })
    ).rejects.toThrow(ChatServiceError);
  });

  it('sendMessage persists and broadcasts', async () => {
    vi.spyOn(prisma.message, 'create').mockResolvedValue({
      id: 'msg-1',
      conversationId: 'conv-1',
      content: 'hello',
      fileReferences: [],
    } as never);
    vi.spyOn(prisma.conversation, 'update').mockResolvedValue({} as never);

    const result = await sendMessage({
      userId: 'user-1',
      senderName: 'Alice',
      conversationId: 'conv-1',
      content: 'hello',
    });

    expect(result.id).toBe('msg-1');
    expect(chatRealtime.broadcastNewMessage).toHaveBeenCalled();
    expect(chatActivity.recordMessageSent).toHaveBeenCalled();
    expect(chatNotifications.notifyNewMessage).toHaveBeenCalled();
  });

  it('sendMessage uses ensureThreadForReply when replyToId set', async () => {
    const ensureSpy = vi.spyOn(chatThread, 'ensureThreadForReply').mockResolvedValue('thread-1');
    vi.spyOn(chatThread, 'assertThreadInConversation').mockResolvedValue(undefined);
    vi.spyOn(prisma.message, 'create').mockResolvedValue({
      id: 'msg-2',
      conversationId: 'conv-1',
      content: 'reply',
      fileReferences: [],
    } as never);
    vi.spyOn(prisma.conversation, 'update').mockResolvedValue({} as never);
    vi.spyOn(prisma.thread, 'update').mockResolvedValue({} as never);

    await sendMessage({
      userId: 'user-1',
      senderName: 'Alice',
      conversationId: 'conv-1',
      content: 'reply',
      replyToId: 'msg-parent',
    });

    expect(ensureSpy).toHaveBeenCalled();
  });
});
