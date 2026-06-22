import { describe, expect, it } from 'vitest';
import {
  DEGRADED_DASHBOARD_SUMMARY,
  toDashboardHeaderStats,
  toQuickStatsDisplay,
} from '../dashboardAnalyticsFacade';

describe('dashboardAnalyticsFacade', () => {
  it('toDashboardHeaderStats uses zeros only when values are null in degraded summary', () => {
    const stats = toDashboardHeaderStats(DEGRADED_DASHBOARD_SUMMARY);
    expect(stats.unreadMessages).toBe(0);
    expect(stats.degraded).toBe(true);
  });

  it('toQuickStatsDisplay preserves nulls for strict degraded display', () => {
    const display = toQuickStatsDisplay({
      ...DEGRADED_DASHBOARD_SUMMARY,
      dashboardId: 'd1',
      summary: {
        unreadMessages: null,
        pendingTasks: null,
        upcomingEvents: null,
        storageUsedPercent: null,
        unreadNotifications: null,
      },
    });

    expect(display.unreadMessages).toBeNull();
    expect(display.storageUsedPercent).toBeNull();
    expect(display.degraded).toBe(true);
  });

  it('toQuickStatsDisplay maps analytics summary fields', () => {
    const display = toQuickStatsDisplay({
      dashboardId: 'd1',
      businessId: null,
      asOf: new Date().toISOString(),
      degraded: false,
      degradedReasons: [],
      summary: {
        unreadMessages: 4,
        pendingTasks: 2,
        upcomingEvents: 1,
        storageUsedPercent: 15,
        unreadNotifications: 0,
      },
      sources: {
        chat: 'ok',
        todo: 'ok',
        calendar: 'ok',
        drive: 'ok',
        notifications: 'ok',
      },
      enterprise: null,
    });

    expect(display.unreadMessages).toBe(4);
    expect(display.todayEvents).toBe(1);
    expect(display.degraded).toBe(false);
  });
});
