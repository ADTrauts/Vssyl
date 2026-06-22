import { describe, expect, it, vi, beforeEach } from 'vitest';
import { evaluateAnalyticsPolicyDual } from '../analyticsPolicyDual';
import { authorize } from '../policyEngine';
import { POLICY_ACTIONS } from '../policyActions';

vi.mock('../policyEngine', () => ({
  authorize: vi.fn(),
}));

describe('analyticsPolicyDual', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows when policy allows', async () => {
    vi.mocked(authorize).mockResolvedValue({ allow: true, matchedPolicy: 'analytics_self_read' });

    const result = await evaluateAnalyticsPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.ANALYTICS_READ,
      resourceId: 'u1',
      metadata: { operation: 'personal' },
    });

    expect(result.blocked).toBe(false);
  });

  it('blocks on security deny reasons', async () => {
    vi.mocked(authorize).mockResolvedValue({
      allow: false,
      reason: 'NOT_OWNER',
      matchedPolicy: 'analytics_self_read',
    });

    const result = await evaluateAnalyticsPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.ANALYTICS_READ,
      resourceId: 'other-user',
      metadata: { operation: 'personal' },
    });

    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('NOT_OWNER');
  });
});
