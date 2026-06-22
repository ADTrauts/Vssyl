import { describe, expect, it, vi, afterEach } from 'vitest';
import { evaluateDashboardPolicyDual } from '../dashboardPolicyDual';
import { authorize } from '../policyEngine';
import { POLICY_ACTIONS } from '../policyActions';

vi.mock('../policyEngine', () => ({
  authorize: vi.fn(),
}));

describe('dashboardPolicyDual', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns blocked when authorize denies with NOT_OWNER', async () => {
    vi.mocked(authorize).mockResolvedValue({
      allow: false,
      reason: 'NOT_OWNER',
      matchedPolicy: 'dashboard_owner_write',
    });

    const result = await evaluateDashboardPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.DASHBOARD_WRITE,
      resourceId: 'd1',
      scope: { dashboardId: 'd1' },
    });

    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('NOT_OWNER');
  });

  it('does not block on POLICY_NOT_IMPLEMENTED', async () => {
    vi.mocked(authorize).mockResolvedValue({
      allow: false,
      reason: 'POLICY_NOT_IMPLEMENTED',
    });

    const result = await evaluateDashboardPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.DASHBOARD_DELETE,
      resourceId: 'd1',
    });

    expect(result.blocked).toBe(false);
  });
});
