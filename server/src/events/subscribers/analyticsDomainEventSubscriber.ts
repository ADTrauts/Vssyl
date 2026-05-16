import { logger } from '../../lib/logger';
import type { DomainEvent } from '../types';

/** Placeholder for future analytics / BI ingestion. */
export function placeholderAnalyticsDomainEventConsumer(event: DomainEvent): void {
  void logger.debug('Domain event (analytics pipeline placeholder)', {
    operation: 'domain_event_analytics_placeholder',
    context: {
      domainEventId: event.id,
      type: event.type,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      dashboardId: event.dashboardId ?? undefined,
      businessId: event.businessId ?? undefined,
    },
  });
}
