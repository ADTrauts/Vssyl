import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  evaluateSchedulingPolicyDual,
  resolveSchedulingPolicyAccess,
} from '../schedulingPolicyDual';
import { POLICY_ACTIONS } from '../policyActions';
import * as policyEngine from '../policyEngine';
import { logger } from '../../lib/logger';

describe('evaluateSchedulingPolicyDual', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not block when policy allows', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: true,
      matchedPolicy: 'scheduling_admin',
    });

    const result = await evaluateSchedulingPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.SCHEDULING_SCHEDULE_WRITE,
      businessId: 'biz-1',
    });

    expect(result.blocked).toBe(false);
  });

  it('blocks on INSUFFICIENT_ROLE security deny', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'INSUFFICIENT_ROLE',
    });

    const result = await evaluateSchedulingPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.SCHEDULING_SCHEDULE_DELETE,
      businessId: 'biz-1',
      resourceType: 'schedule',
      resourceId: 'sched-1',
    });

    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('INSUFFICIENT_ROLE');
  });

  it('does not block on POLICY_NOT_IMPLEMENTED fallback', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'POLICY_NOT_IMPLEMENTED',
    });

    const result = await evaluateSchedulingPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.SCHEDULING_SHIFT_WRITE,
      businessId: 'biz-1',
    });

    expect(result.blocked).toBe(false);
    expect(result.reason).toBe('POLICY_NOT_IMPLEMENTED');
  });

  it('resolveSchedulingPolicyAccess allows legacy pass without PE block', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'POLICY_NOT_IMPLEMENTED',
    });

    const result = await resolveSchedulingPolicyAccess({
      legacyAllowed: true,
      userId: 'u1',
      action: POLICY_ACTIONS.SCHEDULING_SWAP_REQUEST,
      businessId: 'biz-1',
    });

    expect(result.allowed).toBe(true);
    expect(result.usedPolicyFallback).toBeUndefined();
  });

  it('resolveSchedulingPolicyAccess allows PE fallback when legacy denied', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: true,
      matchedPolicy: 'scheduling_active_member',
    });

    const result = await resolveSchedulingPolicyAccess({
      legacyAllowed: false,
      userId: 'u1',
      action: POLICY_ACTIONS.SCHEDULING_SWAP_REQUEST,
      businessId: 'biz-1',
    });

    expect(result.allowed).toBe(true);
    expect(result.usedPolicyFallback).toBe(true);
  });

  it('resolveSchedulingPolicyAccess denies when legacy and PE both deny', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'INSUFFICIENT_ROLE',
    });

    const result = await resolveSchedulingPolicyAccess({
      legacyAllowed: false,
      userId: 'u1',
      action: POLICY_ACTIONS.SCHEDULING_SCHEDULE_PUBLISH,
      businessId: 'biz-1',
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('INSUFFICIENT_ROLE');
  });

  it('logs scheduling dual enforcement on security deny', async () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'TENANT_MISMATCH',
    });

    await evaluateSchedulingPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.SCHEDULING_SWAP_MANAGE,
      businessId: 'biz-1',
    });

    expect(warnSpy).toHaveBeenCalledWith(
      'Scheduling policy denied (dual enforcement)',
      expect.objectContaining({
        operation: 'policy_scheduling_dual_enforce',
        blockRequest: true,
      })
    );
  });
});
