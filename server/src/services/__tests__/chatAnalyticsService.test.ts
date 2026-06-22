import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import { getChatAnalytics, resolveUserIdByEmail, countUnreadMessagesForDashboardRollup } from '../chatAnalyticsService';
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

  it('countUnreadMessagesForDashboardRollup returns 0 when no conversations', async () => {
    vi.spyOn(prisma.conversation, 'findMany').mockResolvedValue([] as never);
    const countSpy = vi.spyOn(prisma.message, 'count');

    const count = await countUnreadMessagesForDashboardRollup('u1', 'd1');

    expect(count).toBe(0);
    expect(countSpy).not.toHaveBeenCalled();
  });

  it('countUnreadMessagesForDashboardRollup scopes to dashboard participants', async () => {
    vi.spyOn(prisma.conversation, 'findMany').mockResolvedValue([{ id: 'c1' }] as never);
    vi.spyOn(prisma.message, 'count').mockResolvedValue(3 as never);

    const count = await countUnreadMessagesForDashboardRollup('u1', 'd1');

    expect(count).toBe(3);
    expect(prisma.conversation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ dashboardId: 'd1', trashedAt: null }),
      })
    );
  });
});
