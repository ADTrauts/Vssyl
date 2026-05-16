import { logger } from '../../lib/logger';
import { getChatSocketService } from '../../services/chatSocketService';
import type { DomainEvent } from '../types';

export function broadcastDomainEventOnSocket(event: DomainEvent): void {
  try {
    getChatSocketService().broadcastToUser(event.actorUserId, 'platform:domain_event', {
      id: event.id,
      type: event.type,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      dashboardId: event.dashboardId ?? undefined,
      businessId: event.businessId ?? undefined,
      householdId: event.householdId ?? undefined,
      createdAt: event.createdAt,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.warn('platform:domain_event broadcast failed', {
      operation: 'domain_event_socket_subscriber',
      error: { message: err.message, stack: err.stack },
      context: { userId: event.actorUserId, domainEventId: event.id },
    });
  }
}
