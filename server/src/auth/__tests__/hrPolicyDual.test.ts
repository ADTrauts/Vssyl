import { beforeEach, describe, expect, it, vi } from 'vitest';
import { evaluateHRPolicyDual, resolveHRPolicyAccess } from '../hrPolicyDual';
import { POLICY_ACTIONS } from '../policyActions';
import * as policyEngine from '../policyEngine';
import { logger } from '../../lib/logger';

describe('evaluateHRPolicyDual', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not block when policy allows', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: true,
      matchedPolicy: 'hr_admin',
    });

    const result = await evaluateHRPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.HR_EMPLOYEE_WRITE,
      businessId: 'biz-1',
    });

    expect(result.blocked).toBe(false);
  });

  it('blocks on NOT_MEMBER security deny', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'NOT_MEMBER',
    });

    const result = await evaluateHRPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.HR_EMPLOYEE_TERMINATE,
      businessId: 'biz-1',
      resourceType: 'hr_employee',
      resourceId: 'emp-1',
    });

    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('NOT_MEMBER');
  });

  it('does not block on POLICY_NOT_IMPLEMENTED fallback', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'POLICY_NOT_IMPLEMENTED',
    });

    const result = await evaluateHRPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.HR_ONBOARDING_MANAGE,
      businessId: 'biz-1',
    });

    expect(result.blocked).toBe(false);
  });

  it('resolveHRPolicyAccess allows PE fallback when legacy denied', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: true,
      matchedPolicy: 'hr_manager_or_admin',
    });

    const result = await resolveHRPolicyAccess({
      legacyAllowed: false,
      userId: 'u1',
      action: POLICY_ACTIONS.HR_TIME_OFF_APPROVE,
      businessId: 'biz-1',
      resourceType: 'time_off_request',
      resourceId: 'req-1',
    });

    expect(result.allowed).toBe(true);
    expect(result.usedPolicyFallback).toBe(true);
  });

  it('resolveHRPolicyAccess preserves legacy allow with non-blocking PE', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'POLICY_NOT_IMPLEMENTED',
    });

    const result = await resolveHRPolicyAccess({
      legacyAllowed: true,
      userId: 'u1',
      action: POLICY_ACTIONS.HR_TIME_OFF_REQUEST,
      businessId: 'biz-1',
    });

    expect(result.allowed).toBe(true);
  });

  it('logs HR dual enforcement on security deny', async () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'INSUFFICIENT_ROLE',
    });

    await evaluateHRPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.HR_ATTENDANCE_MANAGE,
      businessId: 'biz-1',
    });

    expect(warnSpy).toHaveBeenCalledWith(
      'HR policy denied (dual enforcement)',
      expect.objectContaining({
        operation: 'policy_hr_dual_enforce',
        blockRequest: true,
      })
    );
  });
});
