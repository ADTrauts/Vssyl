import { beforeEach, describe, expect, it, vi } from 'vitest';
import { evaluateAnalyticsPolicyDual } from '../../../auth/analyticsPolicyDual';
import { POLICY_ACTIONS } from '../../../auth/policyActions';
import {
  AnalyticsAccessError,
  getPersonalAnalyticsCapability,
} from '../analyticsCapabilityService';
import { recordAnalyticsPersonalView } from '../analyticsActivityService';
import { prisma } from '../../../lib/prisma';

vi.mock('../../../auth/analyticsPolicyDual', () => ({
  evaluateAnalyticsPolicyDual: vi.fn(),
}));

vi.mock('../analyticsActivityService', () => ({
  recordAnalyticsPersonalView: vi.fn(),
  recordAnalyticsModuleView: vi.fn(),
  recordAnalyticsDashboardSummaryView: vi.fn(),
  recordAnalyticsExport: vi.fn(),
}));

describe('analyticsCapabilityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(evaluateAnalyticsPolicyDual).mockResolvedValue({ blocked: false });
    vi.mocked(recordAnalyticsPersonalView).mockResolvedValue(undefined);
  });

  it('denies when analytics policy blocks personal read', async () => {
    vi.mocked(evaluateAnalyticsPolicyDual).mockResolvedValue({ blocked: true, reason: 'NOT_OWNER' });

    await expect(getPersonalAnalyticsCapability({ userId: 'u1' })).rejects.toBeInstanceOf(
      AnalyticsAccessError
    );
  });

  it('returns personal capability and records activity', async () => {
    vi.spyOn(prisma.activity, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.moduleInstallation, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.file, 'count').mockResolvedValue(2 as never);
    vi.spyOn(prisma.message, 'count').mockResolvedValue(5 as never);

    const result = await getPersonalAnalyticsCapability({ userId: 'u1', timeRange: '30d' });

    expect(evaluateAnalyticsPolicyDual).toHaveBeenCalledWith(
      expect.objectContaining({
        action: POLICY_ACTIONS.ANALYTICS_READ,
        metadata: { operation: 'personal' },
      })
    );
    expect(recordAnalyticsPersonalView).toHaveBeenCalledWith(
      expect.objectContaining({ actorUserId: 'u1', timeRange: '30d' })
    );
    expect(result.usageStats.filesCreated).toBe(2);
    expect(result.usageStats.messagesSent).toBe(5);
  });
});
