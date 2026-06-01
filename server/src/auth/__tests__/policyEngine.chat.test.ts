import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import { authorize } from '../policyEngine';
import { POLICY_ACTIONS } from '../policyActions';
import { logger } from '../../lib/logger';

describe('policyEngine chat actions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
  });

  it('allows CHAT_CONVERSATION_CREATE for authenticated user', async () => {
    const decision = await authorize({
      userId: 'u1',
      action: POLICY_ACTIONS.CHAT_CONVERSATION_CREATE,
      resourceType: 'conversation',
      resourceId: 'u1',
    });
    expect(decision.allow).toBe(true);
    expect(decision.matchedPolicy).toBe('chat_authenticated_create');
  });

  it('denies CHAT_MESSAGE_CREATE when not a participant', async () => {
    vi.spyOn(prisma.conversationParticipant, 'findFirst').mockResolvedValue(null);

    const decision = await authorize({
      userId: 'u1',
      action: POLICY_ACTIONS.CHAT_MESSAGE_CREATE,
      resourceType: 'conversation',
      resourceId: 'conv-1',
    });
    expect(decision.allow).toBe(false);
    expect(decision.reason).toBe('NOT_MEMBER');
  });

  it('denies CHAT_MESSAGE_REACT when message not found', async () => {
    vi.spyOn(prisma.message, 'findFirst').mockResolvedValue(null);

    const decision = await authorize({
      userId: 'u1',
      action: POLICY_ACTIONS.CHAT_MESSAGE_REACT,
      resourceType: 'message',
      resourceId: 'msg-1',
    });
    expect(decision.allow).toBe(false);
    expect(decision.reason).toBe('NOT_MEMBER');
  });
});
