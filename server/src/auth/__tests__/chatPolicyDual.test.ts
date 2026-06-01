import { beforeEach, describe, expect, it, vi } from 'vitest';
import { evaluateChatPolicyDual } from '../chatPolicyDual';
import { POLICY_ACTIONS } from '../policyActions';
import * as policyEngine from '../policyEngine';
import { logger } from '../../lib/logger';

describe('evaluateChatPolicyDual', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
  });

  it('does not block when policy allows', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: true,
      matchedPolicy: 'chat_active_participant',
    });

    const result = await evaluateChatPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.CHAT_MESSAGE_CREATE,
      resourceType: 'conversation',
      resourceId: 'conv-1',
    });

    expect(result.blocked).toBe(false);
  });

  it('blocks on NOT_MEMBER', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'NOT_MEMBER',
    });

    const result = await evaluateChatPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.CHAT_MESSAGE_CREATE,
      resourceType: 'conversation',
      resourceId: 'conv-1',
    });

    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('NOT_MEMBER');
  });

  it('logs policy_legacy_dual_enforce on security deny', async () => {
    const warnSpy = vi.mocked(logger.warn);
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'NOT_MEMBER',
    });

    await evaluateChatPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.CHAT_MESSAGE_CREATE,
      resourceType: 'conversation',
      resourceId: 'conv-1',
    });

    expect(warnSpy).toHaveBeenCalledWith(
      'Chat policy denied (dual enforcement)',
      expect.objectContaining({
        operation: 'policy_legacy_dual_enforce',
        reason: 'NOT_MEMBER',
        blockRequest: true,
      })
    );
  });
});
