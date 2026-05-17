import { beforeEach, describe, expect, it, vi } from 'vitest';
import { evaluateDrivePolicyDual } from '../drivePolicyDual';
import { POLICY_ACTIONS } from '../policyActions';
import * as policyEngine from '../policyEngine';
import { logger } from '../../lib/logger';

describe('evaluateDrivePolicyDual', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not block when policy allows', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: true,
      matchedPolicy: 'file_owner',
    });

    const result = await evaluateDrivePolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.FILE_UPDATE,
      resourceType: 'file',
      resourceId: 'file1',
    });

    expect(result.blocked).toBe(false);
  });

  it('blocks on INSUFFICIENT_ROLE', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'INSUFFICIENT_ROLE',
    });

    const result = await evaluateDrivePolicyDual({
      userId: 'u_viewer',
      action: POLICY_ACTIONS.FILE_DELETE,
      resourceType: 'file',
      resourceId: 'file1',
    });

    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('INSUFFICIENT_ROLE');
  });

  it('logs policy_legacy_dual_enforce on security deny', async () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'TENANT_MISMATCH',
    });

    await evaluateDrivePolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.FOLDER_UPDATE,
      resourceType: 'folder',
      resourceId: 'f1',
    });

    expect(warnSpy).toHaveBeenCalledWith(
      'Drive policy denied (dual enforcement)',
      expect.objectContaining({
        operation: 'policy_legacy_dual_enforce',
        reason: 'TENANT_MISMATCH',
        blockRequest: true,
      })
    );
  });
});
