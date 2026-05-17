import { beforeEach, describe, expect, it, vi } from 'vitest';
import { evaluateBusinessMemberPolicyDual } from '../businessMemberPolicyDual';
import { POLICY_ACTIONS } from '../policyActions';
import * as policyEngine from '../policyEngine';
import { logger } from '../../lib/logger';

describe('evaluateBusinessMemberPolicyDual', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not block when policy allows', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: true,
      matchedPolicy: 'business_member_invite',
    });

    const result = await evaluateBusinessMemberPolicyDual({
      userId: 'u1',
      businessId: 'b1',
      action: POLICY_ACTIONS.BUSINESS_MEMBER_INVITE,
    });

    expect(result.blocked).toBe(false);
  });

  it('blocks on INSUFFICIENT_ROLE security deny', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'INSUFFICIENT_ROLE',
    });

    const result = await evaluateBusinessMemberPolicyDual({
      userId: 'u_emp',
      businessId: 'b1',
      action: POLICY_ACTIONS.BUSINESS_MEMBER_REMOVE,
    });

    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('INSUFFICIENT_ROLE');
  });

  it('logs policy_legacy_dual_enforce on security deny', async () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'NOT_MEMBER',
      matchedPolicy: 'business_member_manage',
    });

    await evaluateBusinessMemberPolicyDual({
      userId: 'u1',
      businessId: 'b1',
      action: POLICY_ACTIONS.BUSINESS_MEMBER_UPDATE,
    });

    expect(warnSpy).toHaveBeenCalledWith(
      'Business member policy denied (dual enforcement)',
      expect.objectContaining({
        operation: 'policy_legacy_dual_enforce',
        reason: 'NOT_MEMBER',
        blockRequest: true,
      })
    );
  });

  it('does not block on POLICY_NOT_IMPLEMENTED (non-security)', async () => {
    vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'POLICY_NOT_IMPLEMENTED',
    });

    const result = await evaluateBusinessMemberPolicyDual({
      userId: 'u1',
      businessId: 'b1',
      action: POLICY_ACTIONS.BUSINESS_MEMBER_RESEND_INVITE,
    });

    expect(result.blocked).toBe(false);
    expect(result.reason).toBe('POLICY_NOT_IMPLEMENTED');
  });
});
