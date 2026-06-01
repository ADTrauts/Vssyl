import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as chatPermission from '../chatPermissionService';
import * as chatPolicyDual from '../../auth/chatPolicyDual';
import {
  listAccessibleConversations,
  listAccessibleMessages,
  searchAccessibleChat,
} from '../chatVisibilityService';
import { ChatServiceError } from '../chat/chatErrors';

describe('chatVisibilityService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(chatPolicyDual, 'evaluateChatPolicyDual').mockResolvedValue({ blocked: false });
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

  it('listAccessibleConversations filters out conversations blocked by policy dual', async () => {
    vi.spyOn(prisma.conversation, 'findMany').mockResolvedValue([
      { id: 'conv-allowed' },
      { id: 'conv-denied' },
    ] as never);
    vi.spyOn(chatPolicyDual, 'evaluateChatPolicyDual').mockImplementation(async (params) => {
      if (params.resourceId === 'conv-denied') {
        return { blocked: true, reason: 'NOT_MEMBER' };
      }
      return { blocked: false };
    });

    const result = await listAccessibleConversations('user-1');

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('conv-allowed');
  });

  it('conversationPassesReadPolicy returns false when policy blocks', async () => {
    vi.spyOn(chatPolicyDual, 'evaluateChatPolicyDual').mockResolvedValue({
      blocked: true,
      reason: 'NOT_MEMBER',
    });

    const { conversationPassesReadPolicy } = await import('../chatVisibilityService');
    await expect(conversationPassesReadPolicy('outsider', 'conv-1')).resolves.toBe(false);
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
