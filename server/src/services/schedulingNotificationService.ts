import { prisma } from '../lib/prisma';
import { NotificationService } from './notificationService';
import { logger } from '../lib/logger';

const SCHEDULING_WORKSPACE = (businessId: string) => `/business/${businessId}/workspace/scheduling`;

async function safeNotify(
  operation: string,
  notification: {
    userId: string;
    type: string;
    title: string;
    body?: string;
    data?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await NotificationService.createNotification(notification);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.warn('Scheduling notification failed', {
      operation,
      type: notification.type,
      userId: notification.userId,
      error: { message: err.message, stack: err.stack },
    });
  }
}

async function resolveUserIdFromEmployeePosition(
  employeePositionId: string
): Promise<string | null> {
  const position = await prisma.employeePosition.findUnique({
    where: { id: employeePositionId },
    select: { userId: true },
  });
  return position?.userId ?? null;
}

async function resolveManagerUserId(
  employeePositionId: string,
  businessId: string
): Promise<string | null> {
  const employeePosition = await prisma.employeePosition.findFirst({
    where: { id: employeePositionId, businessId },
    include: {
      position: {
        include: {
          reportsTo: {
            include: {
              employeePositions: {
                where: { businessId, active: true },
                take: 1,
                select: { userId: true },
              },
            },
          },
        },
      },
    },
  });

  return employeePosition?.position?.reportsTo?.employeePositions?.[0]?.userId ?? null;
}

async function notifyUsers(
  operation: string,
  recipientIds: string[],
  payload: Omit<Parameters<typeof safeNotify>[1], 'userId'>
): Promise<void> {
  const unique = [...new Set(recipientIds.filter(Boolean))];
  await Promise.all(
    unique.map((userId) =>
      safeNotify(operation, {
        userId,
        ...payload,
      })
    )
  );
}

export async function notifySchedulePublished(params: {
  businessId: string;
  scheduleId: string;
  scheduleName: string;
  actorUserId: string;
  employeePositionIds: Array<string | null | undefined>;
}): Promise<void> {
  const recipientIds: string[] = [];
  for (const employeePositionId of params.employeePositionIds) {
    if (!employeePositionId) continue;
    const userId = await resolveUserIdFromEmployeePosition(employeePositionId);
    if (userId && userId !== params.actorUserId) {
      recipientIds.push(userId);
    }
  }

  await notifyUsers('scheduling_notify_schedule_published', recipientIds, {
    type: 'scheduling_schedule_published',
    title: 'Schedule published',
    body: `"${params.scheduleName}" has been published.`,
    data: {
      businessId: params.businessId,
      scheduleId: params.scheduleId,
      actionUrl: SCHEDULING_WORKSPACE(params.businessId),
    },
  });
}

export async function notifyShiftAssigned(params: {
  businessId: string;
  scheduleId: string;
  shiftId: string;
  shiftTitle: string;
  employeePositionId: string;
  actorUserId: string;
}): Promise<void> {
  const userId = await resolveUserIdFromEmployeePosition(params.employeePositionId);
  if (!userId || userId === params.actorUserId) return;

  await safeNotify('scheduling_notify_shift_assigned', {
    userId,
    type: 'scheduling_shift_assigned',
    title: 'Shift assigned',
    body: `You were assigned to "${params.shiftTitle}".`,
    data: {
      businessId: params.businessId,
      scheduleId: params.scheduleId,
      shiftId: params.shiftId,
      employeePositionId: params.employeePositionId,
      actionUrl: SCHEDULING_WORKSPACE(params.businessId),
    },
  });
}

export async function notifyOpenShiftAvailable(params: {
  businessId: string;
  scheduleId: string;
  shiftId: string;
  shiftTitle: string;
  recipientUserIds?: string[];
  actorUserId: string;
}): Promise<void> {
  let recipients = params.recipientUserIds ?? [];
  if (recipients.length === 0) {
    const positions = await prisma.employeePosition.findMany({
      where: { businessId: params.businessId, active: true },
      select: { userId: true },
    });
    recipients = positions.map((position) => position.userId);
  }

  const filtered = recipients.filter((id) => id !== params.actorUserId);
  await notifyUsers('scheduling_notify_open_shift_available', filtered, {
    type: 'scheduling_open_shift_available',
    title: 'Open shift available',
    body: `An open shift "${params.shiftTitle}" is available.`,
    data: {
      businessId: params.businessId,
      scheduleId: params.scheduleId,
      shiftId: params.shiftId,
      actionUrl: SCHEDULING_WORKSPACE(params.businessId),
    },
  });
}

export async function notifySwapRequested(params: {
  businessId: string;
  swapId: string;
  shiftId: string;
  employeePositionId: string;
  actorUserId: string;
  actorName?: string | null;
}): Promise<void> {
  const managerUserId = await resolveManagerUserId(params.employeePositionId, params.businessId);
  if (!managerUserId || managerUserId === params.actorUserId) return;

  await safeNotify('scheduling_notify_swap_requested', {
    userId: managerUserId,
    type: 'scheduling_swap_requested',
    title: 'Shift swap requested',
    body: `${params.actorName || 'An employee'} requested a shift swap.`,
    data: {
      businessId: params.businessId,
      swapId: params.swapId,
      shiftId: params.shiftId,
      employeePositionId: params.employeePositionId,
      actionUrl: SCHEDULING_WORKSPACE(params.businessId),
    },
  });
}

export async function notifySwapResolved(params: {
  businessId: string;
  swapId: string;
  shiftId: string;
  outcome: 'approved' | 'denied';
  recipientUserIds: string[];
  actorUserId: string;
}): Promise<void> {
  const type =
    params.outcome === 'approved' ? 'scheduling_swap_approved' : 'scheduling_swap_denied';
  const title = params.outcome === 'approved' ? 'Shift swap approved' : 'Shift swap denied';
  const body =
    params.outcome === 'approved'
      ? 'Your shift swap request was approved.'
      : 'Your shift swap request was denied.';

  const recipients = params.recipientUserIds.filter((id) => id !== params.actorUserId);
  await notifyUsers('scheduling_notify_swap_resolved', recipients, {
    type,
    title,
    body,
    data: {
      businessId: params.businessId,
      swapId: params.swapId,
      shiftId: params.shiftId,
      outcome: params.outcome,
      actionUrl: SCHEDULING_WORKSPACE(params.businessId),
    },
  });
}
