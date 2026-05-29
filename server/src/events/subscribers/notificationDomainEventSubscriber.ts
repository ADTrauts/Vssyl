import { DOMAIN_EVENT_TYPES } from '../domainEventRegistry';
import { NotificationService } from '../../services/notificationService';
import { logger } from '../../lib/logger';
import type { DomainEvent } from '../types';

function metadataString(meta: Record<string, unknown> | undefined, key: string): string | undefined {
  const v = meta?.[key];
  return typeof v === 'string' ? v : undefined;
}

/** Domain event → user notification fan-out (Batch 2). Failures logged; never roll back mutation. */
export async function notificationDomainEventConsumer(event: DomainEvent): Promise<void> {
  try {
    switch (event.type) {
      case DOMAIN_EVENT_TYPES.FILE_SHARED: {
        const recipientUserId = metadataString(event.metadata, 'recipientUserId');
        if (!recipientUserId || recipientUserId === event.actorUserId) {
          return;
        }
        await NotificationService.createNotification({
          type: 'drive_shared',
          title: 'File shared with you',
          body: 'A file was shared with you in File Hub.',
          userId: recipientUserId,
          data: {
            fileId: event.entityId,
            shareRole: metadataString(event.metadata, 'shareRole'),
            actorUserId: event.actorUserId,
          },
        });
        break;
      }
      case DOMAIN_EVENT_TYPES.BUSINESS_MEMBER_ADDED: {
        const memberUserId = metadataString(event.metadata, 'memberUserId');
        if (!memberUserId) {
          return;
        }
        await NotificationService.createNotification({
          type: 'business_invitation',
          title: 'Welcome to the business workspace',
          body: 'You have been added to a business workspace.',
          userId: memberUserId,
          data: {
            businessId: event.businessId,
            actorUserId: event.actorUserId,
          },
        });
        break;
      }
      case DOMAIN_EVENT_TYPES.MODULE_INSTALLED: {
        const moduleId = metadataString(event.metadata, 'moduleId');
        if (!moduleId || !event.actorUserId) {
          return;
        }
        await NotificationService.createNotification({
          type: 'system_alert',
          title: 'Module installed',
          body: `${moduleId} is now available in your workspace.`,
          userId: event.actorUserId,
          data: { moduleId, installationId: metadataString(event.metadata, 'installationId') },
        });
        break;
      }
      default:
        void logger.debug('Domain event (no notification mapping)', {
          operation: 'domain_event_notification_skip',
          context: { type: event.type, domainEventId: event.id },
        });
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Domain event notification consumer failed', {
      operation: 'domain_event_notification_error',
      error: { message: err.message, stack: err.stack },
      context: { type: event.type, domainEventId: event.id },
    });
  }
}
