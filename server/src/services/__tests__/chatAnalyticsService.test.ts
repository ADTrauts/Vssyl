import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import { getChatAnalytics, resolveUserIdByEmail } from '../chatAnalyticsService';
import { ChatServiceError } from '../chat/chatErrors';

describe('chatAnalyticsService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('resolveUserIdByEmail throws when missing', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

    await expect(resolveUserIdByEmail('missing@example.com')).rejects.toThrow(
      ChatServiceError
    );
  });

  it('getChatAnalytics scopes trashed conversations', async () => {
    vi.spyOn(prisma.conversation, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.message, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.messageReaction, 'findMany').mockResolvedValue([] as never);

    await getChatAnalytics({ userId: 'u1' });

    expect(prisma.conversation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ trashedAt: null }),
      })
    );
  });
});
