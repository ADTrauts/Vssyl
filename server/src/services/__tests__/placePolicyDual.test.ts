import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import * as policyEngine from '../../auth/policyEngine';
import { logger } from '../../lib/logger';
import { evaluatePlacePolicyDual } from '../place/placePolicyDual';

describe('placePolicyDual', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
  });

  it('does not block when policy is not implemented', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'POLICY_NOT_IMPLEMENTED',
    });

    const result = await evaluatePlacePolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.PLACE_NODE_CREATE,
      resourceType: 'place_node',
      resourceId: 'place-1',
    });

    expect(result.blocked).toBe(false);
  });

  it('blocks on security deny', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'NOT_OWNER',
    });

    const result = await evaluatePlacePolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.PLACE_NODE_DELETE,
      resourceType: 'place_node',
      resourceId: 'node-1',
    });

    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('NOT_OWNER');
  });

  it('does not block when policy allows', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: true,
      matchedPolicy: 'place_owner',
    });

    const result = await evaluatePlacePolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.PLACE_SETTINGS_UPDATE,
      resourceType: 'place',
      resourceId: 'place-1',
    });

    expect(result.blocked).toBe(false);
  });
});
