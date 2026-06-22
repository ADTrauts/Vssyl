import type { DashboardAnalyticsSummary } from 'shared/types';
import { getDashboardAnalyticsSummary as getDashboardAnalyticsSummaryApi } from '../api/analytics';

export type { DashboardAnalyticsSummary };

export const DEGRADED_DASHBOARD_SUMMARY: DashboardAnalyticsSummary = {
  dashboardId: '',
  businessId: null,
  asOf: new Date(0).toISOString(),
  degraded: true,
  degradedReasons: ['unavailable'],
  summary: {
    unreadMessages: null,
    pendingTasks: null,
    upcomingEvents: null,
    storageUsedPercent: null,
    unreadNotifications: null,
  },
  sources: {
    chat: 'unavailable',
    todo: 'unavailable',
    calendar: 'unavailable',
    drive: 'unavailable',
    notifications: 'unavailable',
  },
  enterprise: null,
};

/**
 * Dashboard Analytics Facade — read-only consumer of Analytics Capability (Package 3).
 * Widget host (Dashboard) must not aggregate module APIs directly.
 */
export async function fetchDashboardAnalyticsSummary(
  token: string,
  dashboardId: string
): Promise<DashboardAnalyticsSummary> {
  if (!token) {
    throw new Error('Authentication required');
  }
  void token;
  return getDashboardAnalyticsSummaryApi(dashboardId);
}

export function toDashboardHeaderStats(summary: DashboardAnalyticsSummary) {
  return {
    unreadMessages: summary.summary.unreadMessages ?? 0,
    pendingTasks: summary.summary.pendingTasks ?? 0,
    upcomingEvents: summary.summary.upcomingEvents ?? 0,
    degraded: summary.degraded,
  };
}

export function toQuickStatsDisplay(summary: DashboardAnalyticsSummary) {
  return {
    unreadMessages: summary.summary.unreadMessages,
    pendingTasks: summary.summary.pendingTasks,
    todayEvents: summary.summary.upcomingEvents,
    storageUsedPercent: summary.summary.storageUsedPercent,
    degraded: summary.degraded,
    degradedReasons: summary.degradedReasons,
  };
}

export async function fetchEnterpriseAnalyticsProjection(
  token: string,
  dashboardId: string
): Promise<DashboardAnalyticsSummary['enterprise']> {
  const summary = await fetchDashboardAnalyticsSummary(token, dashboardId);
  return summary.enterprise;
}
