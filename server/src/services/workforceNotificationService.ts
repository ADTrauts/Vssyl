import { WorkforceDeliveryStatus, WorkforcePriority } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotificationService } from './notificationService';
import { logger } from '../lib/logger';
import { WORKFORCE_COMMS_MODULE_ID } from './workforceServiceShared';

const IN_APP_CHANNEL = 'in_app';

const WORKFORCE_COMMS_WORKSPACE = (businessId: string) =>
  `/business/${businessId}/workspace/workforce-comms`;

function communicationActionUrl(businessId: string, communicationId: string): string {
  return `${WORKFORCE_COMMS_WORKSPACE(businessId)}/communications/${communicationId}`;
}

async function recordDeliveryLog(params: {
  communicationId: string;
  userId: string;
  notificationId?: string | null;
  status: WorkforceDeliveryStatus;
}): Promise<void> {
  try {
    await prisma.workforceDeliveryLog.create({
      data: {
        communicationId: params.communicationId,
        userId: params.userId,
        notificationId: params.notificationId ?? null,
        channel: IN_APP_CHANNEL,
        status: params.status,
        deliveredAt: params.status === WorkforceDeliveryStatus.SENT ? new Date() : null,
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.warn('Workforce delivery log write failed', {
      operation: 'workforce_delivery_log_create',
      communicationId: params.communicationId,
      userId: params.userId,
      error: { message: err.message, stack: err.stack },
    });
  }
}

async function safeNotify(
  operation: string,
  notification: {
    userId: string;
    type: string;
    title: string;
    body?: string;
    data?: Record<string, unknown>;
  }
): Promise<{ notificationId: string | null }> {
  try {
    const created = await NotificationService.createNotification(notification);
    const notificationId =
      created && typeof created === 'object' && 'id' in created && typeof created.id === 'string'
        ? created.id
        : null;
    return { notificationId };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.warn('Workforce notification failed', {
      operation,
      type: notification.type,
      userId: notification.userId,
      error: { message: err.message, stack: err.stack },
    });
    return { notificationId: null };
  }
}

function mapPriorityForData(priority: WorkforcePriority): string {
  return priority.toLowerCase();
}

export async function notifyCommunicationPublished(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
  title: string;
  summary?: string | null;
  communicationType: string;
  priority: WorkforcePriority;
  requiresAck: boolean;
  campaignId?: string | null;
  recipientUserIds: string[];
}): Promise<void> {
  const uniqueRecipients = [...new Set(params.recipientUserIds.filter(Boolean))];

  await Promise.all(
    uniqueRecipients.map(async (userId) => {
      const notificationType = params.requiresAck
        ? 'workforce_ack_required'
        : 'workforce_communication_published';

      const title = params.requiresAck ? 'Acknowledgement required' : 'New workforce communication';
      const body = params.summary?.trim()
        ? params.summary.trim()
        : `"${params.title}" was published.`;

      const { notificationId } = await safeNotify('workforce_notify_communication_published', {
        userId,
        type: notificationType,
        title,
        body,
        data: {
          moduleId: WORKFORCE_COMMS_MODULE_ID,
          businessId: params.businessId,
          communicationId: params.communicationId,
          communicationType: params.communicationType,
          priority: mapPriorityForData(params.priority),
          requiresAck: params.requiresAck,
          ...(params.campaignId ? { campaignId: params.campaignId } : {}),
          actionUrl: communicationActionUrl(params.businessId, params.communicationId),
        },
      });

      await recordDeliveryLog({
        communicationId: params.communicationId,
        userId,
        notificationId,
        status:
          notificationId !== null
            ? WorkforceDeliveryStatus.SENT
            : WorkforceDeliveryStatus.FAILED,
      });
    })
  );
}

async function resolveCampaignCompletedRecipients(params: {
  businessId: string;
  authorUserId: string;
  actorUserId: string;
}): Promise<string[]> {
  const admins = await prisma.businessMember.findMany({
    where: {
      businessId: params.businessId,
      isActive: true,
      role: 'ADMIN',
    },
    select: { userId: true },
  });

  const recipientIds = new Set<string>([params.authorUserId]);
  for (const admin of admins) {
    recipientIds.add(admin.userId);
  }
  recipientIds.delete(params.actorUserId);
  return [...recipientIds];
}

export async function notifyCampaignCompleted(params: {
  actorUserId: string;
  businessId: string;
  campaignId: string;
  campaignName: string;
  authorUserId: string;
  communicationCount: number;
}): Promise<void> {
  const recipients = await resolveCampaignCompletedRecipients({
    businessId: params.businessId,
    authorUserId: params.authorUserId,
    actorUserId: params.actorUserId,
  });

  await Promise.all(
    recipients.map((userId) =>
      safeNotify('workforce_notify_campaign_completed', {
        userId,
        type: 'workforce_campaign_completed',
        title: 'Campaign completed',
        body: `"${params.campaignName}" is complete (${params.communicationCount} communication${
          params.communicationCount === 1 ? '' : 's'
        }).`,
        data: {
          moduleId: WORKFORCE_COMMS_MODULE_ID,
          businessId: params.businessId,
          campaignId: params.campaignId,
          communicationCount: params.communicationCount,
          actionUrl: WORKFORCE_COMMS_WORKSPACE(params.businessId),
        },
      })
    )
  );
}
