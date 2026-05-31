import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as chatPermission from '../chatPermissionService';
import {
  listAccessibleConversations,
  listAccessibleMessages,
  searchAccessibleChat,
} from '../chatVisibilityService';
import { ChatServiceError } from '../chat/chatErrors';

describe('chatVisibilityService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('listAccessibleConversations scopes active participants and excludes trashed', async () => {
    const findMany = vi.spyOn(prisma.conversation, 'findMany').mockResolvedValue([] as never);

    await listAccessibleConversations('user-1', { dashboardId: 'dash-1' });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          trashedAt: null,
          dashboardId: 'dash-1',
          participants: {
            some: {
              userId: 'user-1',
              isActive: true,
            },
          },
        }),
      })
    );
  });

  it('listAccessibleMessages denies non-participants', async () => {
    vi.spyOn(chatPermission, 'assertActiveConversationParticipant').mockRejectedValue(
      new ChatServiceError('Access denied to conversation', 'forbidden', 403)
    );

    await expect(
      listAccessibleMessages({
        userId: 'user-1',
        conversationId: 'conv-1',
      })
    ).rejects.toThrow(ChatServiceError);
  });

  it('getConversationIfAccessible returns null for trashed conversation', async () => {
    vi.spyOn(prisma.conversation, 'findFirst').mockResolvedValue(null);

    const { getConversationIfAccessible } = await import('../chatVisibilityService');
    const result = await getConversationIfAccessible('user-1', 'conv-trashed');

    expect(result).toBeNull();
    expect(prisma.conversation.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ trashedAt: null }),
      })
    );
  });

  it('searchAccessibleChat excludes trashed conversations in message query', async () => {
    vi.spyOn(prisma.message, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.conversation, 'findMany').mockResolvedValue([] as never);

    await searchAccessibleChat('hello', 'user-1');

    expect(prisma.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          conversation: expect.objectContaining({
            trashedAt: null,
          }),
        }),
      })
    );
  });
});
