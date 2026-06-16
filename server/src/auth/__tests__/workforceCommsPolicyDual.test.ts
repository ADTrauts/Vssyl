import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  evaluateWorkforceCommsPolicyDual,
  resolveWorkforceCommsPolicyAccess,
} from '../workforceCommsPolicyDual';
import { POLICY_ACTIONS } from '../policyActions';
import * as policyEngine from '../policyEngine';
import { logger } from '../../lib/logger';

describe('evaluateWorkforceCommsPolicyDual', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not block when policy allows', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: true,
      matchedPolicy: 'workforce_comms_admin',
    });

    const result = await evaluateWorkforceCommsPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.WORKFORCE_COMMUNICATION_WRITE,
      businessId: 'biz-1',
    });

    expect(result.blocked).toBe(false);
  });

  it('blocks on INSUFFICIENT_ROLE security deny', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'INSUFFICIENT_ROLE',
    });

    const result = await evaluateWorkforceCommsPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.WORKFORCE_COMMUNICATION_DELETE,
      businessId: 'biz-1',
      resourceType: 'workforce_communication',
      resourceId: 'comm-1',
    });

    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('INSUFFICIENT_ROLE');
  });

  it('does not block on POLICY_NOT_IMPLEMENTED fallback', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'POLICY_NOT_IMPLEMENTED',
    });

    const result = await evaluateWorkforceCommsPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.WORKFORCE_COMMUNICATION_PUBLISH,
      businessId: 'biz-1',
    });

    expect(result.blocked).toBe(false);
    expect(result.reason).toBe('POLICY_NOT_IMPLEMENTED');
  });

  it('resolveWorkforceCommsPolicyAccess allows legacy pass without PE block', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'POLICY_NOT_IMPLEMENTED',
    });

    const result = await resolveWorkforceCommsPolicyAccess({
      legacyAllowed: true,
      userId: 'u1',
      action: POLICY_ACTIONS.WORKFORCE_COMMUNICATION_READ,
      businessId: 'biz-1',
    });

    expect(result.allowed).toBe(true);
    expect(result.usedPolicyFallback).toBeUndefined();
  });

  it('resolveWorkforceCommsPolicyAccess allows PE fallback when legacy denied', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: true,
      matchedPolicy: 'workforce_comms_active_member',
    });

    const result = await resolveWorkforceCommsPolicyAccess({
      legacyAllowed: false,
      userId: 'u1',
      action: POLICY_ACTIONS.WORKFORCE_ACK_MANAGE,
      businessId: 'biz-1',
    });

    expect(result.allowed).toBe(true);
    expect(result.usedPolicyFallback).toBe(true);
  });

  it('resolveWorkforceCommsPolicyAccess denies when legacy and PE both deny', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'INSUFFICIENT_ROLE',
    });

    const result = await resolveWorkforceCommsPolicyAccess({
      legacyAllowed: false,
      userId: 'u1',
      action: POLICY_ACTIONS.WORKFORCE_CAMPAIGN_MANAGE,
      businessId: 'biz-1',
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('INSUFFICIENT_ROLE');
  });

  it('logs workforce comms dual enforcement on security deny', async () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'TENANT_MISMATCH',
    });

    await evaluateWorkforceCommsPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.WORKFORCE_REPORT_READ,
      businessId: 'biz-1',
    });

    expect(warnSpy).toHaveBeenCalledWith(
      'Workforce comms policy denied (dual enforcement)',
      expect.objectContaining({
        operation: 'policy_workforce_comms_dual_enforce',
        blockRequest: true,
      })
    );
  });
});
