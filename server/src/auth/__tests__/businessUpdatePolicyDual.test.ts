import { beforeEach, describe, expect, it, vi } from 'vitest';
import { evaluateBusinessUpdatePolicyDual } from '../businessUpdatePolicyDual';
import * as policyEngine from '../policyEngine';
import { logger } from '../../lib/logger';

describe('evaluateBusinessUpdatePolicyDual', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not block when policy allows', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: true,
      matchedPolicy: 'business_update',
    });

    const result = await evaluateBusinessUpdatePolicyDual({
      userId: 'u1',
      businessId: 'b1',
    });

    expect(result.blocked).toBe(false);
  });

  it('blocks on INSUFFICIENT_ROLE', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'INSUFFICIENT_ROLE',
    });

    const result = await evaluateBusinessUpdatePolicyDual({
      userId: 'u_emp',
      businessId: 'b1',
    });

    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('INSUFFICIENT_ROLE');
  });

  it('logs policy_legacy_dual_enforce on security deny', async () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'NOT_MEMBER',
    });

    await evaluateBusinessUpdatePolicyDual({
      userId: 'u1',
      businessId: 'b1',
    });

    expect(warnSpy).toHaveBeenCalledWith(
      'Business update policy denied (dual enforcement)',
      expect.objectContaining({
        operation: 'policy_legacy_dual_enforce',
        reason: 'NOT_MEMBER',
        blockRequest: true,
      })
    );
  });
});
