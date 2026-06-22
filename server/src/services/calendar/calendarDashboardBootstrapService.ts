import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';

/**
 * Calendar-owned bootstrap triggered by dashboard.tab.created (personal context).
 * Replaces inline calendar provisioning in dashboardService (DASH-M2).
 */
export async function ensurePersonalPrimaryCalendarForUser(params: {
  actorUserId: string;
  dashboardName: string;
}): Promise<void> {
  const { actorUserId, dashboardName } = params;

  try {
    const existingCalendar = await prisma.calendar.findFirst({
      where: {
        contextType: 'PERSONAL',
        contextId: actorUserId,
        isPrimary: true,
      },
    });

    if (existingCalendar) {
      return;
    }

    await prisma.calendar.create({
      data: {
        name: dashboardName,
        contextType: 'PERSONAL',
        contextId: actorUserId,
        isPrimary: true,
        isSystem: true,
        isDeletable: false,
        defaultReminderMinutes: 10,
        members: {
          create: {
            userId: actorUserId,
            role: 'OWNER',
          },
        },
      },
    });

    await logger.info('Calendar module provisioned personal primary calendar from dashboard tab', {
      operation: 'calendar_dashboard_bootstrap',
      context: { userId: actorUserId, dashboardName },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Failed to bootstrap personal primary calendar from dashboard tab', {
      operation: 'calendar_dashboard_bootstrap',
      error: { message: err.message, stack: err.stack },
      context: { userId: actorUserId },
    });
  }
}
