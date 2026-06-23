import { beforeEach, describe, expect, it, vi } from 'vitest';
import { evaluateAnalyticsPolicyDual } from '../../../auth/analyticsPolicyDual';
import { POLICY_ACTIONS } from '../../../auth/policyActions';
import {
  AnalyticsAccessError,
  getPersonalAnalyticsCapability,
  getModuleAnalyticsCapability,
} from '../analyticsCapabilityService';
import { recordAnalyticsPersonalView, recordAnalyticsModuleView } from '../analyticsActivityService';
import { prisma } from '../../../lib/prisma';
import * as platformActivityQuery from '../../platform/platformActivityQueryService';

vi.mock('../../../auth/analyticsPolicyDual', () => ({
  evaluateAnalyticsPolicyDual: vi.fn(),
}));

vi.mock('../analyticsActivityService', () => ({
  recordAnalyticsPersonalView: vi.fn(),
  recordAnalyticsModuleView: vi.fn(),
  recordAnalyticsDashboardSummaryView: vi.fn(),
  recordAnalyticsExport: vi.fn(),
}));

vi.mock('../../platform/platformActivityQueryService', () => ({
  getRecentActivity: vi.fn(),
  getActivitySummary: vi.fn(),
  getModuleActivity: vi.fn(),
}));

describe('analyticsCapabilityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(evaluateAnalyticsPolicyDual).mockResolvedValue({ blocked: false });
    vi.mocked(recordAnalyticsPersonalView).mockResolvedValue(undefined);
    vi.mocked(recordAnalyticsModuleView).mockResolvedValue(undefined);
  });

  it('denies when analytics policy blocks personal read', async () => {
    vi.mocked(evaluateAnalyticsPolicyDual).mockResolvedValue({ blocked: true, reason: 'NOT_OWNER' });

    await expect(getPersonalAnalyticsCapability({ userId: 'u1' })).rejects.toBeInstanceOf(
      AnalyticsAccessError
    );
  });

  it('returns personal capability via platform activity query layer', async () => {
    vi.mocked(platformActivityQuery.getRecentActivity).mockResolvedValue([
      {
        logId: 'l1',
        eventId: 'e1',
        timestamp: new Date('2026-06-22T12:00:00.000Z'),
        moduleId: 'drive',
        action: 'create',
        targetType: 'file',
        targetId: 'f1',
        metadata: { fileName: 'a.pdf' },
        actorUserId: 'u1',
      },
    ]);
    vi.mocked(platformActivityQuery.getActivitySummary).mockResolvedValue({
      totalEvents: 1,
      byModule: { drive: 1 },
    });
    vi.spyOn(prisma.moduleInstallation, 'findMany').mockResolvedValue([
      {
        moduleId: 'drive',
        installedAt: new Date(),
        module: { id: 'drive', name: 'File Hub', category: 'productivity' },
      },
    ] as never);
    vi.spyOn(prisma.file, 'count').mockResolvedValue(2 as never);
    vi.spyOn(prisma.message, 'count').mockResolvedValue(5 as never);

    const result = await getPersonalAnalyticsCapability({ userId: 'u1', timeRange: '30d' });

    expect(platformActivityQuery.getRecentActivity).toHaveBeenCalled();
    expect(platformActivityQuery.getActivitySummary).toHaveBeenCalled();
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
    expect(result.usageStats.totalSessions).toBe(1);
    expect(result.recentActivity[0]?.module).toBe('drive');
  });

  it('returns module capability via getModuleActivity', async () => {
    vi.mocked(platformActivityQuery.getModuleActivity).mockResolvedValue([]);
    vi.spyOn(prisma.moduleInstallation, 'findFirst').mockResolvedValue({
      moduleId: 'todo',
      installedAt: new Date('2026-06-01'),
      module: { id: 'todo', name: 'Todo', category: 'productivity' },
    } as never);

    const result = await getModuleAnalyticsCapability({
      userId: 'u1',
      moduleId: 'todo',
    });

    expect(platformActivityQuery.getModuleActivity).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', moduleId: 'todo' })
    );
    expect(result.module.id).toBe('todo');
    expect(result.totalUsage).toBe(0);
  });
});
