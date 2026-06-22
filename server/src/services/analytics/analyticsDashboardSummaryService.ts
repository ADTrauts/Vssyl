import { prisma } from '../../lib/prisma';
import { TaskStatus } from '@prisma/client';
import { evaluateDashboardPolicyDual } from '../../auth/dashboardPolicyDual';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import { listEventsInRange } from '../calendarVisibilityService';
import { aggregateAccessibleDriveStorageForAIContext } from '../driveVisibilityService';
import { NotificationService } from '../notificationService';
import { getBusinessAnalytics } from '../business/businessAnalyticsService';
import type {
  AnalyticsSourceStatus,
  DashboardAnalyticsSummary,
  EnterpriseAnalyticsProjection,
} from 'shared/types';

const DEFAULT_STORAGE_LIMIT_BYTES = 10_737_418_240; // 10GB

export class AnalyticsDashboardAccessError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 400 | 403 | 404 = 403
  ) {
    super(message);
    this.name = 'AnalyticsDashboardAccessError';
  }
}

async function countUnreadMessagesForDashboard(
  userId: string,
  dashboardId: string
): Promise<number> {
  const conversations = await prisma.conversation.findMany({
    where: {
      dashboardId,
      trashedAt: null,
      participants: { some: { userId, isActive: true } },
    },
    select: { id: true },
  });

  const conversationIds = conversations.map((c) => c.id);
  if (conversationIds.length === 0) {
    return 0;
  }

  return prisma.message.count({
    where: {
      conversationId: { in: conversationIds },
      senderId: { not: userId },
      deletedAt: null,
      readReceipts: { none: { userId } },
    },
  });
}

async function countPendingTasksForDashboard(dashboardId: string): Promise<number> {
  return prisma.task.count({
    where: {
      dashboardId,
      trashedAt: null,
      status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
    },
  });
}

async function countTodayEventsForDashboard(userId: string, dashboardId: string): Promise<number> {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const events = await listEventsInRange({
    userId,
    start: now.toISOString(),
    end: endOfDay.toISOString(),
    contexts: [dashboardId],
  });

  return events.length;
}

async function resolveStorageUsedPercent(
  userId: string,
  dashboardId: string
): Promise<number> {
  const aggregate = await aggregateAccessibleDriveStorageForAIContext({
    userId,
    dashboardId,
  });

  if (DEFAULT_STORAGE_LIMIT_BYTES <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round((aggregate.storageUsedBytes / DEFAULT_STORAGE_LIMIT_BYTES) * 100)
  );
}

async function buildEnterpriseProjection(params: {
  userId: string;
  businessId: string;
}): Promise<EnterpriseAnalyticsProjection> {
  const asOf = new Date().toISOString();

  try {
    const data = await getBusinessAnalytics({
      userId: params.userId,
      businessId: params.businessId,
      timeRange: '30d',
    });

    return {
      degraded: false,
      asOf,
      businessId: params.businessId,
      metrics: [
        { id: 'members', name: 'Active members', value: data.memberCount },
        { id: 'dashboards', name: 'Dashboard tabs', value: data.dashboardCount },
        { id: 'files-created', name: 'Files created (30d)', value: data.fileCount },
        { id: 'conversations', name: 'Conversations (30d)', value: data.conversationCount },
        {
          id: 'storage-bytes',
          name: 'Storage used (bytes)',
          value: data.storageUsed,
          unit: 'bytes',
        },
      ],
      moduleRollups: [
        { module: 'drive', metric: 'filesCreated30d', value: data.fileCount },
        { module: 'chat', metric: 'conversations30d', value: data.conversationCount },
      ],
    };
  } catch {
    return {
      degraded: true,
      asOf,
      businessId: params.businessId,
      metrics: [],
      moduleRollups: [],
    };
  }
}

function markSource(
  sources: DashboardAnalyticsSummary['sources'],
  degradedReasons: string[],
  key: keyof DashboardAnalyticsSummary['sources'],
  status: AnalyticsSourceStatus,
  reason?: string
): void {
  sources[key] = status;
  if (status !== 'ok' && reason) {
    degradedReasons.push(reason);
  }
}

/**
 * Analytics Capability — canonical dashboard-scoped summary (Package 3).
 * Dashboard module consumes this contract; does not compute rollups client-side.
 */
export async function getDashboardAnalyticsSummary(params: {
  userId: string;
  dashboardId: string;
}): Promise<DashboardAnalyticsSummary> {
  const { userId, dashboardId } = params;

  if (!dashboardId) {
    throw new AnalyticsDashboardAccessError('dashboardId is required', 400);
  }

  const policy = await evaluateDashboardPolicyDual({
    userId,
    action: POLICY_ACTIONS.DASHBOARD_READ,
    resourceId: dashboardId,
    scope: { dashboardId },
  });

  if (policy.blocked) {
    throw new AnalyticsDashboardAccessError('Access denied', 403);
  }

  const dashboard = await prisma.dashboard.findFirst({
    where: { id: dashboardId, userId },
    select: {
      id: true,
      businessId: true,
      householdId: true,
      institutionId: true,
    },
  });

  if (!dashboard) {
    throw new AnalyticsDashboardAccessError('Dashboard not found', 404);
  }

  const degradedReasons: string[] = [];
  const sources: DashboardAnalyticsSummary['sources'] = {
    chat: 'unavailable',
    todo: 'unavailable',
    calendar: 'unavailable',
    drive: 'unavailable',
    notifications: 'unavailable',
  };

  let unreadMessages: number | null = null;
  let pendingTasks: number | null = null;
  let upcomingEvents: number | null = null;
  let storageUsedPercent: number | null = null;
  let unreadNotifications: number | null = null;

  try {
    unreadMessages = await countUnreadMessagesForDashboard(userId, dashboardId);
    markSource(sources, degradedReasons, 'chat', 'ok');
  } catch {
    markSource(sources, degradedReasons, 'chat', 'degraded', 'chat rollup unavailable');
  }

  try {
    pendingTasks = await countPendingTasksForDashboard(dashboardId);
    markSource(sources, degradedReasons, 'todo', 'ok');
  } catch {
    markSource(sources, degradedReasons, 'todo', 'degraded', 'todo rollup unavailable');
  }

  try {
    upcomingEvents = await countTodayEventsForDashboard(userId, dashboardId);
    markSource(sources, degradedReasons, 'calendar', 'ok');
  } catch {
    markSource(sources, degradedReasons, 'calendar', 'degraded', 'calendar rollup unavailable');
  }

  try {
    storageUsedPercent = await resolveStorageUsedPercent(userId, dashboardId);
    markSource(sources, degradedReasons, 'drive', 'ok');
  } catch {
    markSource(sources, degradedReasons, 'drive', 'degraded', 'storage rollup unavailable');
  }

  try {
    unreadNotifications = await NotificationService.getUnreadCount(userId);
    markSource(sources, degradedReasons, 'notifications', 'ok');
  } catch {
    markSource(sources, degradedReasons, 'notifications', 'degraded', 'notifications rollup unavailable');
  }

  let enterprise: EnterpriseAnalyticsProjection | null = null;
  if (dashboard.businessId) {
    enterprise = await buildEnterpriseProjection({
      userId,
      businessId: dashboard.businessId,
    });
    if (enterprise.degraded) {
      degradedReasons.push('enterprise projection degraded');
    }
  }

  const degraded =
    degradedReasons.length > 0 ||
    Object.values(sources).some((s) => s !== 'ok') ||
    (enterprise?.degraded ?? false);

  return {
    dashboardId,
    businessId: dashboard.businessId,
    asOf: new Date().toISOString(),
    degraded,
    degradedReasons,
    summary: {
      unreadMessages,
      pendingTasks,
      upcomingEvents,
      storageUsedPercent,
      unreadNotifications,
    },
    sources,
    enterprise,
  };
}

export async function getDashboardAnalyticsSummaryForAI(params: {
  userId: string;
  dashboardId: string;
}) {
  const data = await getDashboardAnalyticsSummary(params);

  return {
    summary: {
      pendingTasks: data.summary.pendingTasks,
      completedTasks: null,
      totalConversations: null,
      totalFiles: null,
      unreadNotifications: data.summary.unreadNotifications,
      unreadMessages: data.summary.unreadMessages,
      upcomingEvents: data.summary.upcomingEvents,
      storageUsedPercent: data.summary.storageUsedPercent,
    },
    details: {
      sources: data.sources,
      degradedReasons: data.degradedReasons,
    },
    dashboardContext: { id: data.dashboardId, businessId: data.businessId },
    degraded: data.degraded,
    asOf: data.asOf,
  };
}
