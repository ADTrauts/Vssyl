import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as chatPermission from '../chatPermissionService';
import * as chatActivity from '../chatActivityService';
import { createConversation } from '../chatConversationService';

describe('chatConversationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(chatPermission, 'validateConversationDashboardAccess').mockResolvedValue(undefined);
    vi.spyOn(chatActivity, 'recordConversationCreated').mockResolvedValue(undefined);
  });

  it('returns existing DIRECT conversation without creating', async () => {
    const existing = { id: 'conv-existing', type: 'DIRECT' };
    vi.spyOn(prisma.conversation, 'findFirst').mockResolvedValue(existing as never);
    const createSpy = vi.spyOn(prisma.conversation, 'create');

    const result = await createConversation({
      userId: 'user-1',
      type: 'DIRECT',
      participantIds: ['user-2'],
    });

    expect(result.created).toBe(false);
    expect(result.conversation).toEqual(existing);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('creates a new conversation when none exists', async () => {
    vi.spyOn(prisma.conversation, 'findFirst').mockResolvedValue(null);
    vi.spyOn(prisma.conversation, 'create').mockResolvedValue({
      id: 'conv-new',
      type: 'GROUP',
      participants: [],
    } as never);

    const result = await createConversation({
      userId: 'user-1',
      type: 'GROUP',
      participantIds: ['user-2'],
      name: 'Team',
    });

    expect(result.created).toBe(true);
    expect(result.conversation.id).toBe('conv-new');
  });
});
