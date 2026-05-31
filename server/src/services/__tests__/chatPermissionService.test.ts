import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import {
  assertActiveConversationParticipant,
  validateConversationDashboardAccess,
} from '../chatPermissionService';
import { ChatServiceError } from '../chat/chatErrors';

describe('chatPermissionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('assertActiveConversationParticipant throws when not a member', async () => {
    vi.spyOn(prisma.conversationParticipant, 'findFirst').mockResolvedValue(null);

    await expect(
      assertActiveConversationParticipant('user-1', 'conv-1')
    ).rejects.toThrow(ChatServiceError);
  });

  it('assertActiveConversationParticipant passes when participant exists', async () => {
    vi.spyOn(prisma.conversationParticipant, 'findFirst').mockResolvedValue({
      id: 'part-1',
    } as never);

    await expect(
      assertActiveConversationParticipant('user-1', 'conv-1')
    ).resolves.toBeUndefined();
  });

  it('validateConversationDashboardAccess skips when dashboardId omitted', async () => {
    await expect(
      validateConversationDashboardAccess('user-1', undefined, ['user-1'])
    ).resolves.toBeUndefined();
  });

  it('validateConversationDashboardAccess rejects unknown dashboard', async () => {
    vi.spyOn(prisma.dashboard, 'findFirst').mockResolvedValue(null);

    await expect(
      validateConversationDashboardAccess('user-1', 'dash-1', ['user-1'])
    ).rejects.toMatchObject({ code: 'forbidden' });
  });
});
