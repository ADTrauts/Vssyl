import { describe, expect, it, vi } from 'vitest';
import { emitModuleActivityEvent } from '../../moduleActivityService';
import {
  recordAnalyticsDashboardSummaryView,
  recordAnalyticsExport,
  recordAnalyticsPersonalView,
} from '../analyticsActivityService';

vi.mock('../../moduleActivityService', () => ({
  emitModuleActivityEvent: vi.fn(),
}));

describe('analyticsActivityService', () => {
  it('records personal view with analytics module envelope', async () => {
    await recordAnalyticsPersonalView({
      actorUserId: 'u1',
      timeRange: '30d',
    });

    expect(emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        moduleId: 'analytics',
        action: 'analytics.personal.view',
        actorUserId: 'u1',
      })
    );
  });

  it('records dashboard summary view with tenant scope', async () => {
    await recordAnalyticsDashboardSummaryView({
      actorUserId: 'u1',
      dashboardId: 'd1',
      businessId: 'b1',
      householdId: null,
      degraded: false,
    });

    expect(emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'analytics.dashboard_summary.view',
        businessId: 'b1',
        visibilityScope: 'business',
      })
    );
  });

  it('records export activity', async () => {
    await recordAnalyticsExport({
      actorUserId: 'u1',
      format: 'json',
      timeRange: '30d',
    });

    expect(emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'analytics.export',
        metadata: expect.objectContaining({ format: 'json' }),
      })
    );
  });
});
