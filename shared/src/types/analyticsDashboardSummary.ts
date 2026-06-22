export type AnalyticsSourceStatus = 'ok' | 'degraded' | 'unavailable';

export interface DashboardAnalyticsSummary {
  dashboardId: string;
  businessId: string | null;
  asOf: string;
  degraded: boolean;
  degradedReasons: string[];
  summary: {
    unreadMessages: number | null;
    pendingTasks: number | null;
    upcomingEvents: number | null;
    storageUsedPercent: number | null;
    unreadNotifications: number | null;
  };
  sources: {
    chat: AnalyticsSourceStatus;
    todo: AnalyticsSourceStatus;
    calendar: AnalyticsSourceStatus;
    drive: AnalyticsSourceStatus;
    notifications: AnalyticsSourceStatus;
  };
  enterprise: EnterpriseAnalyticsProjection | null;
}

export interface EnterpriseAnalyticsProjection {
  degraded: boolean;
  asOf: string;
  businessId: string;
  metrics: Array<{
    id: string;
    name: string;
    value: number;
    unit?: string;
  }>;
  moduleRollups: Array<{
    module: string;
    metric: string;
    value: number;
  }>;
}
