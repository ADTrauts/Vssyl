import { prisma } from '../lib/prisma';

const WIDGET_DESCRIPTIONS: Record<string, string> = {
  chat: 'Recent conversations and quick messaging',
  drive: 'Recent files and storage overview',
  calendar: 'Upcoming events and schedule',
  todo: 'Tasks, deadlines, and priorities',
  ai: 'AI assistant for quick queries',
  notifications: 'Latest alerts and updates',
  quickstats: 'Key metrics at a glance',
  quicknotes: 'Quick notes and scratchpad',
  bookmarks: 'Quick links and saved pages',
  activityfeed: 'Recent activity across modules',
  hr: 'HR metrics and employee info',
  scheduling: 'Shifts, coverage, and availability',
};

export interface DashboardOverviewContext {
  summary: {
    totalDashboards: number;
    totalWidgets: number;
    dashboardTypes: {
      personal: number;
      business: number;
      educational: number;
      household: number;
    };
    widgetTypeBreakdown: Record<string, number>;
  };
  dashboards: Array<{
    id: string;
    name: string;
    type: 'personal' | 'business' | 'educational' | 'household';
    contextName: string | null;
    widgetCount: number;
    widgetTypes: string[];
    preferences: unknown;
    createdAt: Date;
  }>;
}

export async function getDashboardOverviewContext(
  userId: string,
  dashboardId?: string
): Promise<DashboardOverviewContext> {
  const whereClause = dashboardId ? { id: dashboardId, userId } : { userId };

  const dashboards = await prisma.dashboard.findMany({
    where: whereClause,
    include: {
      widgets: {
        select: {
          id: true,
          type: true,
          config: true,
          position: true,
        },
      },
      business: { select: { id: true, name: true } },
      institution: { select: { id: true, name: true } },
      household: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const summary = {
    totalDashboards: dashboards.length,
    totalWidgets: dashboards.reduce((sum, d) => sum + d.widgets.length, 0),
    dashboardTypes: {
      personal: dashboards.filter((d) => !d.businessId && !d.institutionId && !d.householdId).length,
      business: dashboards.filter((d) => d.businessId).length,
      educational: dashboards.filter((d) => d.institutionId).length,
      household: dashboards.filter((d) => d.householdId).length,
    },
    widgetTypeBreakdown: {} as Record<string, number>,
  };

  for (const dashboard of dashboards) {
    for (const widget of dashboard.widgets) {
      summary.widgetTypeBreakdown[widget.type] = (summary.widgetTypeBreakdown[widget.type] || 0) + 1;
    }
  }

  return {
    summary,
    dashboards: dashboards.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.businessId
        ? 'business'
        : d.institutionId
          ? 'educational'
          : d.householdId
            ? 'household'
            : 'personal',
      contextName: d.business?.name || d.institution?.name || d.household?.name || null,
      widgetCount: d.widgets.length,
      widgetTypes: d.widgets.map((w) => w.type),
      preferences: d.preferences,
      createdAt: d.createdAt,
    })),
  };
}

export async function getDashboardWidgetsContext(userId: string, dashboardId: string) {
  const dashboard = await prisma.dashboard.findFirst({
    where: { id: dashboardId, userId },
    include: {
      widgets: {
        select: {
          id: true,
          type: true,
          config: true,
          position: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!dashboard) {
    return null;
  }

  return {
    dashboardId: dashboard.id,
    dashboardName: dashboard.name,
    widgetCount: dashboard.widgets.length,
    widgets: dashboard.widgets.map((w) => ({
      id: w.id,
      type: w.type,
      description: WIDGET_DESCRIPTIONS[w.type] || 'Custom widget',
      hasConfig: w.config !== null,
      position: w.position,
      addedAt: w.createdAt,
    })),
    widgetTypes: [...new Set(dashboard.widgets.map((w) => w.type))],
    availableWidgetTypes: Object.keys(WIDGET_DESCRIPTIONS),
  };
}
