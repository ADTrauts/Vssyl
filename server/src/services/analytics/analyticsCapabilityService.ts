import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';
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

function getActivityDescription(type: string, details?: Record<string, unknown>): string {
  switch (type) {
    case 'file_created':
      return `Created ${String(details?.fileName ?? 'a file')}`;
    case 'file_edited':
      return `Edited ${String(details?.fileName ?? 'a file')}`;
    case 'file_shared':
      return `Shared ${String(details?.fileName ?? 'a file')}`;
    case 'message_sent':
      return `Sent message in ${String(details?.conversationName ?? 'a conversation')}`;
    case 'module_accessed':
      return `Accessed ${String(details?.moduleName ?? 'a module')}`;
    case 'connection_made':
      return `Connected with ${String(details?.userName ?? 'a user')}`;
    default:
      return 'Performed an action';
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

  const [activities, moduleInstallations, filesCreated, messagesSent] = await Promise.all([
    prisma.activity.findMany({
      where: {
        userId: params.userId,
        timestamp: { gte: startDate, lte: now },
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
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
  ]);

  const totalSessions = activities.length;
  const totalTime =
    activities.reduce((sum, activity) => {
      const details = activity.details as Record<string, unknown> | null;
      const duration = typeof details?.duration === 'number' ? details.duration : 0;
      return sum + duration;
    }, 0) / 3600;

  const moduleUsage = moduleInstallations.map((installation) => {
    const moduleActivities = activities.filter((activity) => {
      const details = activity.details as Record<string, unknown> | null;
      return details?.moduleId === installation.moduleId;
    });

    return {
      module: installation.module.name,
      usageCount: moduleActivities.length,
      lastUsed: moduleActivities[0]?.timestamp ?? installation.installedAt,
      totalTime:
        moduleActivities.reduce((sum, activity) => {
          const details = activity.details as Record<string, unknown> | null;
          const duration = typeof details?.duration === 'number' ? details.duration : 0;
          return sum + duration;
        }, 0) / 3600,
    };
  });

  const recentActivity = activities.map((activity) => {
    const details = activity.details as Record<string, unknown> | null;
    return {
      id: activity.id,
      type: activity.type,
      module: String(details?.moduleName ?? 'Unknown'),
      description: getActivityDescription(activity.type, details ?? undefined),
      timestamp: activity.timestamp.toISOString(),
      duration: typeof details?.duration === 'number' ? details.duration : undefined,
    };
  });

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

  const activities = await prisma.activity.findMany({
    where: {
      userId: params.userId,
      timestamp: { gte: startDate, lte: now },
      details: {
        path: ['moduleId'],
        equals: params.moduleId,
      } as Prisma.JsonFilter,
    },
    orderBy: { timestamp: 'desc' },
  });

  const totalUsage = activities.length;
  const totalTime =
    activities.reduce((sum, activity) => {
      const details = activity.details as Record<string, unknown> | null;
      const duration = typeof details?.duration === 'number' ? details.duration : 0;
      return sum + duration;
    }, 0) / 3600;

  const lastUsed = activities[0]?.timestamp ?? installation.installedAt;

  await recordAnalyticsModuleView({
    actorUserId: params.userId,
    moduleId: params.moduleId,
    timeRange,
  });

  return {
    module: installation.module,
    totalUsage,
    totalTime: Math.round(totalTime * 10) / 10,
    lastUsed: lastUsed.toISOString(),
    activities: activities.map((activity) => {
      const details = activity.details as Record<string, unknown> | null;
      return {
        id: activity.id,
        type: activity.type,
        description: getActivityDescription(activity.type, details ?? undefined),
        timestamp: activity.timestamp.toISOString(),
        duration: typeof details?.duration === 'number' ? details.duration : undefined,
      };
    }),
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
