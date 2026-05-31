import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as chatPermission from '../chatPermissionService';
import * as chatActivity from '../chatActivityService';
import { createThread, listThreads } from '../chatThreadService';
import { ChatServiceError } from '../chat/chatErrors';

describe('chatThreadService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(chatPermission, 'assertActiveConversationParticipant').mockResolvedValue(undefined);
    vi.spyOn(chatActivity, 'recordThreadCreated').mockResolvedValue(undefined);
  });

  it('listThreads queries with participant filter', async () => {
    const findMany = vi.spyOn(prisma.thread, 'findMany').mockResolvedValue([] as never);

    await listThreads('user-1', 'conv-1');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          conversationId: 'conv-1',
        }),
      })
    );
  });

  it('createThread throws when parent thread missing', async () => {
    vi.spyOn(prisma.thread, 'findFirst').mockResolvedValue(null);

    await expect(
      createThread({
        userId: 'user-1',
        conversationId: 'conv-1',
        parentId: 'parent-missing',
      })
    ).rejects.toThrow(ChatServiceError);
  });
});
