import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import { searchUsersForChatInvite } from '../chatUserSearchService';
import { ChatServiceError } from '../chat/chatErrors';

describe('chatUserSearchService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects short queries', async () => {
    await expect(
      searchUsersForChatInvite({ currentUserId: 'u1', query: 'a' })
    ).rejects.toThrow(ChatServiceError);
  });

  it('queries users and relationships', async () => {
    vi.spyOn(prisma.businessMember, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.user, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.relationship, 'findMany').mockResolvedValue([] as never);

    await searchUsersForChatInvite({ currentUserId: 'u1', query: 'alice' });

    expect(prisma.user.findMany).toHaveBeenCalled();
    expect(prisma.relationship.findMany).toHaveBeenCalled();
  });
});
