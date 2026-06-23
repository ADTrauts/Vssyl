import { prisma } from '../../lib/prisma';
import { evaluateAnalyticsPolicyDual } from '../../auth/analyticsPolicyDual';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import {
  recordAnalyticsDashboardSummaryView,
  recordAnalyticsExport,
  recordAnalyticsModuleView,
  recordAnalyticsPersonalView,
} from './analyticsActivityService';
import {
  AnalyticsDashboardAccessError,
  getDashboardAnalyticsSummary,
  getDashboardAnalyticsSummaryForAI,
} from './analyticsDashboardSummaryService';
import {
  getActivitySummary,
  getModuleActivity,
  getRecentActivity,
} from '../platform/platformActivityQueryService';
import {
  analyticsDescriptionFromRecord,
  durationHoursFromRecord,
} from '../platform/platformActivityFeedMapper';

export { AnalyticsDashboardAccessError, getDashboardAnalyticsSummary, getDashboardAnalyticsSummaryForAI };

export class AnalyticsAccessError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 400 | 403 | 404 = 403
  ) {
    super(message);
    this.name = 'AnalyticsAccessError';
  }
}

function resolveStartDate(timeRange: string): Date {
  const now = new Date();
  switch (timeRange) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

async function assertAnalyticsRead(params: {
  userId: string;
  operation: 'personal' | 'module' | 'export' | 'dashboard_summary';
  resourceId?: string;
  scope?: { dashboardId?: string; businessId?: string };
}): Promise<void> {
  const policy = await evaluateAnalyticsPolicyDual({
    userId: params.userId,
    action: POLICY_ACTIONS.ANALYTICS_READ,
    resourceId: params.resourceId ?? params.userId,
    scope: params.scope,
    metadata: { operation: params.operation },
  });

  if (policy.blocked) {
    throw new AnalyticsAccessError('Access denied', 403);
  }
}

export async function getPersonalAnalyticsCapability(params: {
  userId: string;
  timeRange?: string;
}) {
  const timeRange = params.timeRange ?? '30d';
  await assertAnalyticsRead({
    userId: params.userId,
    operation: 'personal',
    resourceId: params.userId,
  });

  const now = new Date();
  const startDate = resolveStartDate(timeRange);

  const [activities, moduleInstallations, filesCreated, messagesSent, summary] =
    await Promise.all([
      getRecentActivity({
        userId: params.userId,
        since: startDate,
        until: now,
        limit: 50,
      }),
      prisma.moduleInstallation.findMany({
        where: { userId: params.userId, enabled: true },
        include: {
          module: { select: { id: true, name: true, category: true } },
        },
      }),
      prisma.file.count({
        where: {
          userId: params.userId,
          createdAt: { gte: startDate, lte: now },
          trashedAt: null,
        },
      }),
      prisma.message.count({
        where: {
          senderId: params.userId,
          createdAt: { gte: startDate, lte: now },
          deletedAt: null,
        },
      }),
      getActivitySummary({
        userId: params.userId,
        since: startDate,
        until: now,
      }),
    ]);

  const totalSessions = summary.totalEvents;
  const totalTime = activities.reduce(
    (sum, record) => sum + durationHoursFromRecord(record),
    0
  );

  const moduleUsage = moduleInstallations.map((installation) => {
    const moduleActivities = activities.filter(
      (record) => record.moduleId === installation.moduleId
    );

    return {
      module: installation.module.name,
      usageCount: moduleActivities.length,
      lastUsed: moduleActivities[0]?.timestamp ?? installation.installedAt,
      totalTime:
        Math.round(
          moduleActivities.reduce(
            (sum, record) => sum + durationHoursFromRecord(record),
            0
          ) * 10
        ) / 10,
    };
  });

  const recentActivity = activities.map((record) => ({
    id: record.eventId,
    type: record.action,
    module: record.moduleId,
    description: analyticsDescriptionFromRecord(record),
    timestamp: record.timestamp.toISOString(),
    duration:
      typeof record.metadata.duration === 'number'
        ? record.metadata.duration
        : undefined,
  }));

  await recordAnalyticsPersonalView({
    actorUserId: params.userId,
    timeRange,
  });

  return {
    usageStats: {
      totalSessions,
      totalTime: Math.round(totalTime * 10) / 10,
      modulesUsed: moduleInstallations.length,
      filesCreated,
      messagesSent,
      connectionsMade: 0,
    },
    moduleUsage,
    recentActivity,
  };
}

export async function getModuleAnalyticsCapability(params: {
  userId: string;
  moduleId: string;
  timeRange?: string;
}) {
  const timeRange = params.timeRange ?? '30d';
  await assertAnalyticsRead({
    userId: params.userId,
    operation: 'module',
    resourceId: params.moduleId,
  });

  const now = new Date();
  const startDate = resolveStartDate(timeRange);

  const installation = await prisma.moduleInstallation.findFirst({
    where: {
      userId: params.userId,
      moduleId: params.moduleId,
      enabled: true,
    },
    include: {
      module: { select: { id: true, name: true, category: true } },
    },
  });

  if (!installation) {
    throw new AnalyticsAccessError('Module not found or not installed', 404);
  }

  const activities = await getModuleActivity({
    userId: params.userId,
    moduleId: params.moduleId,
    since: startDate,
    until: now,
  });

  const totalUsage = activities.length;
  const totalTime =
    Math.round(
      activities.reduce(
        (sum, record) => sum + durationHoursFromRecord(record),
        0
      ) * 10
    ) / 10;

  const lastUsed = activities[0]?.timestamp ?? installation.installedAt;

  await recordAnalyticsModuleView({
    actorUserId: params.userId,
    moduleId: params.moduleId,
    timeRange,
  });

  return {
    module: installation.module,
    totalUsage,
    totalTime,
    lastUsed: lastUsed.toISOString(),
    activities: activities.map((record) => ({
      id: record.eventId,
      type: record.action,
      description: analyticsDescriptionFromRecord(record),
      timestamp: record.timestamp.toISOString(),
      duration:
        typeof record.metadata.duration === 'number'
          ? record.metadata.duration
          : undefined,
    })),
  };
}

export async function exportAnalyticsCapability(params: {
  userId: string;
  format?: string;
  timeRange?: string;
}) {
  const format = params.format ?? 'json';
  const timeRange = params.timeRange ?? '30d';

  await assertAnalyticsRead({
    userId: params.userId,
    operation: 'export',
    resourceId: params.userId,
  });

  const data = await getPersonalAnalyticsCapability({
    userId: params.userId,
    timeRange,
  });

  await recordAnalyticsExport({
    actorUserId: params.userId,
    format,
    timeRange,
  });

  if (format === 'json') {
    return {
      format: 'json' as const,
      exportedAt: new Date().toISOString(),
      timeRange,
      data,
    };
  }

  throw new AnalyticsAccessError('Export format not yet implemented', 400);
}

export async function getDashboardSummaryCapability(params: {
  userId: string;
  dashboardId: string;
}) {
  const data = await getDashboardAnalyticsSummary(params);

  await recordAnalyticsDashboardSummaryView({
    actorUserId: params.userId,
    dashboardId: params.dashboardId,
    businessId: data.businessId,
    degraded: data.degraded,
  });

  return data;
}
