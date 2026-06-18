import { describe, expect, it, vi } from 'vitest';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import { evaluateOrgChartPolicyDual } from '../../auth/orgChartPolicyDual';
import * as policyEngine from '../../auth/policyEngine';

describe('approval hierarchy policy dual', () => {
  it('allows read for active business member', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: true,
      matchedPolicy: 'orgchart_approval_hierarchy_read',
    });

    const result = await evaluateOrgChartPolicyDual({
      userId: 'user-1',
      action: POLICY_ACTIONS.ORGCHART_APPROVAL_HIERARCHY_READ,
      businessId: 'biz-1',
    });

    expect(result.blocked).toBe(false);
    expect(policyEngine.authorize).toHaveBeenCalledWith(
      expect.objectContaining({
        action: POLICY_ACTIONS.ORGCHART_APPROVAL_HIERARCHY_READ,
        scope: { businessId: 'biz-1' },
      })
    );
  });

  it('blocks write on security deny', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'INSUFFICIENT_ROLE',
    });

    const result = await evaluateOrgChartPolicyDual({
      userId: 'user-1',
      action: POLICY_ACTIONS.ORGCHART_APPROVAL_HIERARCHY_WRITE,
      businessId: 'biz-1',
    });

    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('INSUFFICIENT_ROLE');
  });
});
