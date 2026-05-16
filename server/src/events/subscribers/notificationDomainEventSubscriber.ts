import { logger } from '../../lib/logger';
import type { DomainEvent } from '../types';

/** Placeholder until domain events carry explicit notification targets / templates. */
export function placeholderNotificationDomainEventConsumer(event: DomainEvent): void {
  void logger.debug('Domain event (notification pipeline placeholder)', {
    operation: 'domain_event_notification_placeholder',
    context: {
      domainEventId: event.id,
      type: event.type,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      actorUserId: event.actorUserId,
    },
  });
}
