import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../../lib/prisma';
import { evaluateDashboardPolicyDual } from '../../../auth/dashboardPolicyDual';
import { listEventsInRange } from '../../calendarVisibilityService';
import { aggregateAccessibleDriveStorageForAIContext } from '../../driveVisibilityService';
import { NotificationService } from '../../notificationService';
import { getBusinessAnalytics } from '../../business/businessAnalyticsService';
import {
  AnalyticsDashboardAccessError,
  getDashboardAnalyticsSummary,
} from '../analyticsDashboardSummaryService';

vi.mock('../../../auth/dashboardPolicyDual', () => ({
  evaluateDashboardPolicyDual: vi.fn(),
}));

vi.mock('../../calendarVisibilityService', () => ({
  listEventsInRange: vi.fn(),
}));

vi.mock('../../driveVisibilityService', () => ({
  aggregateAccessibleDriveStorageForAIContext: vi.fn(),
}));

vi.mock('../../notificationService', () => ({
  NotificationService: {
    getUnreadCount: vi.fn(),
  },
}));

vi.mock('../../business/businessAnalyticsService', () => ({
  getBusinessAnalytics: vi.fn(),
}));

describe('analyticsDashboardSummaryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(evaluateDashboardPolicyDual).mockResolvedValue({ blocked: false });
    vi.mocked(listEventsInRange).mockResolvedValue([{ id: 'e1' }] as never);
    vi.mocked(aggregateAccessibleDriveStorageForAIContext).mockResolvedValue({
      totalFiles: 1,
      documentFiles: 1,
      imageFiles: 0,
      videoFiles: 0,
      storageUsedBytes: 1_073_741_824,
    });
    vi.mocked(NotificationService.getUnreadCount).mockResolvedValue(2);
  });

  it('denies when dashboard policy blocks', async () => {
    vi.mocked(evaluateDashboardPolicyDual).mockResolvedValue({ blocked: true, reason: 'NOT_MEMBER' });

    await expect(
      getDashboardAnalyticsSummary({ userId: 'u1', dashboardId: 'd1' })
    ).rejects.toBeInstanceOf(AnalyticsDashboardAccessError);
  });

  it('returns summary rollups for authorized dashboard', async () => {
    vi.spyOn(prisma.dashboard, 'findFirst').mockResolvedValue({
      id: 'd1',
      businessId: null,
      householdId: null,
      institutionId: null,
    } as never);
    vi.spyOn(prisma.conversation, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.task, 'count').mockResolvedValue(3 as never);

    const result = await getDashboardAnalyticsSummary({ userId: 'u1', dashboardId: 'd1' });

    expect(result.summary.pendingTasks).toBe(3);
    expect(result.summary.upcomingEvents).toBe(1);
    expect(result.summary.storageUsedPercent).toBe(10);
    expect(result.summary.unreadNotifications).toBe(2);
    expect(result.sources.todo).toBe('ok');
  });

  it('includes enterprise projection for business dashboards', async () => {
    vi.spyOn(prisma.dashboard, 'findFirst').mockResolvedValue({
      id: 'd1',
      businessId: 'b1',
      householdId: null,
      institutionId: null,
    } as never);
    vi.spyOn(prisma.conversation, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.task, 'count').mockResolvedValue(0 as never);
    vi.mocked(getBusinessAnalytics).mockResolvedValue({
      memberCount: 5,
      dashboardCount: 2,
      fileCount: 10,
      conversationCount: 3,
      storageUsed: 1000,
      timeRange: '30d',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    });

    const result = await getDashboardAnalyticsSummary({ userId: 'u1', dashboardId: 'd1' });

    expect(result.enterprise?.businessId).toBe('b1');
    expect(result.enterprise?.metrics.length).toBeGreaterThan(0);
  });
});
