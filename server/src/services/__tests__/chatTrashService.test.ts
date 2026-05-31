import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as chatPermission from '../chatPermissionService';
import * as chatActivity from '../chatActivityService';
import {
  ChatTrashError,
  listTrashedConversationsForGlobalTrash,
  permanentlyDeleteConversation,
  restoreConversation,
  softTrashConversation,
  softTrashMessage,
} from '../chatTrashService';

describe('chatTrashService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(chatPermission, 'assertActiveConversationParticipant').mockResolvedValue(undefined);
    vi.spyOn(chatActivity, 'recordConversationTrashed').mockResolvedValue(undefined);
    vi.spyOn(chatActivity, 'recordConversationRestored').mockResolvedValue(undefined);
    vi.spyOn(chatActivity, 'recordConversationPermanentlyDeleted').mockResolvedValue(undefined);
    vi.spyOn(chatActivity, 'recordMessageTrashed').mockResolvedValue(undefined);
  });

  it('softTrashConversation sets trashedAt for active participant', async () => {
    vi.spyOn(prisma.conversation, 'updateMany').mockResolvedValue({ count: 1 });

    await softTrashConversation({
      userId: 'user-1',
      type: 'conversation',
      id: 'conv-1',
    });

    expect(prisma.conversation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { trashedAt: expect.any(Date) },
      })
    );
    expect(chatActivity.recordConversationTrashed).toHaveBeenCalled();
  });

  it('softTrashConversation throws when not found', async () => {
    vi.spyOn(prisma.conversation, 'updateMany').mockResolvedValue({ count: 0 });

    await expect(
      softTrashConversation({ userId: 'user-1', type: 'conversation', id: 'conv-1' })
    ).rejects.toThrow(ChatTrashError);
  });

  it('restoreConversation clears trashedAt', async () => {
    vi.spyOn(prisma.conversation, 'updateMany').mockResolvedValue({ count: 1 });

    const ok = await restoreConversation({
      userId: 'user-1',
      type: 'conversation',
      id: 'conv-1',
    });

    expect(ok).toBe(true);
    expect(chatActivity.recordConversationRestored).toHaveBeenCalled();
  });

  it('permanentlyDeleteConversation requires trashed state', async () => {
    vi.spyOn(prisma.conversation, 'findFirst').mockResolvedValue({
      id: 'conv-1',
      dashboardId: null,
    } as never);
    vi.spyOn(prisma.conversation, 'deleteMany').mockResolvedValue({ count: 1 });

    const ok = await permanentlyDeleteConversation({
      userId: 'user-1',
      type: 'conversation',
      id: 'conv-1',
    });

    expect(ok).toBe(true);
  });

  it('softTrashMessage denies non-participant non-sender', async () => {
    vi.spyOn(prisma.message, 'findFirst').mockResolvedValue({
      id: 'msg-1',
      senderId: 'other',
      conversationId: 'conv-1',
      conversation: { participants: [] },
    } as never);

    await expect(
      softTrashMessage({ userId: 'user-1', type: 'message', id: 'msg-1' })
    ).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('listTrashedConversationsForGlobalTrash returns conversation items only', async () => {
    vi.spyOn(prisma.conversation, 'findMany').mockResolvedValue([
      {
        id: 'conv-1',
        name: 'Team',
        type: 'GROUP',
        trashedAt: new Date(),
      },
    ] as never);

    const items = await listTrashedConversationsForGlobalTrash('user-1');

    expect(items).toHaveLength(1);
    expect(items[0].type).toBe('conversation');
    expect(items[0].moduleId).toBe('chat');
  });
});
