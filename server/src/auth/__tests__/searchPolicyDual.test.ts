import { describe, expect, it, vi } from 'vitest';
import { evaluateSearchPolicyDual } from '../searchPolicyDual';
import * as policyEngine from '../policyEngine';
import { POLICY_ACTIONS } from '../policyActions';

describe('searchPolicyDual', () => {
  it('returns blocked false when policy allows', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: true,
      matchedPolicy: 'search_read_authenticated',
    });

    const result = await evaluateSearchPolicyDual({ userId: 'u1' });
    expect(result.blocked).toBe(false);
  });

  it('blocks on security deny reasons', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'NOT_MEMBER',
      matchedPolicy: 'search_read_denied',
    });

    const result = await evaluateSearchPolicyDual({
      userId: 'u1',
      scope: { businessId: 'b1' },
    });

    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('NOT_MEMBER');
  });

  it('does not block on POLICY_NOT_IMPLEMENTED', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'POLICY_NOT_IMPLEMENTED',
    });

    const result = await evaluateSearchPolicyDual({ userId: 'u1' });
    expect(result.blocked).toBe(false);
  });

  it('calls authorize with search:read action', async () => {
    const authorizeSpy = vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: true,
      matchedPolicy: 'search_read_authenticated',
    });

    await evaluateSearchPolicyDual({ userId: 'u1' });

    expect(authorizeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        action: POLICY_ACTIONS.SEARCH_READ,
        resourceType: 'search',
      })
    );
  });
});
